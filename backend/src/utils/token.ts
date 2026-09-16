import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { AuthUser } from '../types';

export class TokenUtil {
  static generateAccessToken(payload: AuthUser): string {
    return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
    });
  }

  static generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
    const token = crypto.randomBytes(40).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return { token, hash, expiresAt };
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static verifyAccessToken(token: string): AuthUser {
    return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as AuthUser;
  }
}
