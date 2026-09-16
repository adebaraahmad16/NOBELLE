import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    variantId: z.string().uuid('Valid variant ID is required'),
    quantity: z.number().int().positive('Quantity must be at least 1'),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid cart item ID is required'),
  }),
  body: z.object({
    quantity: z.number().int().positive('Quantity must be at least 1'),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required'),
  }),
});
