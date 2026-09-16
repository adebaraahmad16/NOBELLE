import path from 'path';
import fs from 'fs';
import { ENV } from '../config/env';

export interface StorageAdapter {
  upload(file: Express.Multer.File): Promise<string>;
  delete(fileUrlOrKey: string): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  async upload(file: Express.Multer.File): Promise<string> {
    return `/uploads/${file.filename}`;
  }

  async delete(fileUrlOrKey: string): Promise<void> {
    const filename = path.basename(fileUrlOrKey);
    const filePath = path.resolve(ENV.UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

export class StorageService {
  private static adapter: StorageAdapter = new LocalStorageAdapter();

  static async uploadFile(file: Express.Multer.File): Promise<string> {
    return this.adapter.upload(file);
  }

  static async deleteFile(fileUrlOrKey: string): Promise<void> {
    return this.adapter.delete(fileUrlOrKey);
  }
}
