import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    sku: z.string().max(100).optional(),
    isActive: z.boolean().optional(),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    categoryId: z.string().uuid('Valid Category ID is required'),
    collectionId: z.string().uuid().optional().nullable(),
    collectionIds: z.array(z.string().uuid()).max(30).optional(),
    price: z.number().positive('Price must be positive').multipleOf(0.01),
    comparePrice: z.number().positive().multipleOf(0.01).optional().nullable(),
    isFeatured: z.boolean().optional(),
    shortDescription: z.string().max(500).optional(), material: z.string().max(500).optional(), careInstructions: z.string().max(3000).optional(),
    isNewArrival: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    variants: z
      .array(
        z.object({
          sku: z.string().max(100).optional(),
          size: z.string().min(1),
          color: z.string().min(1),
          colorHex: z.string().optional(),
          priceDiff: z.number().multipleOf(0.01).optional().default(0),
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
    sku: z.string().min(2).optional(),
    description: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    collectionId: z.string().uuid().optional().nullable(),
    collectionIds: z.array(z.string().uuid()).max(30).optional(),
    price: z.number().positive().multipleOf(0.01).optional(),
    comparePrice: z.number().positive().multipleOf(0.01).optional().nullable(),
    isFeatured: z.boolean().optional(),
    shortDescription: z.string().max(500).optional(), material: z.string().max(500).optional(), careInstructions: z.string().max(3000).optional(),
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
    minPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).max(13).optional(),
    maxPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).max(13).optional(),
    featured: z.string().optional(), available: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
    sort: z.enum(['newest', 'price-low', 'price-high', 'popular', 'best-selling']).optional(),
  }),
});
