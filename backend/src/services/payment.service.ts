import prisma from '../repositories/prisma';
import { PaystackService } from '../integrations/paystack';
import { ApiError } from '../utils/apiError';
import { EmailService } from '../integrations/email';

export class PaymentService {
  static async initializePayment(orderId: string, customerId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { customer: true },
    });

    if (!order) throw ApiError.notFound('Order not found');
    if (order.status !== 'PENDING') throw ApiError.badRequest('Order is already processed or cancelled');

    const reference = `PAY-${order.orderNumber}-${Date.now()}`;
    const amount = Number(order.totalAmount);

    const paystackData = await PaystackService.initializePayment({
      email: order.customer.email,
      amount,
      reference,
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        reference,
        amount,
        currency: 'NGN',
        gateway: 'PAYSTACK',
        status: 'PENDING',
      },
    });

    return paystackData;
  }

  static async verifyPayment(reference: string) {
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { order: { include: { customer: true } } },
    });

    if (!payment) throw ApiError.notFound('Payment record not found');
    if (payment.status === 'SUCCESS') return payment;

    const verification = await PaystackService.verifyPayment(reference);

    if (verification.status === 'success') {
      const updatedPayment = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            paidAt: new Date(verification.paid_at || Date.now()),
            channel: verification.channel,
            gatewayPayload: verification,
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'PROCESSING' },
        });

        return p;
      });

      // Send email confirmation
      await EmailService.sendOrderConfirmation(
        payment.order.customer.email,
        payment.order.orderNumber,
        payment.order.totalAmount.toString()
      );

      return updatedPayment;
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', gatewayPayload: verification },
      });
      throw ApiError.badRequest('Payment verification failed');
    }
  }

  static async handleWebhook(signature: string, payload: any) {
    const isValid = PaystackService.verifyWebhookSignature(signature, payload);
    if (!isValid) throw ApiError.badRequest('Invalid webhook signature');

    if (payload.event === 'charge.success') {
      const { reference } = payload.data;
      const payment = await prisma.payment.findUnique({
        where: { reference },
        include: { order: { include: { customer: true } } },
      });

      if (!payment || payment.status === 'SUCCESS') {
        // Idempotency: skip if already marked SUCCESS
        return { message: 'Already processed or not found' };
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            paidAt: new Date(),
            channel: payload.data.channel,
            gatewayPayload: payload.data,
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'PROCESSING' },
        });
      });

      await EmailService.sendOrderConfirmation(
        payment.order.customer.email,
        payment.order.orderNumber,
        payment.order.totalAmount.toString()
      );
    }

    return { received: true };
  }
}
