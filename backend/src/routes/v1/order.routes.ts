import { Router } from 'express';
import { OrderController } from '../../controllers/order.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createOrderSchema } from '../../validators/order.validator';
import { action } from '../../controllers/customer.controller';
import { OrderService } from '../../services/order.service';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createOrderSchema), OrderController.create);
router.get('/', OrderController.listCustomerOrders);
router.get('/my-orders', OrderController.listCustomerOrders);
router.post('/:id/cancel',action(req=>OrderService.cancelCustomer(req.params.id,req.user!.id)));
router.get('/:id/invoice',action(req=>OrderService.invoice(req.params.id,req.user!.id)));
router.get('/:id', OrderController.getById);

export default router;
