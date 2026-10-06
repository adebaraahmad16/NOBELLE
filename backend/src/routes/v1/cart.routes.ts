import { Router } from 'express';
import { CartController } from '../../controllers/cart.controller';
import { cartOwner } from '../../middleware/cartOwner.middleware';
import { rateLimit } from '../../middleware/rateLimit.middleware';
import { validate } from '../../middleware/validate.middleware';
import { addToCartSchema, updateCartItemSchema, applyCouponSchema } from '../../validators/cart.validator';

const router = Router();

router.use(rateLimit(120, 60000), cartOwner);

router.get('/', CartController.getCart);
router.post('/items', validate(addToCartSchema), CartController.addItem);
router.patch('/items/:id', validate(updateCartItemSchema), CartController.updateItem);
router.delete('/items/:id', CartController.removeItem);
router.delete('/', CartController.clearCart);
router.post('/apply-coupon', validate(applyCouponSchema), CartController.applyCoupon);

export default router;
