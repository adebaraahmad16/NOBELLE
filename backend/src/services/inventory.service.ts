import { deductOrderInventory, orderInventorySnapshot } from './inventoryPolicy.service';
import { AdminNotificationService } from './adminNotification.service';
import { serializable } from '../database/transaction';
import { ApiError } from '../utils/apiError';

export class InventoryService {
  static async adjust(variantId: string, quantity: number, reason: string, adminId: string) {
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 2147483647 || typeof reason !== 'string' || !reason.trim() || reason.length > 1000) throw ApiError.unprocessable('Nonnegative stock and a valid reason are required');
    return serializable(async tx => {
      const current = await tx.inventory.findUnique({ where: { variantId } });
      if (!current) throw ApiError.notFound('Inventory not found');
      if (quantity < current.reserved) throw ApiError.conflict('Stock cannot fall below reserved quantities');
      const updated = await tx.inventory.update({ where: { variantId }, data: { quantity } });
      await tx.inventoryTransaction.create({ data: { inventoryId: current.id, type: 'ADJUSTMENT',
        delta: quantity - current.quantity, previousQty: current.quantity, newQty: quantity, reason, recordedBy: adminId } });
      await tx.activityLog.create({ data: { adminId, action: 'UPDATE_INVENTORY', entity: 'Inventory', entityId: current.id,
        metadata: { previousQty: current.quantity, newQty: quantity, reason } } });
      const waiting=await tx.order.findMany({where:{stockCommitted:true,status:{in:['PAID','PROCESSING']},items:{some:{variantId}}},include:{items:true},orderBy:{createdAt:'asc'},take:100});
      for(const order of waiting){const snapshot=orderInventorySnapshot(order);if(snapshot.allowBackorders && (snapshot.stockDeduction!=='CONFIRMATION' || order.status==='PROCESSING'))await deductOrderInventory(tx,order,`Restock allocated to ${order.orderNumber}`,false,variantId);}
      await AdminNotificationService.stock(variantId,tx);
      return tx.inventory.findUniqueOrThrow({where:{variantId}});
    });
  }
}
