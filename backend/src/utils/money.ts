import { Prisma } from '@prisma/client';
import { ApiError } from './apiError';

// Database/API decimals are naira; calculations always use exact decimal arithmetic.
export const money = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);
export function kobo(value: Prisma.Decimal.Value): number {
  const amount = money(value).mul(100);
  if (!amount.isInteger() || amount.isNegative() || amount.gt(Number.MAX_SAFE_INTEGER)) {
    throw ApiError.badRequest('Invalid monetary amount');
  }
  return amount.toNumber();
}
export function couponDiscount(subtotal: Prisma.Decimal, coupon: {
  discountType: string; value: Prisma.Decimal; maxDiscount: Prisma.Decimal | null;
}): Prisma.Decimal {
  let discount = coupon.discountType === 'PERCENTAGE'
    ? subtotal.mul(coupon.value).div(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN)
    : money(coupon.value);
  if (coupon.maxDiscount) discount = Prisma.Decimal.min(discount, coupon.maxDiscount);
  return Prisma.Decimal.max(0, Prisma.Decimal.min(subtotal, discount));
}
