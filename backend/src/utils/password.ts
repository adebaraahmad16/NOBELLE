import bcrypt from 'bcryptjs';
import { ApiError } from './apiError';

export class PasswordUtil {
  private static readonly SALT_ROUNDS = 12;

  static async hash(password: string): Promise<string> {
    if (Buffer.byteLength(password, 'utf8') > 72) throw ApiError.unprocessable('Password must not exceed 72 UTF-8 bytes');
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    if (Buffer.byteLength(password, 'utf8') > 72) return false;
    return bcrypt.compare(password, hash);
  }
}
