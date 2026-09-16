import prisma from '../repositories/prisma';
import { generateSlug } from '../utils/slug';
import { ApiError } from '../utils/apiError';

export class CategoryService {
  static async list() {
    return prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true, deletedAt: null },
          include: { images: true, variants: { include: { inventory: true } } },
        },
      },
    });
    if (!category || category.deletedAt) throw ApiError.notFound('Category not found');
    return category;
  }

  static async create(data: { name: string; description?: string; imageUrl?: string; isActive?: boolean }) {
    const slug = generateSlug(data.name);
    return prisma.category.create({
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
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
