import prisma from '../repositories/prisma';
import { generateSlug } from '../utils/slug';
import { parsePagination, formatPaginatedResponse } from '../utils/pagination';
import { ApiError } from '../utils/apiError';

export class ProductService {
  static async listProducts(query: any) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = { isActive: true, deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }
    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.collection) {
      where.collection = { slug: query.collection };
    }
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = parseFloat(query.minPrice);
      if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice);
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price-low') orderBy = { price: 'asc' };
    if (query.sort === 'price-high') orderBy = { price: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          collection: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          variants: {
            include: { inventory: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return formatPaginatedResponse(products, total, page, limit);
  }

  static async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        collection: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          include: { inventory: true },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            customer: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product || product.deletedAt || !product.isActive) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  static async getFeatured() {
    return prisma.product.findMany({
      where: { isFeatured: true, isActive: true, deletedAt: null },
      take: 8,
      include: { images: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getNewArrivals() {
    return prisma.product.findMany({
      where: { isNewArrival: true, isActive: true, deletedAt: null },
      take: 8,
      include: { images: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getBestSellers() {
    return prisma.product.findMany({
      where: { isBestSeller: true, isActive: true, deletedAt: null },
      take: 8,
      include: { images: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createProduct(data: any) {
    const slug = generateSlug(data.name) + '-' + Math.floor(1000 + Math.random() * 9000);

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug,
          sku: data.sku,
          description: data.description,
          categoryId: data.categoryId,
          collectionId: data.collectionId,
          price: data.price,
          comparePrice: data.comparePrice,
          isFeatured: data.isFeatured ?? false,
          isNewArrival: data.isNewArrival ?? false,
          isBestSeller: data.isBestSeller ?? false,
          variants: {
            create: data.variants.map((v: any) => ({
              sku: v.sku,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex,
              priceDiff: v.priceDiff ?? 0,
              inventory: {
                create: {
                  quantity: v.quantity ?? 0,
                },
              },
            })),
          },
        },
        include: {
          variants: { include: { inventory: true } },
          category: true,
        },
      });

      return product;
    });
  }

  static async updateProduct(id: string, data: any) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw ApiError.notFound('Product not found');

    return prisma.product.update({
      where: { id },
      data,
      include: { category: true, variants: { include: { inventory: true } } },
    });
  }

  static async deleteProduct(id: string) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
