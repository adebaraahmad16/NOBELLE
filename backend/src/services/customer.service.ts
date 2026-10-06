import { SettingsService } from './settings.service';
import { orderInventorySnapshot } from './inventoryPolicy.service';
import { AdminNotificationService } from './adminNotification.service';
import prisma from '../repositories/prisma';
import { serializable } from '../database/transaction';
import { ApiError } from '../utils/apiError';
import { PasswordUtil } from '../utils/password';
import { TokenUtil } from '../utils/token';
import { ENV } from '../config/env';
import { randomBytes, randomUUID } from 'crypto';

export class CustomerService {
  static async recovery(email: string) {
    const customer = await prisma.customer.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (customer?.isActive && !customer.deletedAt) {
      const token = randomBytes(32).toString('hex');
      await serializable(async tx => {
        await tx.passwordResetToken.updateMany({ where: { customerId: customer.id, usedAt: null }, data: { revoked: true } });
        await tx.passwordResetToken.create({ data: { customerId: customer.id, userType: 'CUSTOMER', tokenHash: TokenUtil.hashToken(token),
          expiresAt: new Date(Date.now() + 30 * 60_000) } });
        await tx.emailJob.create({ data: { key: `reset:${randomUUID()}`, recipient: customer.email,
          subject: 'Reset your NOBELLE password', html: `<p><a href="${ENV.FRONTEND_URL}/account?reset=${token}">Reset password</a>. Expires in 30 minutes.</p>` } });
      });
    }
    return { sent: true };
  }

  static async reset(token: string, password: string) {
    const passwordHash = await PasswordUtil.hash(password);
    return serializable(async tx => {
      const record = await tx.passwordResetToken.findUnique({ where: { tokenHash: TokenUtil.hashToken(token) } });
      if (!record?.customerId || record.userType !== 'CUSTOMER' || record.usedAt || record.revoked || record.expiresAt <= new Date()) throw ApiError.badRequest('Invalid or expired reset link');
      await tx.customer.update({ where: { id: record.customerId }, data: { passwordHash } });
      await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      await tx.refreshToken.updateMany({ where: { customerId: record.customerId }, data: { revoked: true } });
      return { reset: true };
    });
  }

  static async verifyEmail(token: string) {
    return serializable(async tx => {
      const record = await tx.emailVerificationToken.findUnique({ where: { tokenHash: TokenUtil.hashToken(token) } });
      if (!record || record.usedAt || record.expiresAt <= new Date()) throw ApiError.badRequest('Invalid verification link');
      await tx.customer.update({ where: { id: record.customerId }, data: { isVerified: true } });
      await tx.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      return { verified: true };
    });
  }

  static async changePassword(customerId: string, current: string, next: string) {
    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    if (!await PasswordUtil.compare(current, customer.passwordHash)) throw ApiError.unauthorized('Current password is incorrect');
    const passwordHash = await PasswordUtil.hash(next);
    await serializable(async tx => {
      await tx.customer.update({ where: { id: customerId }, data: { passwordHash } });
      await tx.refreshToken.updateMany({ where: { customerId }, data: { revoked: true } });
    });
    return { changed: true };
  }

  static async saveAddress(customerId: string, id: string | undefined, data: any) {
    return serializable(async tx => {
      if (id && !await tx.address.findFirst({ where: { id, customerId } })) throw ApiError.notFound('Address not found');
      if (data.isDefault) await tx.address.updateMany({ where: { customerId }, data: { isDefault: false } });
      return id ? tx.address.update({ where: { id }, data }) : tx.address.create({ data: { ...data, customerId } });
    });
  }

  static async wishlist(customerId: string, productId?: string, remove = false) {
    const list = await prisma.wishlist.upsert({ where: { customerId }, create: { customerId }, update: {} });
    if (productId) {
      if (remove) await prisma.wishlistItem.deleteMany({ where: { wishlistId: list.id, productId } });
      else {
        if (!await prisma.product.findFirst({ where: { id: productId, isActive: true, deletedAt: null } })) throw ApiError.notFound('Product not found');
        await prisma.wishlistItem.upsert({ where: { wishlistId_productId: { wishlistId: list.id, productId } }, create: { wishlistId: list.id, productId }, update: {} });
      }
    }
    return prisma.wishlistItem.findMany({ where: { wishlistId: list.id }, include: { product: { include: { images: true, variants: { include: { inventory: true } } } } }, take: 100 });
  }

  static async review(customerId: string, productId: string, data: any) {
    if(!(await SettingsService.get()).settings.products.reviewsEnabled)throw ApiError.conflict('Product reviews are disabled');
    const purchase = await prisma.orderItem.findFirst({ where: { variant: { productId }, order: { customerId, status: 'DELIVERED', stockCommitted: true } } });
    if (!purchase) throw ApiError.forbidden('Only customers with a delivered purchase can review this product');
    return serializable(async tx=>{const review=await tx.review.create({data:{customerId,productId,rating:data.rating,comment:data.comment,isApproved:false}});await AdminNotificationService.emit('newProductReview','New product review','A customer submitted a product review.','/admin/reviews',review.id,tx);return review;});
  }

  static async requestReturn(customerId: string, data: any) {
    return serializable(async tx => {
      const order = await tx.order.findFirst({ where: { id: data.orderId, customerId, status: 'DELIVERED' }, include: { items: true,
        statusHistory: { where: { status: 'DELIVERED' }, orderBy: { createdAt: 'desc' }, take: 1 } } });
      const days=order?orderInventorySnapshot(order).returnPeriodDays:0;
      if (!order || !days || !order.statusHistory[0] || order.statusHistory[0].createdAt < new Date(Date.now() - days * 86400_000)) throw ApiError.badRequest('Order is outside the return window');
      const seen = new Set<string>();
      const items: { orderItemId: string; variantId: string | null; quantity: number }[] = [];
      for (const item of data.items) {
        if (seen.has(item.orderItemId)) throw ApiError.badRequest('Duplicate return item');
        seen.add(item.orderItemId);
        const purchased = order.items.find(i => i.id === item.orderItemId);
        const previous = await tx.returnItem.aggregate({ where: { orderItemId: item.orderItemId, returnReq: { status: { not: 'REJECTED' } } }, _sum: { quantity: true } });
        if (!purchased || item.quantity + (previous._sum.quantity || 0) > purchased.quantity) throw ApiError.badRequest('Invalid return quantity');
        items.push({ orderItemId: item.orderItemId, variantId: purchased.variantId, quantity: item.quantity });
      }
      const request = await tx.return.create({ data: { customerId, orderId: order.id, reason: data.reason, items: { create: items } }, include: { items: true } });
      await AdminNotificationService.emit('returnRequest','New return request',order.orderNumber,'/admin/returns',request.id,tx);
      return request;
    });
  }
}
