import { z } from 'zod';

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).toUpperCase(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    value: z.number().positive(),
    minSpend: z.number().positive().optional().nullable(),
    maxDiscount: z.number().positive().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    startsAt: z.string().datetime().optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});
