import { Request, Response, NextFunction } from 'express';
import { CollectionService } from '../services/collection.service';
import { ApiResponse } from '../utils/apiResponse';

export class CollectionController {
  static async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const collections = await CollectionService.list();
      return ApiResponse.success(res, collections);
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const collection = await CollectionService.getBySlug(req.params.slug);
      return ApiResponse.success(res, collection);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const collection = await CollectionService.create(req.body);
      return ApiResponse.created(res, collection);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const collection = await CollectionService.update(req.params.id, req.body);
      return ApiResponse.success(res, collection);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CollectionService.delete(req.params.id);
      return ApiResponse.success(res, null, 'Collection deleted');
    } catch (error) {
      next(error);
    }
  }
}
