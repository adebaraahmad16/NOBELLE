import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service';
import { ApiResponse } from '../utils/apiResponse';

export class ContentController {
  static async getHomepage(_req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.getContent('homepage');
      return ApiResponse.success(res, content?.data || {});
    } catch (error) {
      next(error);
    }
  }

  static async getAbout(_req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.getContent('about');
      return ApiResponse.success(res, content?.data || {});
    } catch (error) {
      next(error);
    }
  }

  static async getContact(_req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.getContent('contact');
      return ApiResponse.success(res, content?.data || {});
    } catch (error) {
      next(error);
    }
  }

  static async getBanners(_req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await ContentService.getActiveBanners();
      return ApiResponse.success(res, banners);
    } catch (error) {
      next(error);
    }
  }

  static async submitContact(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await ContentService.submitContact(req.body);
      return ApiResponse.created(res, message, 'Message sent successfully');
    } catch (error) {
      next(error);
    }
  }
}
