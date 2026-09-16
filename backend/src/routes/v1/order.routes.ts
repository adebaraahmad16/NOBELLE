import { Router } from 'express';
import { OrderController } from '../../controllers/order.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createOrderSchema } from '../../validators/order.validator';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createOrderSchema), OrderController.create);
router.get('/', OrderController.listCustomerOrders);
router.get('/:id', OrderController.getById);

export default router;
