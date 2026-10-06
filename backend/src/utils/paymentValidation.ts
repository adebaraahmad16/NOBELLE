import { ApiError } from './apiError';
import { kobo } from './money';
import { Prisma } from '@prisma/client';
export function validatePayment(data: any, expected: { reference: string; currency: string; amount: Prisma.Decimal.Value; email: string }) {
  if (data?.status !== 'success' || data.reference !== expected.reference || data.currency !== expected.currency ||
      data.amount !== kobo(expected.amount) || data.customer?.email?.toLowerCase() !== expected.email.toLowerCase()) {
    throw ApiError.badRequest('Payment details do not match this order');
  }
}
