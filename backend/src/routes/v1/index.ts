import settingsRoutes from './settings.routes';
import { SettingsService } from '../../services/settings.service';
import { settingsAssetDirectory } from '../../services/settingsAsset.service';
import express from 'express';
import { action } from '../../controllers/customer.controller';
import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import collectionRoutes from './collection.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import contentRoutes from './content.routes';
import adminRoutes from './admin.routes';
import customerRoutes from './customer.routes';
import adminOperationsRoutes from './adminOperations.routes';

const router = Router();
router.get('/store/settings', action(() => SettingsService.publicSettings()));
router.get('/policies/:id', action(req => SettingsService.publishedPolicy(req.params.id)));
router.use('/store-assets', express.static(settingsAssetDirectory(), { dotfiles:'deny', maxAge:'1d', index:false }));

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/collections', collectionRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/content', contentRoutes);
router.use('/admin', adminRoutes);
router.use('/admin', settingsRoutes);
router.use('/admin', adminOperationsRoutes);
router.use(customerRoutes);

export default router;
