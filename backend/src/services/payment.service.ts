import { SettingsService } from './settings.service';
import { orderInventorySnapshot, deductOrderInventory, releaseOrderInventory } from './inventoryPolicy.service';
import { AdminNotificationService } from './adminNotification.service';
import { paymentModeDefault } from './paymentConfiguration';
import prisma from '../repositories/prisma';
import { PaystackService } from '../integrations/paystack';
import { ApiError } from '../utils/apiError';
import { kobo } from '../utils/money';
import { serializable } from '../database/transaction';
import { ENV } from '../config/env';
import { RefundService } from './refund.service';
import { validatePayment } from '../utils/paymentValidation';
import { randomUUID } from 'crypto';

export class PaymentService {
  static async initializePayment(orderId: string, customerId: string) {
    const record = await serializable(async tx => {
      const order = await tx.order.findFirst({ where: { id: orderId, customerId }, include: { customer: true } });
      if (!order) throw ApiError.notFound('Order not found');
      if (order.status !== 'PAYMENT_PENDING' || !order.expiresAt || order.expiresAt <= new Date()) throw ApiError.conflict('Checkout expired or processed');
      const {settings}=await SettingsService.get(tx);
      if(settings.general.status==='MAINTENANCE' || !settings.payments.enabled)throw ApiError.conflict('Checkout payments are temporarily unavailable');
      const snapshot=orderInventorySnapshot({...order,items:[]});
      const pending = await tx.payment.findFirst({ where: { orderId, status: 'PENDING' } });
      const payment = pending || await tx.payment.create({ data: { orderId,
        reference: `NOB-PAY-${order.id}-${randomUUID()}`, amount: order.totalAmount, currency:snapshot.currency, gatewayPayload:{mode:order.settingsSnapshot?snapshot.paymentMode:paymentModeDefault()} } });
      return { ...payment, email: order.customer.email, channels:[...(settings.payments.card?['card']:[]),...(settings.payments.bankTransfer?['bank_transfer']:[])] };
    });
    if (record.authorizationUrl) return { reference: record.reference, authorization_url: record.authorizationUrl };
    const response = await PaystackService.initializePayment({ email: record.email,
      amount: kobo(record.amount), reference: record.reference, currency:record.currency, mode:(record.gatewayPayload as any)?.mode, channels:record.channels,
      callbackUrl: `${ENV.FRONTEND_URL}/checkout?reference=${encodeURIComponent(record.reference)}` });
    await prisma.payment.update({ where: { id: record.id }, data: { authorizationUrl: response.authorization_url } });
    return response;
  }

  static async verifyPayment(reference: string, customerId: string) {
    const payment = await prisma.payment.findFirst({ where: { reference, order: { customerId } } });
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.status === 'SUCCESS') return payment;
    const verification = await PaystackService.verifyPayment(reference,(payment.gatewayPayload as any)?.mode);
    if (verification.reference !== reference || verification.currency !== payment.currency || verification.amount !== kobo(payment.amount)) throw ApiError.badRequest('Gateway response does not match this payment');
    if (['failed','abandoned','reversed'].includes(verification.status)) {
      await serializable(async tx=>{const changed=await tx.payment.updateMany({where:{id:payment.id,status:'PENDING'},data:{status:'FAILED',gatewayPayload:{...(payment.gatewayPayload as object || {}),status:verification.status,reference}}});if(changed.count)await AdminNotificationService.emit('failedPayment','Payment failed',reference,'/admin/payments',reference,tx);});
      throw ApiError.badRequest('Payment did not complete. Retry payment from your account while the checkout is valid.');
    }
    return this.confirm(reference, verification);
  }

  static async confirm(reference: string, verification: any) {
    return serializable(async tx => {
      const payment = await tx.payment.findUnique({ where: { reference }, include: {
        order: { include: { items: true, customer: true, couponUsages: true } } } });
      if (!payment) throw ApiError.notFound('Payment not found');
      validatePayment(verification, { reference: payment.reference, currency: payment.currency,
        amount: payment.amount, email: payment.order.customer.email });
      if (payment.status === 'SUCCESS') return payment;
      const order = payment.order;
      if (order.stockCommitted) {
        const eventKey = `duplicate-charge:${reference}`;
        if (!await tx.paymentTransaction.findUnique({ where: { eventKey } })) {
          await tx.paymentTransaction.create({ data: { paymentId: payment.id, eventKey, status: 'SUCCESS' } });
          await tx.notification.create({ data: { title: 'Duplicate charge needs reconciliation', message: `Review and refund ${reference} in Paystack.`, linkUrl: '/admin/payments' } });
        }
        return { ...payment, reconciliationRequired: true };
      }
      if (order.status !== 'PAYMENT_PENDING' || !order.expiresAt || order.expiresAt <= new Date()) {
        if (order.status === 'PAYMENT_PENDING') {
          await releaseOrderInventory(tx,order,'Expired checkout');
          await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', statusHistory: { create: { status: 'CANCELLED' } } } });
        }
        const event = await tx.paymentTransaction.findUnique({ where: { eventKey: `late:${reference}` } });
        if (!event) {
          await tx.paymentTransaction.create({ data: { paymentId: payment.id, eventKey: `late:${reference}`, status: 'SUCCESS' } });
          await tx.payment.update({ where: { id: payment.id }, data: { gatewayPayload: { mode:(payment.gatewayPayload as any)?.mode || paymentModeDefault(), id: verification.id, reference: verification.reference, status: verification.status, amount: verification.amount, currency: verification.currency, channel: verification.channel, paid_at: verification.paid_at } } });
          await tx.notification.create({ data: { title: 'Payment needs reconciliation', message: `Late payment ${reference}. Verify and refund in Paystack.`, linkUrl: '/admin/payments' } });
        }
        return { ...payment, reconciliationRequired: true };
      }
      const snapshot=orderInventorySnapshot(order);
      if(snapshot.stockDeduction!=='CONFIRMATION' || snapshot.confirmation==='AUTOMATIC')await deductOrderInventory(tx,order,`Payment for ${order.orderNumber}`);
      if(snapshot.stockDeduction==='PAYMENT' || snapshot.stockDeduction==='CONFIRMATION' && snapshot.confirmation==='AUTOMATIC')for(const item of order.items)if(item.variantId)await AdminNotificationService.stock(item.variantId,tx);
      for (const use of order.couponUsages) await tx.coupon.update({ where: { id: use.couponId }, data: { usageCount: { increment: 1 } } });
      const updated = await tx.payment.update({ where: { id: payment.id }, data: {
        status: 'SUCCESS', paidAt: new Date(verification.paid_at || Date.now()), channel: verification.channel,
        gatewayPayload: { mode:(payment.gatewayPayload as any)?.mode || paymentModeDefault(), id: verification.id, reference: verification.reference, status: verification.status, amount: verification.amount, currency: verification.currency, channel: verification.channel, paid_at: verification.paid_at } } });
      await tx.paymentTransaction.create({ data: { paymentId: payment.id, eventKey: `success:${reference}`, status: 'SUCCESS' } });
      await tx.order.update({ where: { id: order.id }, data: { status: snapshot.confirmation==='AUTOMATIC'?'PROCESSING':'PAID', stockCommitted: true, statusHistory: { create: { status: snapshot.confirmation==='AUTOMATIC'?'PROCESSING':'PAID' } } } });
      await tx.notification.createMany({ data: [
        { customerId: order.customerId, title: 'Payment received', message: `Payment for ${order.orderNumber} confirmed`, linkUrl: `/account/orders/${order.id}` } ] });
      await AdminNotificationService.emit('successfulPayment','Payment successful',order.orderNumber,'/admin/payments',reference,tx);
      await tx.emailJob.create({ data: { key: `payment:${reference}`, recipient: order.customer.email,
        subject: 'NOBELLE payment confirmation', html: `<p>Payment received for order ${order.orderNumber}. Total: ${payment.currency} ${order.totalAmount}.</p>` } });
      return updated;
    });
  }

  static async handleWebhook(signature: string, rawBody: Buffer) {
    if (!PaystackService.verifyWebhookSignature(signature, rawBody)) throw ApiError.unauthorized('Invalid webhook signature');
    const payload = JSON.parse(rawBody.toString('utf8'));
    if (payload.event === 'refund.processed' || payload.event === 'refund.failed') await RefundService.synchronize(String(payload.data.id));
    if (payload.event === 'charge.success') {
      const payment = await prisma.payment.findUnique({ where: { reference: payload.data.reference } });
      if (payment) await this.confirm(payment.reference, payload.data);
    }
    return { received: true };
  }
}
