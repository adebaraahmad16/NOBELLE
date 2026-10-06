import { SettingsService } from '../services/settings.service';
import { requiredPermission } from './adminPermissions';
import { Request, Response, NextFunction } from 'express';
import { TokenUtil } from '../utils/token';
import { ApiError } from '../utils/apiError';
import prisma from '../repositories/prisma';

export function adminAuthMiddleware(allowedRoles?: Array<'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT' | 'ORDER_MANAGER' | 'INVENTORY_MANAGER' | 'MARKETING_MANAGER'>) {
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

      if (!decoded.sid) throw ApiError.unauthorized('Refresh your admin session');
      const session = await prisma.refreshToken.findUnique({ where: { id: decoded.sid } });
      if (!session || session.adminId !== decoded.id || session.userType !== 'ADMIN' || session.revoked || session.expiresAt <= new Date()) throw ApiError.unauthorized('Session has ended');
      if (!session.lastActiveAt || Date.now() - session.lastActiveAt.getTime() > 60000) await prisma.refreshToken.updateMany({ where: { id: session.id, revoked: false }, data: { lastActiveAt: new Date() } });
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, isActive: true, deletedAt:true },
      });

      if (!admin || !admin.isActive || admin.deletedAt) {
        throw ApiError.unauthorized('Admin account is inactive or disabled');
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(admin.role as any)) {
        throw ApiError.forbidden('Insufficient permissions for this action');
      }

      const permission=requiredPermission(req.method,req.path,req.body);
      if(permission && !(await SettingsService.permissions(admin.role)).includes(permission))throw ApiError.forbidden('Your role does not have permission for this action');
      req.admin = {
        id: admin.id,
        email: admin.email,
        role: 'ADMIN',
        sid: decoded.sid,
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
