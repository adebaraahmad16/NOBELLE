import { Router } from 'express';
import { PaymentController } from '../../controllers/payment.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/initialize', authMiddleware, PaymentController.initialize);
router.get('/verify/:reference', authMiddleware, PaymentController.verify);
router.post('/webhook', PaymentController.webhook);

export default router;
