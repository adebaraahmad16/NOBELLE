import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { ApiResponse } from '../utils/apiResponse';

export class CategoryController {
  static async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.list();
      return ApiResponse.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.getBySlug(req.params.slug);
      return ApiResponse.success(res, category);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.create(req.body);
      return ApiResponse.created(res, category);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.update(req.params.id, req.body);
      return ApiResponse.success(res, category);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CategoryService.delete(req.params.id);
      return ApiResponse.success(res, null, 'Category deleted');
    } catch (error) {
      next(error);
    }
  }
}
