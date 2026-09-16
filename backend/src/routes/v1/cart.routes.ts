import { Router } from 'express';
import { CartController } from '../../controllers/cart.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { addToCartSchema, updateCartItemSchema, applyCouponSchema } from '../../validators/cart.validator';

const router = Router();

router.use(authMiddleware);

router.get('/', CartController.getCart);
router.post('/items', validate(addToCartSchema), CartController.addItem);
router.patch('/items/:id', validate(updateCartItemSchema), CartController.updateItem);
router.delete('/items/:id', CartController.removeItem);
router.delete('/', CartController.clearCart);
router.post('/apply-coupon', validate(applyCouponSchema), CartController.applyCoupon);

export default router;
