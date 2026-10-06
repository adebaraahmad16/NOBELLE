import prisma from '../repositories/prisma';
import { z } from 'zod';
import { ApiError } from '../utils/apiError';
const text = z.string().max(5000).optional();
const link = z.string().regex(/^\/(?!\/)/).or(z.literal('')).optional();
const image = z.string().url().or(z.literal('')).optional();
const schemas: Record<string, z.ZodTypeAny> = {
  homepage: z.object({ heroTitle: text, heroSubtitle: text, heroTagline: text, heroImage: image,
    ctaText: text, ctaLink: link, featuredCollectionTitle: text,
    featuredProductIds: z.array(z.string().uuid()).max(30).optional(), featuredCollectionIds: z.array(z.string().uuid()).max(30).optional() }),
  about: z.object({ title: text, content: z.string().max(50000).optional() }),
  contact: z.object({ email: z.string().email().or(z.literal('')).optional(), phone: z.string().max(30).optional(), address: text, hours: text }),
};

export class ContentService {
  static async getContent(slug: string) {
    if (slug === 'store-settings') return null;
    const content = await prisma.websiteContent.findUnique({ where: { slug } });
    if (slug !== 'homepage') return content;
    const banners = await this.getActiveBanners();
    const sections = await prisma.homepageSection.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 30 });
    return { ...content, data: { ...(content?.data as object || {}), sections, banners: banners.map(b => ({ ...b, image: b.imageUrl, link: b.linkUrl })) } };

  }

  static async updateContent(slug: string, data: any, title = slug) {
    const parsed = schemas[slug]?.safeParse(data);
    if (!parsed?.success) throw ApiError.unprocessable('Invalid website content');
    data = parsed.data;
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
