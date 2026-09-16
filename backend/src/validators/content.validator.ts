import { z } from 'zod';

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    imageUrl: z.string().url(),
    linkUrl: z.string().optional(),
    buttonText: z.string().optional(),
    sortOrder: z.number().int().optional().default(0),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateContentSchema = z.object({
  body: z.object({
    data: z.record(z.any()),
  }),
});
