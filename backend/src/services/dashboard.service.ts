import prisma from '../repositories/prisma';

export class DashboardService {
  static async getStats() {
    const [totalRevenueResult, totalOrders, totalCustomers, totalProducts, lowStockCount] = await Promise.all([
      prisma.order.aggregate({
        where: { status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        _sum: { totalAmount: true },
      }),
      prisma.order.count(),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null, isActive: true } }),
      prisma.inventory.count({ where: { quantity: { lte: 5 } } }),
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return {
      revenue: Number(totalRevenueResult._sum.totalAmount || 0),
      totalOrders,
      totalCustomers,
      totalProducts,
      lowStockCount,
      recentOrders,
    };
  }
}
