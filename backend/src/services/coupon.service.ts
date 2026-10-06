import { money, couponDiscount } from '../utils/money';
import prisma from '../repositories/prisma';
import { ApiError } from '../utils/apiError';

export class CouponService {
  static async validateCoupon(code: string, subtotal: import('@prisma/client').Prisma.Decimal.Value) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw ApiError.badRequest('Coupon is invalid or inactive');
    }

    if (coupon.startsAt && coupon.startsAt > new Date()) {
      throw ApiError.badRequest('Coupon is not yet active');
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw ApiError.badRequest('Coupon has expired');
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw ApiError.badRequest('Coupon usage limit reached');
    }

    if (coupon.minSpend && money(subtotal).lt(coupon.minSpend)) {
      throw ApiError.badRequest(`Minimum spend of ?${coupon.minSpend} required for this coupon`);
    }

    const discount = couponDiscount(money(subtotal), coupon);

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        value: Number(coupon.value),
      },
      discount: discount,
    };
  }

  static async listAdminCoupons() {
    return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  static async createCoupon(data: any) {
    return prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        value: data.value,
        minSpend: data.minSpend,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        perCustomerLimit: data.perCustomerLimit,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async updateCoupon(id: string, data: any) {
    return prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.startsAt && { startsAt: new Date(data.startsAt) }),
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt) }),
      },
    });
  }

  static async deleteCoupon(id: string) {
    return prisma.coupon.delete({ where: { id } });
  }
}
