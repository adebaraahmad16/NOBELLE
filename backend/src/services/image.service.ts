import axios from 'axios';
import { createHash } from 'crypto';
import prisma from '../repositories/prisma';
import { ApiError } from '../utils/apiError';
import { serializable } from '../database/transaction';

function cloud() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secret) throw ApiError.internal('Image storage is not configured');
  return { cloudName, apiKey, secret };
}
function validImage(file: Express.Multer.File) {
  const bytes = file.buffer;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!(png && file.mimetype === 'image/png' && /\.png$/i.test(file.originalname)) &&
      !(jpeg && file.mimetype === 'image/jpeg' && /\.jpe?g$/i.test(file.originalname)) &&
      !(webp && file.mimetype === 'image/webp' && /\.webp$/i.test(file.originalname))) throw ApiError.badRequest('Invalid image content, type, or extension');
}
export class ImageService {
  static async upload(productId: string, files: Express.Multer.File[]) {
    if (!await prisma.product.findFirst({ where: { id: productId, deletedAt: null } })) throw ApiError.notFound('Product not found');
    if (!files.length) throw ApiError.badRequest('Select at least one image');
    files.forEach(validImage);
    const { cloudName, apiKey, secret } = cloud();
    const results: { url: string; storageId: string }[] = [];
    try {
      for (const file of files) {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = createHash('sha1').update(`folder=nobelle/products&timestamp=${timestamp}${secret}`).digest('hex');
        const form = new FormData();
        form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
        form.append('folder', 'nobelle/products'); form.append('timestamp', String(timestamp));
        form.append('api_key', apiKey); form.append('signature', signature);
        const { data } = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, form, { timeout: 30000 });
        results.push({ url: data.secure_url, storageId: data.public_id });
      }
      return await serializable(async tx => {
        const count = await tx.productImage.count({ where: { productId } });
        const images: Awaited<ReturnType<typeof tx.productImage.create>>[] = [];
        for (let i = 0; i < results.length; i++) images.push(await tx.productImage.create({ data: {
          productId, ...results[i], sortOrder: count + i, isPrimary: count + i === 0,
        } }));
        return images;
      });
    } catch (error) {
      for (const result of results) await this.destroy(result.storageId).catch(() => console.error('Storage cleanup failed'));
      throw error;
    }
  }
  static async destroy(storageId: string) {
    const { cloudName, apiKey, secret } = cloud();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1').update(`public_id=${storageId}&timestamp=${timestamp}${secret}`).digest('hex');
    await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, new URLSearchParams({
      public_id: storageId, timestamp: String(timestamp), api_key: apiKey, signature,
    }), { timeout: 15000 });
  }
  static async remove(productId: string, id: string) {
    const image = await prisma.productImage.findFirst({ where: { id, productId } });
    if (!image) throw ApiError.notFound('Image not found');
    const historicalReferences = await prisma.orderItem.count({ where: { productImage: image.url } });
    if (image.storageId && !historicalReferences) await this.destroy(image.storageId);
    return serializable(async tx => {
      await tx.productImage.deleteMany({ where: { id, productId } });
      if (image.isPrimary) {
        const next = await tx.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: 'asc' } });
        if (next) await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
      return { deleted: true };
    });
  }
  static async reorder(productId: string, ids: string[]) {
    return serializable(async tx => {
      const images = await tx.productImage.findMany({ where: { productId } });
      if (new Set(ids).size !== ids.length || ids.length !== images.length || ids.some(id => !images.some(image => image.id === id))) throw ApiError.badRequest('Supply every image exactly once');
      for (let i = 0; i < ids.length; i++) await tx.productImage.update({ where: { id: ids[i] }, data: { sortOrder: i, isPrimary: i === 0 } });
      return tx.productImage.findMany({ where: { productId }, orderBy: { sortOrder: 'asc' } });
    });
  }
}
