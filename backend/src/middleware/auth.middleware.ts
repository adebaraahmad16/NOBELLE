import { Request, Response, NextFunction } from 'express';
import { TokenUtil } from '../utils/token';
import { ApiError } from '../utils/apiError';
import prisma from '../repositories/prisma';

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    const decoded = TokenUtil.verifyAccessToken(token);

    if (decoded.role !== 'CUSTOMER') {
      throw ApiError.forbidden('Access denied for customer resource');
    }

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, isActive: true, deletedAt: true },
    });

    if (!customer || !customer.isActive || customer.deletedAt) {
      throw ApiError.unauthorized('Account is inactive or not found');
    }

    req.user = {
      id: customer.id,
      email: customer.email,
      role: 'CUSTOMER',
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token has expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid access token'));
    }
    next(error);
  }
}
