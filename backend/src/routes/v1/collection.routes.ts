import { Router } from 'express';
import { CollectionController } from '../../controllers/collection.controller';

const router = Router();

router.get('/', CollectionController.list);
router.get('/:slug', CollectionController.getBySlug);

export default router;
