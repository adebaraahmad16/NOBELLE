import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ApiResponse } from '../utils/apiResponse';

export class ProductController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.listProducts(req.query);
      return ApiResponse.success(res, result.data, 'Products retrieved', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductBySlug(req.params.slug);
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async getFeatured(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getFeatured();
      return ApiResponse.success(res, products);
    } catch (error) {
      next(error);
    }
  }

  static async getNewArrivals(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getNewArrivals();
      return ApiResponse.success(res, products);
    } catch (error) {
      next(error);
    }
  }

  static async getBestSellers(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getBestSellers();
      return ApiResponse.success(res, products);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(req.body, req.admin!.id);
      return ApiResponse.created(res, product, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      await (await import('../repositories/prisma')).default.activityLog.create({ data: { adminId: req.admin!.id, action: 'UPDATE_PRODUCT', entity: 'Product', entityId: product.id } });
      return ApiResponse.success(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.deleteProduct(req.params.id);
      return ApiResponse.success(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
