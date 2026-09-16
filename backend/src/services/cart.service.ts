import prisma from '../repositories/prisma';
import { ApiError } from '../utils/apiError';

export class CartService {
  static async getOrCreateCart(customerId: string) {
    let cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { include: { images: true } },
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: { include: { images: true } },
                  inventory: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate subtotal from current database prices
    let subtotal = 0;
    const items = cart.items.map((item) => {
      const basePrice = Number(item.variant.product.price);
      const diff = Number(item.variant.priceDiff);
      const unitPrice = basePrice + diff;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

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
        availableStock: item.variant.inventory?.quantity ?? 0,
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
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true, product: true },
    });

    if (!variant || variant.product.deletedAt || !variant.product.isActive) {
      throw ApiError.notFound('Product variant not found');
    }

    const currentStock = variant.inventory?.quantity ?? 0;
    if (currentStock < quantity) {
      throw ApiError.badRequest(`Insufficient stock. Only ${currentStock} item(s) available.`);
    }

    const cart = await prisma.cart.upsert({
      where: { customerId },
      create: { customerId },
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
      if (newQty > currentStock) {
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

    return this.getOrCreateCart(customerId);
  }

  static async updateItemQuantity(customerId: string, cartItemId: string, quantity: number) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        variant: { include: { inventory: true } },
      },
    });

    if (!item || item.cart.customerId !== customerId) {
      throw ApiError.notFound('Cart item not found');
    }

    const currentStock = item.variant.inventory?.quantity ?? 0;
    if (quantity > currentStock) {
      throw ApiError.badRequest(`Requested quantity exceeds available stock (${currentStock})`);
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return this.getOrCreateCart(customerId);
  }

  static async removeItem(customerId: string, cartItemId: string) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || item.cart.customerId !== customerId) {
      throw ApiError.notFound('Cart item not found');
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return this.getOrCreateCart(customerId);
  }

  static async clearCart(customerId: string) {
    const cart = await prisma.cart.findUnique({ where: { customerId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { items: [], subtotal: 0, totalItems: 0 };
  }
}
