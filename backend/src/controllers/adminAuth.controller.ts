import { Request, Response, NextFunction } from 'express';
import { AdminAuthService } from '../services/adminAuth.service';
import { ApiResponse } from '../utils/apiResponse';

export class AdminAuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AdminAuthService.login(email, password);
      return ApiResponse.success(res, result, 'Admin login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AdminAuthService.refreshToken(refreshToken);
      return ApiResponse.success(res, result, 'Admin token refreshed');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await AdminAuthService.logout(refreshToken);
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
}
