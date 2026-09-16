import { Router } from 'express';
import { ProductController } from '../../controllers/product.controller';
import { validate } from '../../middleware/validate.middleware';
import { productQuerySchema } from '../../validators/product.validator';

const router = Router();

router.get('/', validate(productQuerySchema), ProductController.list);
router.get('/featured', ProductController.getFeatured);
router.get('/new-arrivals', ProductController.getNewArrivals);
router.get('/best-sellers', ProductController.getBestSellers);
router.get('/:slug', ProductController.getBySlug);

export default router;
