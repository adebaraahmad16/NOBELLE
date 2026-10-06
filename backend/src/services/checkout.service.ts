import { SettingsService } from './settings.service';
import { deductOrderInventory, releaseOrderInventory } from './inventoryPolicy.service';
import { AdminNotificationService } from './adminNotification.service';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { serializable } from '../database/transaction';
import { money, couponDiscount } from '../utils/money';
import { ApiError } from '../utils/apiError';

export class CheckoutService {
  static async create(customerId: string, data: {
    idempotencyKey: string; addressId?: string; shippingAddress?: any;
    deliveryZoneId: string; couponCode?: string; notes?: string;
  }) {
    return serializable(async tx => {
      const existing = await tx.order.findUnique({
        where: { customerId_idempotencyKey: { customerId, idempotencyKey: data.idempotencyKey } },
        include: { items: true },
      });
      if (existing) return existing;
      const {settings}=await SettingsService.get(tx);
      if(settings.general.status==='MAINTENANCE')throw ApiError.conflict(settings.general.maintenanceMessage);
      if(!settings.payments.enabled)throw ApiError.conflict('Checkout is temporarily unavailable');
      const rules=await SettingsService.zoneRules(tx);
      const reserved:Record<string,number>={};
      const address = data.addressId
        ? await tx.address.findFirst({ where: { id: data.addressId, customerId } })
        : data.shippingAddress;
      if (!address) throw ApiError.badRequest('A delivery address is required');
      const zone = await tx.deliveryZone.findFirst({ where: { id: data.deliveryZoneId, isActive: true } });
      if (!zone || String(address.country).toLowerCase() !== String(rules[zone?.id || '']?.country || settings.shipping.defaultCountry).toLowerCase() || !Array.isArray(zone.states) ||
          !zone.states.some(state => String(state).toLowerCase() === address.state.toLowerCase())) {
        throw ApiError.badRequest('Delivery is unavailable for this address');
      }
      const cart = await tx.cart.findUnique({ where: { customerId }, include: {
        items: { include: { variant: { include: { product: { include: { images: true } }, inventory: true } } } },
      } });
      if (!cart?.items.length) throw ApiError.badRequest('Cart is empty');
      let subtotal = money(0);
      const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      for (const item of cart.items) {
        const { variant } = item;
        if (!variant.isActive || !variant.product.isActive || variant.product.deletedAt) {
          throw ApiError.badRequest('A product is no longer available');
        }
        if (!variant.inventory || !settings.products.allowOutOfStockPurchases && variant.inventory.quantity - variant.inventory.reserved < item.quantity) {
          throw ApiError.conflict(`Insufficient stock for ${variant.product.name}`);
        }
        // Serializable isolation prevents concurrent reservations from overselling.
        const held=Math.min(item.quantity,Math.max(0,variant.inventory.quantity-variant.inventory.reserved));reserved[variant.id]=held;
        if(held)await tx.inventory.update({ where: { id: variant.inventory.id }, data: { reserved: { increment: held } } });
        const unitPrice = money(variant.product.price).add(variant.priceDiff);
        if (unitPrice.lte(0)) throw ApiError.badRequest('Invalid product price');
        const totalPrice = unitPrice.mul(item.quantity);
        subtotal = subtotal.add(totalPrice);
        items.push({ variant: { connect: { id: variant.id } }, productName: variant.product.name,
          productImage: variant.product.images[0]?.url, productId: variant.product.id, productSlug: variant.product.slug, productSku: variant.product.sku,
          variantSku: variant.sku, size: variant.size, color: variant.color, unitPrice,
          quantity: item.quantity, totalPrice });
      }
      let discount = money(0);
      let couponId: string | undefined;
      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: data.couponCode.trim().toUpperCase() } });
        const now = new Date();
        if (!coupon || !coupon.isActive || (coupon.startsAt && coupon.startsAt > now) ||
            (coupon.expiresAt && coupon.expiresAt <= now) || (coupon.minSpend && subtotal.lt(coupon.minSpend))) {
          throw ApiError.badRequest('Coupon is invalid or unavailable');
        }
        const pending = { order: { status: 'PAYMENT_PENDING' as const, expiresAt: { gt: now } } };
        const reservations = await tx.couponUsage.count({ where: { couponId: coupon.id, ...pending } });
        if (coupon.usageLimit !== null && coupon.usageCount + reservations >= coupon.usageLimit) {
          throw ApiError.badRequest('Coupon usage limit reached');
        }
        const uses = await tx.couponUsage.count({ where: { couponId: coupon.id, customerId,
          order: { OR: [{ stockCommitted: true }, { status: 'PAYMENT_PENDING', expiresAt: { gt: now } }] } } });
        if (coupon.perCustomerLimit !== null && uses >= coupon.perCustomerLimit) {
          throw ApiError.badRequest('Your coupon usage limit has been reached');
        }
        discount = couponDiscount(subtotal, coupon);
        couponId = coupon.id;
      }
      const threshold=rules[zone.id]?.freeDeliveryThreshold ?? settings.shipping.freeDeliveryThreshold;
      const fee=threshold!==null && threshold!==undefined && subtotal.sub(discount).gte(threshold)?money(0):money(zone.fee);
      const prefix=settings.orders.prefix,counterSlug=`internal-order-counter-${prefix}`;
      await tx.$executeRaw(Prisma.sql`INSERT INTO WebsiteContent (id,slug,title,data,updatedAt) VALUES (${randomUUID()},${counterSlug},'Order sequence','{"number":1000}',NOW(3)) ON DUPLICATE KEY UPDATE slug=slug`);
      const counter=await tx.websiteContent.findUniqueOrThrow({where:{slug:counterSlug}});let number=Number((counter.data as any)?.number || 1000)+1;
      while(await tx.order.findUnique({where:{orderNumber:`${prefix}${number}`},select:{id:true}}))number++;
      await tx.websiteContent.update({where:{slug:counterSlug},data:{data:{number}}});
      const snapshot={stockDeduction:settings.orders.stockDeduction,allowBackorders:settings.products.allowOutOfStockPurchases,reserved,deducted:{},confirmation:settings.orders.confirmation,currency:settings.general.currency,returnPeriodDays:settings.orders.returnPeriodDays,allowCancellation:settings.orders.allowCancellation,cancellationPeriodMinutes:settings.orders.cancellationPeriodMinutes,paymentMode:settings.payments.mode};
      const order = await tx.order.create({ data: {
        customerId, idempotencyKey: data.idempotencyKey,
        orderNumber: `${prefix}${number}`, addressId: data.addressId,
        shippingAddress: { recipient: address.recipient, phoneNumber: address.phoneNumber,
          street: address.street, city: address.city, state: address.state,
          country: address.country, postalCode: address.postalCode || null },
        subtotal, discountTotal: discount, deliveryFee: fee, settingsSnapshot:snapshot as any,
        totalAmount: subtotal.sub(discount).add(fee), couponCode: data.couponCode?.toUpperCase(),
        notes: data.notes, status: 'PAYMENT_PENDING', expiresAt: new Date(Date.now() + settings.orders.cancellationPeriodMinutes * 60_000),
        items: { create: items }, statusHistory: { create: { status: 'PAYMENT_PENDING', actorId: customerId } },
        ...(couponId ? { couponUsages: { create: { couponId, customerId } } } : {}),
      }, include: { items: true } });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if(settings.orders.stockDeduction==='CREATION'){order.settingsSnapshot=await deductOrderInventory(tx,order,`Order ${order.orderNumber} created`) as any;for(const item of order.items)if(item.variantId)await AdminNotificationService.stock(item.variantId,tx);}
      await AdminNotificationService.emit('newOrder','New order',order.orderNumber,'/admin/orders',order.id,tx);
      return order;
    });
  }

  static async releaseExpired() {
    return serializable(async tx => {
      const orders = await tx.order.findMany({ where: {
        status: 'PAYMENT_PENDING', expiresAt: { lt: new Date() }, stockCommitted: false,
      }, include: { items: true }, take: 100 });
      for (const order of orders) {
        await releaseOrderInventory(tx,order,`Checkout expired: ${order.orderNumber}`);
        await AdminNotificationService.emit('cancelledOrder','Order cancelled',order.orderNumber,'/admin/orders',order.id,tx);
        await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED',
          statusHistory: { create: { status: 'CANCELLED' } } } });
      }
      return orders.length;
    });
  }
}
