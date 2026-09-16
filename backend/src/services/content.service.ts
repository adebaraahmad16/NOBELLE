import prisma from '../repositories/prisma';

export class ContentService {
  static async getContent(slug: string) {
    return prisma.websiteContent.findUnique({
      where: { slug },
    });
  }

  static async updateContent(slug: string, data: any, title = slug) {
    return prisma.websiteContent.upsert({
      where: { slug },
      create: { slug, title, data },
      update: { data, updatedAt: new Date() },
    });
  }

  static async getActiveBanners() {
    return prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  static async createBanner(data: any) {
    return prisma.banner.create({ data });
  }

  static async updateBanner(id: string, data: any) {
    return prisma.banner.update({ where: { id }, data });
  }

  static async deleteBanner(id: string) {
    return prisma.banner.delete({ where: { id } });
  }

  static async submitContact(data: { name: string; email: string; phone?: string; subject: string; message: string }) {
    return prisma.contactMessage.create({ data });
  }
}
