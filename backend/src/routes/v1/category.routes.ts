import { Router } from 'express';
import { CategoryController } from '../../controllers/category.controller';

import { action } from '../../controllers/customer.controller';
import { ProductService } from '../../services/product.service';
const router = Router();

router.get('/', CategoryController.list);
router.get('/:slug/products', action(async req => (await ProductService.listProducts({ ...req.query, category: req.params.slug }))));
router.get('/:slug', CategoryController.getBySlug);

export default router;
