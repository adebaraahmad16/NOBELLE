import prisma from '../repositories/prisma';
import { serializable } from '../database/transaction';
import { ApiError } from '../utils/apiError';

export class AdminOperationsService {
  static async returnStatus(id: string, status: string, adminId: string) {
    return serializable(async tx => {
      const request = await tx.return.findUnique({ where: { id }, include: { items: true, customer: { select: { email: true } } } });
      if (!request) throw ApiError.notFound('Return not found');
      if (request.status === status) return request;
      const transitions: Record<string, string[]> = {
        REQUESTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'], UNDER_REVIEW: ['APPROVED', 'REJECTED'],
        APPROVED: ['RECEIVED'], REFUNDED: ['COMPLETED'],
      };
      if (!transitions[request.status]?.includes(status)) throw ApiError.conflict('Invalid return transition');
      // Only received goods are restocked. Serializable transition makes this exactly once.
      if (status === 'RECEIVED') for (const item of request.items) {
        if (!item.variantId) continue;
        const inventory = await tx.inventory.findUniqueOrThrow({ where: { variantId: item.variantId } });
        await tx.inventory.update({ where: { id: inventory.id }, data: { quantity: { increment: item.quantity } } });
        await tx.inventoryTransaction.create({ data: { inventoryId: inventory.id, type: 'RETURN',
          delta: item.quantity, previousQty: inventory.quantity, newQty: inventory.quantity + item.quantity,
          reason: `Return ${request.id}`, recordedBy: adminId } });
      }
      const updated = await tx.return.update({ where: { id }, data: { status: status as any } });
      if (status === 'RECEIVED') {
        const ordered = await tx.orderItem.aggregate({ where: { orderId: request.orderId }, _sum: { quantity: true } });
        const received = await tx.returnItem.aggregate({ where: { returnReq: { orderId: request.orderId, status: { in: ['RECEIVED','REFUNDED','COMPLETED'] } } }, _sum: { quantity: true } });
        if (ordered._sum.quantity === received._sum.quantity) await tx.order.update({ where: { id: request.orderId }, data: { status: 'RETURNED', statusHistory: { create: { status: 'RETURNED', actorId: adminId } } } });
      }
      await tx.notification.create({ data: { customerId: request.customerId, title: 'Return update', message: `Your return is ${status}`, linkUrl: '/account' } });
      await tx.emailJob.create({ data: { key: `return:${id}:${status}`, recipient: request.customer.email,
        subject: 'NOBELLE return update', html: `<p>Your return request is ${status}.</p>` } });
      await tx.activityLog.create({ data: { adminId, action: 'UPDATE_RETURN', entity: 'Return', entityId: id, metadata: { status } } });
      return updated;
    });
  }

  static async report(from: Date, to: Date) {
    if (Number.isNaN(+from) || Number.isNaN(+to) || from > to || +to - +from > 366 * 86400_000) throw ApiError.badRequest('Choose a valid date range of up to one year');
    const { Prisma } = await import('@prisma/client');
    const daily = await prisma.$queryRaw<{ date: string; revenue: import('@prisma/client').Prisma.Decimal; orders: bigint }[]>(Prisma.sql`
      SELECT DATE_FORMAT(DATE_ADD(p.\`paidAt\`, INTERVAL 1 HOUR), '%Y-%m-%d') AS date,
             SUM(p.amount) AS revenue, COUNT(DISTINCT p.\`orderId\`) AS orders
      FROM \`Payment\` p JOIN \`Order\` o ON o.id = p.\`orderId\`
      WHERE p.status = 'SUCCESS' AND p.\`paidAt\` >= ${from} AND p.\`paidAt\` <= ${to}
        AND o.status <> 'CANCELLED'
      GROUP BY date ORDER BY date`);
    const bestSellers = await prisma.$queryRaw(Prisma.sql`
      SELECT i.\`productId\`, i.\`productName\`,
             (SELECT image.url FROM \`ProductImage\` image WHERE image.\`productId\` = i.\`productId\` ORDER BY image.\`sortOrder\` LIMIT 1) AS image,
             CAST(SUM(i.quantity) AS SIGNED) AS quantity,
             ROUND(SUM(i.\`totalPrice\` * (o.subtotal - o.\`discountTotal\`) / NULLIF(o.subtotal, 0)), 2) AS revenue
      FROM \`OrderItem\` i JOIN \`Order\` o ON o.id = i.\`orderId\`
      WHERE o.\`stockCommitted\` = true AND o.status NOT IN ('CANCELLED','REFUNDED','RETURNED')
        AND o.\`createdAt\` >= ${from} AND o.\`createdAt\` <= ${to}
      GROUP BY i.\`productId\`, i.\`productName\` ORDER BY quantity DESC LIMIT 20`);
    const soldUnits = await prisma.orderItem.aggregate({
      where: { order: { stockCommitted: true, status: { notIn: ['CANCELLED', 'REFUNDED', 'RETURNED'] }, createdAt: { gte: from, lte: to } } },
      _sum: { quantity: true },
    });
    const categories = await prisma.$queryRaw(Prisma.sql`
      SELECT c.name, CAST(SUM(i.quantity) AS SIGNED) AS quantity,
             ROUND(SUM(i.\`totalPrice\` * (o.subtotal - o.\`discountTotal\`) / NULLIF(o.subtotal, 0)), 2) AS revenue
      FROM \`OrderItem\` i JOIN \`Order\` o ON o.id = i.\`orderId\`
      JOIN \`Product\` p ON p.id = i.\`productId\` JOIN \`Category\` c ON c.id = p.\`categoryId\`
      WHERE o.\`stockCommitted\` = true AND o.status NOT IN ('CANCELLED','REFUNDED','RETURNED')
        AND o.\`createdAt\` >= ${from} AND o.\`createdAt\` <= ${to}
      GROUP BY c.id,c.name ORDER BY revenue DESC LIMIT 100`);
    const customerGrowth = await prisma.$queryRaw(Prisma.sql`
      SELECT DATE_FORMAT(DATE_ADD(\`createdAt\`, INTERVAL 1 HOUR), '%Y-%m-%d') AS date, CAST(COUNT(*) AS SIGNED) AS customers
      FROM \`Customer\` WHERE \`createdAt\` >= ${from} AND \`createdAt\` <= ${to}
      GROUP BY date ORDER BY date`);
    const inventoryMovement = await prisma.inventoryTransaction.groupBy({ by: ['type'], where: { createdAt: { gte: from, lte: to } }, _sum: { delta: true }, _count: true });
    const revenue = daily.reduce((value, day) => value.add(day.revenue), new Prisma.Decimal(0));
    const refunded = await prisma.paymentRefund.aggregate({ where: { status: 'SUCCESS', processedAt: { gte: from, lte: to } }, _sum: { amount: true } });
    const netRevenue = revenue.sub(refunded._sum.amount || 0);
    const orders = daily.reduce((value, day) => value + Number(day.orders), 0);
    return { productsSold: soldUnits._sum.quantity || 0, revenue: netRevenue.toFixed(2), grossRevenue: revenue.toFixed(2), refundedTotal: (refunded._sum.amount || new Prisma.Decimal(0)).toFixed(2), orders, averageOrderValue: orders ? revenue.div(orders).toFixed(2) : '0.00',
      daily: daily.map(day => ({ ...day, revenue: day.revenue.toFixed(2), orders: Number(day.orders) })),
      bestSellers, categories, customerGrowth, inventoryMovement };

  }
}
