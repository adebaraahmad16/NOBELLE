import { SettingsService } from './settings.service';
import { AdminNotificationService } from './adminNotification.service';
import { paymentCredentials, paymentModeDefault, type PaymentMode } from './paymentConfiguration';
import axios from 'axios';
import prisma from '../repositories/prisma';
import { serializable } from '../database/transaction';
import { ApiError } from '../utils/apiError';
import { money, kobo } from '../utils/money';

const options = (mode:PaymentMode=paymentModeDefault()) => ({ headers: { Authorization: `Bearer ${paymentCredentials(mode).secret}` }, timeout: 15000 });

export class RefundService {
  static async initiate(returnId: string, adminId: string) {
    const record = await serializable(async tx => {
      const existing = await tx.paymentRefund.findUnique({ where: { returnId }, include: { payment: true } });
      if (existing) return existing;
      const request = await tx.return.findUnique({ where: { id: returnId }, include: { items: { include: { orderItem: true } }, order: true } });
      const {settings}=await SettingsService.get(tx);
      if(settings.orders.refundRule==='DISABLED')throw ApiError.conflict('Refunds are disabled');
      if(!request || !(settings.orders.refundRule==='MANUAL_REVIEW'?['APPROVED','RECEIVED']:['RECEIVED']).includes(request.status))throw ApiError.conflict('This return is not eligible for refund');
      const payment = await tx.payment.findFirst({ where: { orderId: request.orderId, status: 'SUCCESS' } });
      if (!payment) throw ApiError.conflict('Successful payment not found');
      let amount = money(0);
      for (const item of request.items) amount = amount.add(money(item.orderItem.unitPrice).mul(item.quantity)
        .mul(request.order.subtotal.sub(request.order.discountTotal)).div(request.order.subtotal));
      amount = amount.toDecimalPlaces(2, 1);
      if (amount.lte(0)) throw ApiError.badRequest('No refundable amount');
      const previous = await tx.paymentRefund.aggregate({ where: { paymentId: payment.id }, _sum: { amount: true } });
      if (amount.add(previous._sum.amount || 0).gt(payment.amount)) throw ApiError.conflict('Refund exceeds payment');
      const refund = await tx.paymentRefund.create({ data: { returnId, paymentId: payment.id, amount }, include: { payment: true } });
      await tx.activityLog.create({ data: { adminId, action: 'INITIATE_REFUND', entity: 'Return', entityId: returnId, metadata: { amount: amount.toFixed(2) } } });
      await AdminNotificationService.emit('refundRequest','Refund request',request.order.orderNumber,'/admin/returns',refund.id,tx);
      return refund;
    });
    if (record.gatewayId) return this.synchronize(record.gatewayId);
    const claim = await prisma.paymentRefund.updateMany({ where: { id: record.id, status: 'REQUESTED' }, data: { status: 'PROCESSING' } });
    if (!claim.count) return { id: record.id, status: record.status, reconciliationRequired: !record.gatewayId };
    // Never repeat an uncertain POST: a timeout may mean Paystack already accepted it.
    try {
      const response = await axios.post('https://api.paystack.co/refund', { transaction: record.payment.reference,
        amount: kobo(record.amount), currency: record.payment.currency, merchant_note: `NOBELLE:${record.id}` }, options((record.payment.gatewayPayload as any)?.mode));
      await prisma.paymentRefund.update({ where: { id: record.id }, data: { gatewayId: String(response.data.data.id) } });
      return this.synchronize(String(response.data.data.id));
    } catch {
      await prisma.notification.create({ data: { title: 'Refund needs reconciliation', message: `Refund ${record.id} needs provider review before any retry.`, linkUrl: '/admin/returns' } });
      throw ApiError.conflict('Refund submission needs reconciliation in Paystack. Do not submit another refund.');
    }
  }

  static async synchronize(gatewayId: string) {
    const known=await prisma.paymentRefund.findFirst({where:{gatewayId},include:{payment:true}});
    if(!known)return {received:true};
    const response = await axios.get(`https://api.paystack.co/refund/${encodeURIComponent(gatewayId)}`, options((known.payment.gatewayPayload as any)?.mode));
    const gateway = response.data.data;
    return serializable(async tx => {
      const refund = await tx.paymentRefund.findFirst({ where: { OR: [{ gatewayId }, { id: String(gateway.merchant_note || '').replace(/^NOBELLE:/, '') }] }, include: { payment: true, returnRequest: { include: { customer: { select: { email: true } } } } } });
      if (!refund) return { received: true };
      if (gateway.amount !== kobo(refund.amount) || gateway.currency !== refund.payment.currency || gateway.transaction?.reference !== refund.payment.reference) throw ApiError.badRequest('Refund details do not match');
      if (refund.status === 'SUCCESS') return refund;
      if (gateway.status !== 'processed') return tx.paymentRefund.update({ where: { id: refund.id }, data: { gatewayId, status: gateway.status === 'failed' ? 'FAILED' : 'PROCESSING' } });
      const updated = await tx.paymentRefund.update({ where: { id: refund.id }, data: { gatewayId, status: 'SUCCESS', processedAt: new Date() } });
      await tx.return.update({ where: { id: refund.returnId }, data: { status: 'REFUNDED' } });
      const ordered = await tx.orderItem.aggregate({ where: { orderId: refund.payment.orderId }, _sum: { quantity: true } });
      const refundedItems = await tx.returnItem.aggregate({ where: { returnReq: { orderId: refund.payment.orderId, status: { in: ['REFUNDED','COMPLETED'] } } }, _sum: { quantity: true } });
      if (ordered._sum.quantity === refundedItems._sum.quantity) await tx.order.update({ where: { id: refund.payment.orderId }, data: { status: 'REFUNDED', statusHistory: { create: { status: 'REFUNDED' } } } });
      await tx.notification.create({ data: { customerId: refund.returnRequest.customerId, title: 'Refund processed', message: `${refund.payment.currency} ${refund.amount} refunded for your return`, linkUrl: '/account' } });
      await tx.emailJob.create({ data: { key: `refund:${refund.id}`, recipient: refund.returnRequest.customer.email, subject: 'NOBELLE refund processed', html: `<p>Your refund of ${refund.payment.currency} ${refund.amount} has been processed.</p>` } });
      return updated;
    });
  }
}
