import { Router } from 'express';
import { ContentController } from '../../controllers/content.controller';

const router = Router();

router.get('/homepage', ContentController.getHomepage);
router.get('/about', ContentController.getAbout);
router.get('/contact', ContentController.getContact);
router.get('/banners', ContentController.getBanners);
router.post('/contact', ContentController.submitContact);

export default router;
