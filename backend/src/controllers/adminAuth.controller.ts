import { publicSession, refreshCookie, clearSessionCookie } from '../utils/sessionCookie';
import { SessionService } from '../services/session.service';
import { Request, Response, NextFunction } from 'express';
import { AdminAuthService } from '../services/adminAuth.service';
import { ApiResponse } from '../utils/apiResponse';

export class AdminAuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, remember } = req.body;
      const result = await AdminAuthService.login(email, password, remember, req.get('user-agent'));
      return ApiResponse.success(res, publicSession(res, result, true), 'Admin login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = refreshCookie(req, true);
      const result = await SessionService.rotate(refreshToken, true);
      return ApiResponse.success(res, publicSession(res, result, true), 'Admin token refreshed');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = refreshCookie(req, true);
      await AdminAuthService.logout(refreshToken);
      clearSessionCookie(res, true);
      return ApiResponse.success(res, null, 'Admin logged out');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = await AdminAuthService.getMe(req.admin!.id);
      return ApiResponse.success(res, admin);
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AdminAuthService.forgotPassword(email);
      return ApiResponse.success(res, result, 'If an admin account exists for that email, reset instructions will be emailed.');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      await AdminAuthService.resetPassword(token, newPassword);
      return ApiResponse.success(res, null, 'Password updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}
