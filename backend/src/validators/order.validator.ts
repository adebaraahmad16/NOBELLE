import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    idempotencyKey: z.string().uuid(),
    addressId: z.string().uuid().optional(),
    shippingAddress: z
      .object({
        recipient: z.string().min(1),
        phoneNumber: z.string().min(1),
        street: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        country: z.string().default('Nigeria'),
      })
      .optional(),
    couponCode: z.string().optional(),
    deliveryZoneId: z.string().uuid(),
    notes: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  }),
});
