import { SettingsService } from './settings.service';
import { deductOrderInventory, releaseOrderInventory, orderInventorySnapshot } from './inventoryPolicy.service';
import { AdminNotificationService } from './adminNotification.service';
import { serializable } from '../database/transaction';
import prisma from '../repositories/prisma';
import { ApiError } from '../utils/apiError';
import { parsePagination, formatPaginatedResponse } from '../utils/pagination';

export class OrderService {
  static async cancelCustomer(orderId:string,customerId:string) {
    return serializable(async tx=>{
      const order=await tx.order.findFirst({where:{id:orderId,customerId},include:{items:true}});
      if(!order)throw ApiError.notFound('Order not found');
      const rule=orderInventorySnapshot(order);
      if(!rule.allowCancellation || order.status!=='PAYMENT_PENDING' || Date.now()>order.createdAt.getTime()+rule.cancellationPeriodMinutes*60000)throw ApiError.conflict('This order cannot be cancelled');
      await releaseOrderInventory(tx,order,'Customer cancellation');
      await AdminNotificationService.emit('cancelledOrder','Order cancelled',order.orderNumber,'/admin/orders',order.id,tx);
      return tx.order.update({where:{id:orderId},data:{status:'CANCELLED',statusHistory:{create:{status:'CANCELLED',actorId:customerId}}}});
    });
  }
  static async invoice(orderId:string,customerId:string) {
    const {settings}=await SettingsService.get();
    if(!settings.orders.invoicesEnabled)throw ApiError.conflict('Invoice generation is disabled');
    const order=await this.getOrderById(orderId,customerId);
    if(!order.stockCommitted)throw ApiError.conflict('Invoices are available after successful payment');
    return {storeName:settings.store.businessName,address:[settings.store.address,settings.store.city,settings.store.state,settings.store.country].filter(Boolean).join(', '),supportEmail:settings.store.supportEmail,orderNumber:order.orderNumber,createdAt:order.createdAt,currency:orderInventorySnapshot(order).currency,customer:order.customer,items:order.items,subtotal:order.subtotal,discount:order.discountTotal,deliveryFee:order.deliveryFee,total:order.totalAmount};
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
        include: { items: true, payments: { select: { id: true, reference: true, amount: true, currency: true, status: true, paidAt: true } } },
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
        statusHistory: true,
        shipment: true,
        payments: { select: { id: true, reference: true, amount: true, currency: true, status: true, paidAt: true } },
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
          payments: { select: { id: true, reference: true, amount: true, currency: true, status: true, paidAt: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return formatPaginatedResponse(orders, total, page, limit);
  }

  static async updateOrderStatus(orderId: string, status: any, adminId?: string) {
    return serializable(async tx => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) throw ApiError.notFound('Order not found');
      if (order.status === status) return order;
      const transitions: Record<string, string[]> = {
        PAYMENT_PENDING: ['CANCELLED'], PAID: ['PROCESSING'], PROCESSING: ['PACKED'],
        PACKED: ['SHIPPED'], SHIPPED: ['OUT_FOR_DELIVERY'], OUT_FOR_DELIVERY: ['DELIVERED'],
      };
      if (!transitions[order.status]?.includes(status)) throw ApiError.conflict('Invalid order status transition');
      if(status==='CANCELLED'){await releaseOrderInventory(tx,order,`Cancellation of ${order.orderNumber}`);await AdminNotificationService.emit('cancelledOrder','Order cancelled',order.orderNumber,'/admin/orders',order.id,tx);}
      else if(['PROCESSING','PACKED','SHIPPED'].includes(status)){await deductOrderInventory(tx,order,`Order ${order.orderNumber} confirmed`,['PACKED','SHIPPED'].includes(status));if(status==='PROCESSING' && orderInventorySnapshot(order).stockDeduction==='CONFIRMATION')for(const item of order.items)if(item.variantId)await AdminNotificationService.stock(item.variantId,tx);}
      const {settings}=await SettingsService.get(tx);
      const updated = await tx.order.update({ where: { id: orderId }, data: { status,
        statusHistory: { create: { status, actorId: adminId } } } });
      if(settings.orders.orderNotifications)await tx.notification.create({ data: { customerId: order.customerId,
        title: 'Order update', message: `${order.orderNumber}: ${status}`, linkUrl: `/account/orders/${orderId}` } });
      if(settings.orders.orderNotifications)await tx.emailJob.create({ data: { key: `order:${orderId}:${status}`, recipient: (await tx.customer.findUniqueOrThrow({ where: { id: order.customerId } })).email,
        subject: 'NOBELLE order update', html: `<p>Your order ${order.orderNumber} is ${status}.</p>` } });
      if (adminId) await tx.activityLog.create({ data: { adminId, action: 'UPDATE_ORDER_STATUS',
        entity: 'Order', entityId: orderId, metadata: { oldStatus: order.status, newStatus: status } } });
      return updated;
    });
  }
}
