import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
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
    deliveryZoneId: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']),
  }),
});
