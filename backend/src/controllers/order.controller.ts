import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { ApiResponse } from '../utils/apiResponse';

export class OrderController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.createOrder(req.user!.id, req.body);
      return ApiResponse.created(res, order, 'Order created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listCustomerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.getCustomerOrders(req.user!.id, req.query);
      return ApiResponse.success(res, result.data, 'Orders retrieved', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.getOrderById(req.params.id, req.user!.id);
      return ApiResponse.success(res, order);
    } catch (error) {
      next(error);
    }
  }
}
