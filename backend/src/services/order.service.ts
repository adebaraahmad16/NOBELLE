import prisma from '../repositories/prisma';
import { ApiError } from '../utils/apiError';
import { parsePagination, formatPaginatedResponse } from '../utils/pagination';

export class OrderService {
  static async createOrder(customerId: string, data: { addressId?: string; shippingAddress?: any; couponCode?: string; notes?: string }) {
    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Cart is empty');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Verify and lock inventory rows
      let subtotal = 0;
      const orderItemsData: any[] = [];

      for (const item of cart.items) {
        const inventory = await tx.inventory.findUnique({
          where: { variantId: item.variantId },
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw ApiError.badRequest(`Insufficient stock for product: ${item.variant.product.name}`);
        }

        const basePrice = Number(item.variant.product.price);
        const priceDiff = Number(item.variant.priceDiff);
        const unitPrice = basePrice + priceDiff;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        orderItemsData.push({
          variantId: item.variantId,
          productName: item.variant.product.name,
          productSku: item.variant.product.sku,
          variantSku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color,
          unitPrice,
          quantity: item.quantity,
          totalPrice: lineTotal,
        });

        // Decrement stock
        const newQty = inventory.quantity - item.quantity;
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: newQty },
        });

        // Audit inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            type: 'SALE',
            delta: -item.quantity,
            previousQty: inventory.quantity,
            newQty,
            reason: 'Order placement',
          },
        });
      }

      // 2. Coupon calculation
      let discountTotal = 0;
      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: data.couponCode.toUpperCase() },
        });
        if (coupon && coupon.isActive) {
          if (!coupon.expiresAt || coupon.expiresAt > new Date()) {
            if (!coupon.minSpend || subtotal >= Number(coupon.minSpend)) {
              if (coupon.discountType === 'PERCENTAGE') {
                discountTotal = (subtotal * Number(coupon.value)) / 100;
                if (coupon.maxDiscount && discountTotal > Number(coupon.maxDiscount)) {
                  discountTotal = Number(coupon.maxDiscount);
                }
              } else {
                discountTotal = Number(coupon.value);
              }
            }
          }
        }
      }

      const deliveryFee = 2500; // Flat default delivery fee
      const totalAmount = Math.max(0, subtotal - discountTotal + deliveryFee);
      const orderNumber = `NOB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          addressId: data.addressId,
          shippingAddress: data.shippingAddress || {},
          subtotal,
          discountTotal,
          deliveryFee,
          totalAmount,
          couponCode: data.couponCode,
          notes: data.notes,
          status: 'PENDING',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  }

  static async getCustomerOrders(customerId: string, query: any) {
    const { page, limit, skip } = parsePagination(query);
    const where = { customerId };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, payments: true },
      }),
      prisma.order.count({ where }),
    ]);

    return formatPaginatedResponse(orders, total, page, limit);
  }

  static async getOrderById(orderId: string, customerId?: string) {
    const where: any = { id: orderId };
    if (customerId) where.customerId = customerId;

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: true,
        payments: true,
        customer: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      },
    });

    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  static async listAdminOrders(query: any) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search } },
        { customer: { email: { contains: query.search } } },
        { customer: { firstName: { contains: query.search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, email: true, firstName: true, lastName: true } },
          items: true,
          payments: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return formatPaginatedResponse(orders, total, page, limit);
  }

  static async updateOrderStatus(orderId: string, status: any, adminId?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound('Order not found');

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    if (adminId) {
      await prisma.activityLog.create({
        data: {
          adminId,
          action: 'UPDATE_ORDER_STATUS',
          entity: 'Order',
          entityId: orderId,
          metadata: { oldStatus: order.status, newStatus: status },
        },
      });
    }

    return updated;
  }
}
