import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { AuthUser } from '../types';

export class TokenUtil {
  static generateAccessToken(payload: AuthUser): string {
    return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any, algorithm: 'HS256', issuer: 'nobelle', audience: 'nobelle-api',
    });
  }

  static generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
    const token = crypto.randomBytes(40).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + this.refreshTTL());
    return { token, hash, expiresAt };
  }

  static refreshTTL() {
    const match = /^(\d+)([smhd])$/.exec(ENV.JWT_REFRESH_EXPIRES_IN);
    if (!match) throw new Error('JWT refresh expiry must use seconds, minutes, hours or days');
    const units: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return Number(match[1]) * units[match[2]];
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static verifyAccessToken(token: string): AuthUser {
    return jwt.verify(token, ENV.JWT_ACCESS_SECRET, { algorithms: ['HS256'], issuer: 'nobelle', audience: 'nobelle-api' }) as AuthUser;
  }
}
