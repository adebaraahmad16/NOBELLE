import { SettingsService } from './settings.service';
import { TokenUtil } from '../utils/token';
import { serializable } from '../database/transaction';
import { money } from '../utils/money';
import prisma from '../repositories/prisma';
import { ApiError } from '../utils/apiError';

export class CartService {
  static async getOrCreateCart(customerId: string) {
    const cart = await prisma.cart.upsert({ where: ownerWhere(customerId), create: ownerWhere(customerId), update: { updatedAt: new Date() },
      include: { items: { include: { variant: { include: { product: { include: { images: true } }, inventory: true } } } } },
    });

    // Calculate subtotal from current database prices
    let subtotal = money(0);
    const items = cart.items.map((item) => {
      const basePrice = money(item.variant.product.price);
      const diff = money(item.variant.priceDiff);
      const unitPrice = basePrice.add(diff);
      const lineTotal = unitPrice.mul(item.quantity);
      subtotal = subtotal.add(lineTotal);

      return {
        id: item.id,
        variantId: item.variantId,
        productId: item.variant.productId,
        productName: item.variant.product.name,
        productSlug: item.variant.product.slug,
        size: item.variant.size,
        color: item.variant.color,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        image: item.variant.product.images[0]?.url || null,
        availableStock: (item.variant.inventory ? item.variant.inventory.quantity - item.variant.inventory.reserved : 0),
      };
    });

    return {
      id: cart.id,
      items,
      subtotal,
      totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
    };
  }

  static async addItem(customerId: string, variantId: string, quantity: number) {
    await serializable(async (prisma) => {
    const {settings}=await SettingsService.get(prisma);
    if(settings.general.status==='MAINTENANCE')throw ApiError.conflict(settings.general.maintenanceMessage);
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true, product: true },
    });

    if (!variant || !variant.isActive || variant.product.deletedAt || !variant.product.isActive) {
      throw ApiError.notFound('Product variant not found');
    }

    const currentStock = (variant.inventory ? variant.inventory.quantity - variant.inventory.reserved : 0);
    if (!settings.products.allowOutOfStockPurchases && currentStock < quantity) {
      throw ApiError.badRequest(`Insufficient stock. Only ${currentStock} item(s) available.`);
    }

    const cart = await prisma.cart.upsert({
      where: ownerWhere(customerId),
      create: ownerWhere(customerId),
      update: {},
    });

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (!settings.products.allowOutOfStockPurchases && newQty > currentStock) {
        throw ApiError.badRequest(`Cannot add more. Exceeds available stock of ${currentStock}.`);
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
        },
      });
    }

    });
    return this.getOrCreateCart(customerId);
  }

  static async updateItemQuantity(customerId: string, cartItemId: string, quantity: number) {
    await serializable(async (prisma) => {
    const {settings}=await SettingsService.get(prisma);
    if(settings.general.status==='MAINTENANCE')throw ApiError.conflict(settings.general.maintenanceMessage);
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        variant: { include: { inventory: true, product: true } },
      },
    });

    if (!item || !ownsCart(item.cart, customerId)) {
      throw ApiError.notFound('Cart item not found');
    }

    if (!item.variant.isActive || !item.variant.product.isActive || item.variant.product.deletedAt) throw ApiError.badRequest('Product is unavailable');
    const currentStock = (item.variant.inventory ? item.variant.inventory.quantity - item.variant.inventory.reserved : 0);
    if (!settings.products.allowOutOfStockPurchases && quantity > currentStock) {
      throw ApiError.badRequest(`Requested quantity exceeds available stock (${currentStock})`);
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    });
    return this.getOrCreateCart(customerId);
  }

  static async removeItem(customerId: string, cartItemId: string) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || !ownsCart(item.cart, customerId)) {
      throw ApiError.notFound('Cart item not found');
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return this.getOrCreateCart(customerId);
  }

  static async clearCart(customerId: string) {
    const cart = await prisma.cart.findUnique({ where: ownerWhere(customerId) });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { items: [], subtotal: 0, totalItems: 0 };
  }
  static async mergeGuest(customerId: string, token: string | null) {
    if (!token) return;
    await serializable(async tx => {
      const {settings}=await SettingsService.get(tx);
      const guest = await tx.cart.findUnique({ where: { guestTokenHash: TokenUtil.hashToken(token) }, include: { items: { include: { variant: { include: { product: true, inventory: true } } } } } });
      if (!guest) return;
      const customer = await tx.cart.upsert({ where: { customerId }, create: { customerId }, update: {} });
      for (const item of guest.items) {
        if (!item.variant.isActive || !item.variant.product.isActive || item.variant.product.deletedAt) continue;
        const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: customer.id, variantId: item.variantId } } });
        const stock = item.variant.inventory ? item.variant.inventory.quantity - item.variant.inventory.reserved : 0;
        const quantity = Math.min(settings.products.allowOutOfStockPurchases?99:stock, (existing?.quantity || 0) + item.quantity);
        if (quantity > 0) await tx.cartItem.upsert({ where: { cartId_variantId: { cartId: customer.id, variantId: item.variantId } },
          create: { cartId: customer.id, variantId: item.variantId, quantity }, update: { quantity } });
      }
      await tx.cart.delete({ where: { id: guest.id } });
    });
  }

}

function ownerWhere(owner: string): { customerId: string; guestTokenHash?: never } | { guestTokenHash: string; customerId?: never } {
  return owner.startsWith('guest:') ? { guestTokenHash: owner.slice(6) } : { customerId: owner };
}
function ownsCart(cart: { customerId: string | null; guestTokenHash: string | null }, owner: string) {
  return owner.startsWith('guest:') ? cart.guestTokenHash === owner.slice(6) : cart.customerId === owner;
}
