import { TokenUtil } from './token';
import { Request, Response } from 'express';
import { ENV } from '../config/env';
import { ApiError } from './apiError';

const name = (admin: boolean) => admin ? 'nobelle_admin_refresh' : 'nobelle_customer_refresh';
export function refreshCookie(req: Request, admin: boolean): string {
  const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${name(admin)}=`));
  const token = cookie ? decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1)) : req.body?.refreshToken;
  if (typeof token !== 'string' || !token) throw ApiError.unauthorized('Session is missing');
  return token;
}
export function setSessionCookie(res: Response, token: string, admin: boolean, remember = false) {
  res.cookie(name(admin), token, { httpOnly: true, secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax', path: admin ? '/api/v1/admin/auth' : '/api/v1/auth', ...(remember ? { maxAge: TokenUtil.refreshTTL() } : {}) });
}
export function clearSessionCookie(res: Response, admin: boolean) {
  res.clearCookie(name(admin), { httpOnly: true, secure: ENV.NODE_ENV === 'production', sameSite: 'lax',
    path: admin ? '/api/v1/admin/auth' : '/api/v1/auth' });
}
export function publicSession(res: Response, result: any, admin: boolean) {
  setSessionCookie(res, result.refreshToken, admin, result.remember || false);
  const { refreshToken, remember, ...data } = result;
  return data;
}
