import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { ApiResponse } from '../utils/apiResponse';

export class PaymentController {
  static async initialize(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.body;
      const data = await PaymentService.initializePayment(orderId, req.user!.id);
      return ApiResponse.success(res, data, 'Payment initialized');
    } catch (error) {
      next(error);
    }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.verifyPayment(req.params.reference);
      return ApiResponse.success(res, payment, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  }

  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      await PaymentService.handleWebhook(signature, req.body);
      return res.status(200).send({ received: true });
    } catch (error) {
      next(error);
    }
  }
}
