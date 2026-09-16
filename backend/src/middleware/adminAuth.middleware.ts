import { Request, Response, NextFunction } from 'express';
import { TokenUtil } from '../utils/token';
import { ApiError } from '../utils/apiError';
import prisma from '../repositories/prisma';

export function adminAuthMiddleware(allowedRoles?: Array<'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT'>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw ApiError.unauthorized('Admin access token missing');
      }

      const token = authHeader.split(' ')[1];
      const decoded = TokenUtil.verifyAccessToken(token);

      if (decoded.role !== 'ADMIN') {
        throw ApiError.forbidden('Admin authorization required');
      }

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!admin || !admin.isActive) {
        throw ApiError.unauthorized('Admin account is inactive or disabled');
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(admin.role as any)) {
        throw ApiError.forbidden('Insufficient permissions for this action');
      }

      req.admin = {
        id: admin.id,
        email: admin.email,
        role: 'ADMIN',
        adminRole: admin.role as any,
      };

      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Admin token expired'));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(ApiError.unauthorized('Invalid admin token'));
      }
      next(error);
    }
  };
}
