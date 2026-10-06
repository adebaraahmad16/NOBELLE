import { Router } from 'express';
import { PaymentController } from '../../controllers/payment.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const initializeSchema = z.object({ body: z.object({ orderId: z.string().uuid() }) });
router.post('/initialize', authMiddleware, validate(initializeSchema), PaymentController.initialize);
router.post('/paystack/initialize', authMiddleware, validate(initializeSchema), PaymentController.initialize);
router.get('/verify/:reference', authMiddleware, PaymentController.verify);
router.get('/paystack/verify/:reference', authMiddleware, PaymentController.verify);
router.post('/webhook', PaymentController.webhook);

export default router;
