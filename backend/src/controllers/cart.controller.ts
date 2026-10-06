import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';
import { CouponService } from '../services/coupon.service';
import { ApiResponse } from '../utils/apiResponse';

export class CartController {
  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await CartService.getOrCreateCart(req.cartOwner!);
      return ApiResponse.success(res, cart);
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId, quantity } = req.body;
      const cart = await CartService.addItem(req.cartOwner!, variantId, quantity);
      return ApiResponse.success(res, cart, 'Item added to cart');
    } catch (error) {
      next(error);
    }
  }

  static async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { quantity } = req.body;
      const cart = await CartService.updateItemQuantity(req.cartOwner!, req.params.id, quantity);
      return ApiResponse.success(res, cart, 'Cart updated');
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await CartService.removeItem(req.cartOwner!, req.params.id);
      return ApiResponse.success(res, cart, 'Item removed');
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await CartService.clearCart(req.cartOwner!);
      return ApiResponse.success(res, cart, 'Cart cleared');
    } catch (error) {
      next(error);
    }
  }

  static async applyCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const cart = await CartService.getOrCreateCart(req.cartOwner!);
      const result = await CouponService.validateCoupon(code, cart.subtotal);
      return ApiResponse.success(res, result, 'Coupon applied successfully');
    } catch (error) {
      next(error);
    }
  }
}
