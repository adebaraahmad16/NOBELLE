import prisma from '../repositories/prisma';
import { generateSlug } from '../utils/slug';
import { ApiError } from '../utils/apiError';

export class CollectionService {
  static async list() {
    return prisma.collection.findMany({
      where: { deletedAt: null, isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getBySlug(slug: string) {
    const collection = await prisma.collection.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true, deletedAt: null },
          include: { images: true, variants: { include: { inventory: true } } },
        },
      },
    });
    if (!collection || collection.deletedAt) throw ApiError.notFound('Collection not found');
    return collection;
  }

  static async create(data: { name: string; description?: string; imageUrl?: string; isActive?: boolean }) {
    const slug = generateSlug(data.name);
    return prisma.collection.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async update(id: string, data: any) {
    if (data.name) {
      data.slug = generateSlug(data.name);
    }
    return prisma.collection.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.collection.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
