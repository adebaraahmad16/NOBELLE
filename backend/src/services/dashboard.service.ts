import prisma from '../repositories/prisma';

export class DashboardService {
  static async getStats() {
    const [totalRevenueResult, totalOrders, totalCustomers, totalProducts, lowStockCount, refunds, statusCounts, outOfStockCount, stockTotals] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'SUCCESS', order: { status: { not: 'CANCELLED' } } },
        _sum: { amount: true },
      }),
      prisma.order.count(),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.inventory.count({ where: { quantity: { gt: 0, lte: 5 } } }),
      prisma.paymentRefund.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      prisma.order.groupBy({ by: ['status'], _count: true }),
      prisma.inventory.count({ where: { quantity: 0 } }),
      prisma.inventory.aggregate({ _sum: { quantity: true, reserved: true } }),
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        payments: { select: { status: true } },
      },
    });

    return {
      revenue: (totalRevenueResult._sum.amount || new (await import('@prisma/client')).Prisma.Decimal(0)).sub(refunds._sum.amount || 0).toFixed(2),
      statusCounts, outOfStockCount,
      totalStock: stockTotals._sum.quantity || 0, totalReserved: stockTotals._sum.reserved || 0,
      totalOrders,
      totalCustomers,
      totalProducts,
      lowStockCount,
      recentOrders,
    };
  }
}
