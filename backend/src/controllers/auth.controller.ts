import { CartService } from '../services/cart.service';
import { guestToken } from '../middleware/cartOwner.middleware';
import { publicSession, refreshCookie, clearSessionCookie } from '../utils/sessionCookie';
import { SessionService } from '../services/session.service';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      await CartService.mergeGuest(result.customer.id, guestToken(req));
      return ApiResponse.created(res, publicSession(res, result, false), 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, remember } = req.body;
      const result = await AuthService.login(email, password, remember);
      await CartService.mergeGuest(result.customer.id, guestToken(req));
      return ApiResponse.success(res, publicSession(res, result, false), 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = refreshCookie(req, false);
      const result = await SessionService.rotate(refreshToken, false);
      return ApiResponse.success(res, publicSession(res, result, false), 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = refreshCookie(req, false);
      await AuthService.logout(refreshToken);
      clearSessionCookie(res, false);
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await AuthService.getProfile(req.user!.id);
      return ApiResponse.success(res, profile);
    } catch (error) {
      next(error);
    }
  }
}
