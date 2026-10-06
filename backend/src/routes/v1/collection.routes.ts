import { Router } from 'express';
import { CollectionController } from '../../controllers/collection.controller';

import { action } from '../../controllers/customer.controller';
import { ProductService } from '../../services/product.service';
const router = Router();

router.get('/', CollectionController.list);
router.get('/:slug/products', action(async req => (await ProductService.listProducts({ ...req.query, collection: req.params.slug }))));
router.get('/:slug', CollectionController.getBySlug);

export default router;
