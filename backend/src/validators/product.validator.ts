import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    sku: z.string().min(2, 'SKU is required'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    categoryId: z.string().uuid('Valid Category ID is required'),
    collectionId: z.string().uuid().optional().nullable(),
    price: z.number().positive('Price must be positive'),
    comparePrice: z.number().positive().optional().nullable(),
    isFeatured: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    variants: z
      .array(
        z.object({
          sku: z.string().min(1),
          size: z.string().min(1),
          color: z.string().min(1),
          colorHex: z.string().optional(),
          priceDiff: z.number().optional().default(0),
          quantity: z.number().int().nonnegative().default(0),
        })
      )
      .min(1, 'At least one variant is required'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    collectionId: z.string().uuid().optional().nullable(),
    price: z.number().positive().optional(),
    comparePrice: z.number().positive().optional().nullable(),
    isFeatured: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    collection: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
    sort: z.enum(['newest', 'price-low', 'price-high', 'popular']).optional(),
  }),
});
