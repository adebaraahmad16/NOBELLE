import { SettingsService } from './settings.service';
import { randomUUID } from 'crypto';
import { serializable } from '../database/transaction';
import { ApiError } from '../utils/apiError';
import { money } from '../utils/money';
export class VariantService {
  static async save(productId: string, id: string | undefined, data: any, adminId: string) {
    return serializable(async tx => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || product.deletedAt) throw ApiError.notFound('Product not found');
      if (id && !await tx.productVariant.findFirst({ where: { id, productId } })) throw ApiError.notFound('Variant not found');
      if (money(product.price).add(data.priceDiff || 0).lte(0)) throw ApiError.badRequest('Variant price must be positive');
      const {settings}=await SettingsService.get(tx);
      const existing=id?await tx.productVariant.findUnique({where:{id}}):null;
      if(!settings.products.sizes.includes(data.size) && data.size!==existing?.size)throw ApiError.unprocessable('Choose a configured product size');
      if(!data.sku && settings.products.automaticSku)data={...data,sku:`${product.sku}-${randomUUID().slice(0,8).toUpperCase()}`};
      if(!data.sku)throw ApiError.unprocessable('Variant SKU is required');
      const { quantity, ...values } = data;
      const variant = id ? await tx.productVariant.update({ where: { id }, data: values }) : await tx.productVariant.create({ data: {
        ...values, productId, inventory: { create: { quantity: quantity || 0, lowStockAlert:settings.products.lowStockThreshold } },
      } });
      if (!id) {
        const inventory = await tx.inventory.findUniqueOrThrow({ where: { variantId: variant.id } });
        await tx.inventoryTransaction.create({ data: { inventoryId: inventory.id, type: 'RESTOCK',
          delta: inventory.quantity, previousQty: 0, newQty: inventory.quantity, reason: 'Opening stock', recordedBy: adminId } });
      }
      await tx.activityLog.create({ data: { adminId, action: id ? 'UPDATE_VARIANT' : 'CREATE_VARIANT', entity: 'ProductVariant', entityId: variant.id } });
      return variant;
    });
  }
}
