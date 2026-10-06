import { page } from './customer.controller';
import { InventoryService } from '../services/inventory.service';
import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { DashboardService } from '../services/dashboard.service';
import { CouponService } from '../services/coupon.service';
import { ContentService } from '../services/content.service';
import { ApiResponse } from '../utils/apiResponse';
import prisma from '../repositories/prisma';

export class AdminController {
  static async getDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await DashboardService.getStats();
      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.listAdminOrders(req.query);
      return ApiResponse.success(res, result.data, 'Orders retrieved', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.updateOrderStatus(req.params.id, req.body.status, req.admin!.id);
      return ApiResponse.success(res, order, 'Order status updated');
    } catch (error) {
      next(error);
    }
  }

  static async listCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await prisma.customer.findMany({
        ...page(req),
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return ApiResponse.success(res, customers);
    } catch (error) {
      next(error);
    }
  }

  static async listInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await prisma.inventory.findMany({
        skip: page(req).skip, take: page(req).take,
        include: {
          variant: {
            include: { product: true },
          },
        },
      });
      return ApiResponse.success(res, inventory);
    } catch (error) {
      next(error);
    }
  }

  static async updateInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await InventoryService.adjust(req.params.variantId, req.body.quantity, req.body.reason, req.admin!.id);
      return ApiResponse.success(res, updated, 'Inventory updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listCoupons(_req: Request, res: Response, next: NextFunction) {
    try {
      const coupons = await CouponService.listAdminCoupons();
      return ApiResponse.success(res, coupons);
    } catch (error) {
      next(error);
    }
  }

  static async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await CouponService.createCoupon(req.body);
      await prisma.activityLog.create({ data: { adminId: req.admin!.id, action: 'CREATE_COUPON', entity: 'Coupon', entityId: coupon.id } });
      return ApiResponse.created(res, coupon);
    } catch (error) {
      next(error);
    }
  }

  static async updateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const content = await ContentService.updateContent(slug, req.body.data);
      await prisma.activityLog.create({ data: { adminId: req.admin!.id, action: 'UPDATE_WEBSITE_CONTENT', entity: 'WebsiteContent', entityId: content.id } });
      return ApiResponse.success(res, content, 'Content updated');
    } catch (error) {
      next(error);
    }
  }

  static async listActivityLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.activityLog.findMany({
        ...page(req),
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { name: true, email: true } } },
      });
      return ApiResponse.success(res, logs);
    } catch (error) {
      next(error);
    }
  }
}
