import { SettingsService } from './settings.service';
import { randomUUID } from 'crypto';
import prisma from '../repositories/prisma';
import { generateSlug } from '../utils/slug';
import { parsePagination, formatPaginatedResponse } from '../utils/pagination';
import { ApiError } from '../utils/apiError';
import { Prisma } from '@prisma/client';

export class ProductService {
  static async listProducts(query: any) {
    const { page, limit, skip } = parsePagination(query);
    const {settings}=await SettingsService.get();
    if(settings.products.outOfStockVisibility==='HIDE')query={...query,available:'true'};
    const where: any = { isActive: true, deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
        { category: { name: { contains: query.search } } },
        { collection: { name: { contains: query.search } } },
        { collectionLinks: { some: { collection: { name: { contains: query.search } } } } },
      ];
    }
    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.collection) {
      where.AND = [{ OR: [{ collection: { slug: query.collection } }, { collectionLinks: { some: { collection: { slug: query.collection } } } }] }];
    }
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = parseFloat(query.minPrice);
      if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice);
    }

    if (query.size || query.color || query.available === 'true') where.variants = { some: { isActive: true, ...(query.size ? { size: query.size } : {}), ...(query.color ? { color: query.color } : {}), ...(query.available === 'true' ? { inventory: { quantity: { gt: prisma.inventory.fields.reserved } } } : {}) } };
    if (query.featured === 'true') where.isFeatured = true;
    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price-low') orderBy = { price: 'asc' };
    if (query.sort === 'popular') orderBy = { reviews: { _count: 'desc' } };
    if (query.sort === 'price-high') orderBy = { price: 'desc' };

    const include = {
      category: { select: { id: true, name: true, slug: true } },
      collection: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' as const } },
      variants: { include: { inventory: true } },
    };
    if (query.sort === 'best-selling') {
      const conditions = [Prisma.sql`p.\`isActive\` = true AND p.\`deletedAt\` IS NULL`];
      if (query.search) {
        const pattern = `%${query.search}%`;
        conditions.push(Prisma.sql`(p.name LIKE ${pattern} OR p.description LIKE ${pattern} OR c.name LIKE ${pattern} OR cl.name LIKE ${pattern} OR EXISTS (SELECT 1 FROM \`ProductCollection\` pc JOIN \`Collection\` sc ON sc.id = pc.\`collectionId\` WHERE pc.\`productId\` = p.id AND sc.name LIKE ${pattern}))`);
      }
      if (query.category) conditions.push(Prisma.sql`c.slug = ${query.category}`);
      if (query.collection) conditions.push(Prisma.sql`(cl.slug = ${query.collection} OR EXISTS (SELECT 1 FROM \`ProductCollection\` pc JOIN \`Collection\` sc ON sc.id = pc.\`collectionId\` WHERE pc.\`productId\` = p.id AND sc.slug = ${query.collection}))`);
      if (query.minPrice) conditions.push(Prisma.sql`p.price >= CAST(${query.minPrice} AS DECIMAL(12, 2))`);
      if (query.maxPrice) conditions.push(Prisma.sql`p.price <= CAST(${query.maxPrice} AS DECIMAL(12, 2))`);
      if (query.featured === 'true') conditions.push(Prisma.sql`p.\`isFeatured\` = true`);
      const variantConditions = [Prisma.sql`v.\`productId\` = p.id AND v.\`isActive\` = true`];
      if (query.size) variantConditions.push(Prisma.sql`v.size = ${query.size}`);
      if (query.color) variantConditions.push(Prisma.sql`v.color = ${query.color}`);
      if (query.available === 'true') variantConditions.push(Prisma.sql`inv.quantity > inv.reserved`);
      if (query.size || query.color || query.available === 'true') conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM \`ProductVariant\` v LEFT JOIN \`Inventory\` inv ON inv.\`variantId\` = v.id WHERE ${Prisma.join(variantConditions, ' AND ')})`);
      const ranked = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT p.id FROM \`Product\` p JOIN \`Category\` c ON c.id = p.\`categoryId\`
        LEFT JOIN \`Collection\` cl ON cl.id = p.\`collectionId\`
        LEFT JOIN \`OrderItem\` i ON i.\`productId\` = p.id LEFT JOIN \`Order\` o ON o.id = i.\`orderId\`
        WHERE ${Prisma.join(conditions, ' AND ')} GROUP BY p.id
        ORDER BY COALESCE(SUM(CASE WHEN o.\`stockCommitted\` = true AND o.status NOT IN ('CANCELLED','RETURNED','REFUNDED') THEN i.quantity ELSE 0 END),0) DESC, p.\`createdAt\` DESC
        LIMIT ${limit} OFFSET ${skip}`);
      const products = await prisma.product.findMany({ where: { id: { in: ranked.map(row => row.id) } }, include });
      return formatPaginatedResponse(ranked.map(row => products.find(product => product.id === row.id)!), await prisma.product.count({ where }), page, limit);
    }
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
    const {settings}=await SettingsService.get();
    if(settings.products.outOfStockVisibility==='HIDE' && !product.variants.some(v=>v.isActive && v.inventory && v.inventory.quantity>v.inventory.reserved))throw ApiError.notFound('Product not found');
    if(!settings.products.reviewsEnabled)product.reviews=[];
    return product;
  }

  static async getFeatured() {
    const {settings}=await SettingsService.get();
    return prisma.product.findMany({
      where: { isFeatured: true, isActive: true, deletedAt: null,...(settings.products.outOfStockVisibility==='HIDE'?{variants:{some:{isActive:true,inventory:{quantity:{gt:prisma.inventory.fields.reserved}}}}}:{}) },
      take: 8,
      include: { images: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getNewArrivals() {
    const {settings}=await SettingsService.get();
    return prisma.product.findMany({
      where: { isNewArrival: true, isActive: true, deletedAt: null,...(settings.products.outOfStockVisibility==='HIDE'?{variants:{some:{isActive:true,inventory:{quantity:{gt:prisma.inventory.fields.reserved}}}}}:{}) },
      take: 8,
      include: { images: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getBestSellers() {
    const { Prisma } = await import('@prisma/client');
    const {settings}=await SettingsService.get();
    const ranked = await prisma.$queryRaw<{ productId: string }[]>(Prisma.sql`
      SELECT i.\`productId\`, SUM(i.quantity) AS sold
      FROM \`OrderItem\` i JOIN \`Order\` o ON o.id = i.\`orderId\`
      JOIN \`Product\` p ON p.id = i.\`productId\`
      WHERE o.\`stockCommitted\` = true AND o.status NOT IN ('CANCELLED','RETURNED','REFUNDED')
        AND p.\`isActive\` = true AND p.\`deletedAt\` IS NULL
      GROUP BY i.\`productId\` ORDER BY sold DESC LIMIT 8`);
    const products = await prisma.product.findMany({ where: { id: { in: ranked.map(row => row.productId) },...(settings.products.outOfStockVisibility==='HIDE'?{variants:{some:{isActive:true,inventory:{quantity:{gt:prisma.inventory.fields.reserved}}}}}:{}) },
      include: { images: true, category: true, variants: { include: { inventory: true } } } });
    return ranked.map(row => products.find(product => product.id === row.productId)).filter(Boolean);
  }

  static async createProduct(data: any, adminId?: string) {
    const {settings}=await SettingsService.get();
    data={...data,sku:data.sku || (settings.products.automaticSku?`NBL-${randomUUID().slice(0,8).toUpperCase()}`:'')};
    if(!data.sku)throw ApiError.unprocessable('Product SKU is required');
    for(const v of data.variants){if(!settings.products.sizes.includes(v.size))throw ApiError.unprocessable('Choose a configured product size');if(!v.sku && settings.products.automaticSku)v.sku=`${data.sku}-${randomUUID().slice(0,8).toUpperCase()}`;if(!v.sku)throw ApiError.unprocessable('Variant SKU is required');}
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
          collectionLinks: { create: (data.collectionIds || []).map((collectionId: string) => ({ collectionId })) },
          price: data.price,
          comparePrice: data.comparePrice,
          isFeatured: data.isFeatured ?? false,
          isActive: data.isActive ?? false,
          shortDescription: data.shortDescription, material: data.material, careInstructions: data.careInstructions,
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
                  quantity: v.quantity ?? 0, lowStockAlert:settings.products.lowStockThreshold,
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

      if (adminId) await tx.activityLog.create({ data: { adminId, action: 'CREATE_PRODUCT', entity: 'Product', entityId: product.id } });
      for (const variant of product.variants) {
        if (variant.inventory) await tx.inventoryTransaction.create({ data: { inventoryId: variant.inventory.id,
          type: 'RESTOCK', delta: variant.inventory.quantity, previousQty: 0, newQty: variant.inventory.quantity, reason: 'Opening stock' } });
      }
      return product;
    });
  }

  static async updateProduct(id: string, data: any) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw ApiError.notFound('Product not found');

    return prisma.$transaction(async tx => {
      const { collectionIds, ...values } = data;
      if (collectionIds) {
        await tx.productCollection.deleteMany({ where: { productId: id } });
        await tx.productCollection.createMany({ data: collectionIds.map((collectionId: string) => ({ productId: id, collectionId })), skipDuplicates: true });
      }
      return tx.product.update({ where: { id }, data: values, include: { category: true, variants: { include: { inventory: true } } } });
    });
  }

  static async deleteProduct(id: string) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
