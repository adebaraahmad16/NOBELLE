import prisma from '../repositories/prisma';
import { ApiError } from '../utils/apiError';
export class AdminSummaryService {
  static async get(section: string, database = prisma) {
    if (section === 'orders') {
      const groups = await database.order.groupBy({ by: ['status'], _count: true });
      const count = (statuses: string[]) => groups.filter(group => statuses.includes(group.status)).reduce((sum, group) => sum + group._count, 0);
      return [
        { label: 'All Orders', value: groups.reduce((sum, group) => sum + group._count, 0) },
        { label: 'Pending', value: count(['PENDING', 'PAYMENT_PENDING']) },
        { label: 'Processing', value: count(['PAID', 'PROCESSING', 'PACKED']) },
        { label: 'Shipped', value: count(['SHIPPED', 'OUT_FOR_DELIVERY']) },
        { label: 'Delivered', value: count(['DELIVERED']) },
        { label: 'Cancelled', value: count(['CANCELLED']) },
      ];
    }
    if (section === 'products') {
      const [total, active, draft, out] = await Promise.all([
        database.product.count({ where: { deletedAt: null } }),
        database.product.count({ where: { deletedAt: null, isActive: true } }),
        database.product.count({ where: { deletedAt: null, isActive: false } }),
        database.product.count({ where: { deletedAt: null, variants: { some: {}, every: { inventory: { quantity: 0 } } } } }),
      ]);
      return [{ label: 'Total Products', value: total }, { label: 'Active', value: active }, { label: 'Draft', value: draft }, { label: 'Out of Stock', value: out }];
    }
    if (section === 'inventory') {
      const [stock, low, out, values] = await Promise.all([
        database.inventory.aggregate({ _sum: { quantity: true } }),
        database.inventory.count({ where: { quantity: { gt: 0, lte: 5 } } }),
        database.inventory.count({ where: { quantity: 0 } }),
        database.$queryRaw<{ value: string }[]>`SELECT COALESCE(SUM(i.quantity * (p.price + v.priceDiff)), 0) AS value FROM Inventory i JOIN ProductVariant v ON v.id = i.variantId JOIN Product p ON p.id = v.productId`,
      ]);
      return [{ label: 'Total Stock', value: stock._sum.quantity || 0 }, { label: 'Low Stock Variants', value: low }, { label: 'Out of Stock Variants', value: out }, { label: 'Retail Stock Value', value: String(values[0]?.value || 0), currency: true }];
    }
    if (section === 'customers') {
      const [total, recent, active, returning] = await Promise.all([
        database.customer.count({ where: { deletedAt: null } }),
        database.customer.count({ where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } } }),
        database.customer.count({ where: { deletedAt: null, isActive: true } }),
        database.$queryRaw<{ total: bigint }[]>`SELECT COUNT(*) AS total FROM (SELECT c.id FROM Customer c JOIN \`Order\` o ON o.customerId = c.id WHERE c.deletedAt IS NULL AND o.stockCommitted = true AND o.status NOT IN ('CANCELLED','REFUNDED','RETURNED') GROUP BY c.id HAVING COUNT(o.id) > 1) returning_customers`,
      ]);
      return [{ label: 'Total Customers', value: total }, { label: 'New in 30 Days', value: recent }, { label: 'Returning Customers', value: Number(returning[0]?.total || 0) }, { label: 'Active Customers', value: active }];
    }
    if (section === 'payments') {
      const [groups, refunds] = await Promise.all([
        database.payment.groupBy({ by: ['status'], _count: true, _sum: { amount: true } }),
        database.paymentRefund.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      ]);
      const successful = groups.find(group => group.status === 'SUCCESS');
      return [{ label: 'Total Revenue', value: successful?._sum.amount?.sub(refunds._sum.amount || 0).toFixed(2) || '0', currency: true }, ...(['SUCCESS','PENDING','FAILED','REFUNDED'] as const).map(status => ({ label: { SUCCESS: 'Successful Payments', PENDING: 'Pending', FAILED: 'Failed', REFUNDED: 'Refunded Payments' }[status], value: groups.find(group => group.status === status)?._count || 0 }))];
    }
    throw ApiError.notFound('Summary not available');
  }
}
