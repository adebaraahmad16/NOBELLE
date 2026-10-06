import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { TokenUtil } from '../utils/token';
import { ENV } from '../config/env';
import { authMiddleware } from './auth.middleware';

export function guestToken(req: Request) {
  const value = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('nobelle_guest_cart='))?.slice('nobelle_guest_cart='.length);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export function cartOwner(req: Request, res: Response, next: NextFunction) {
  if (req.headers.authorization) return authMiddleware(req, res, error => {
    if (error) return next(error);
    req.cartOwner = req.user!.id; next();
  });
  const token = guestToken(req) || randomBytes(32).toString('hex');
  res.cookie('nobelle_guest_cart', token, { httpOnly: true, sameSite: 'lax', secure: ENV.NODE_ENV === 'production', path: '/api/v1', maxAge: 30 * 86400_000 });
  req.cartOwner = `guest:${TokenUtil.hashToken(token)}`;
  next();
}
