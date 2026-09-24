import { Router } from 'express';
import { AdminAuthController } from '../../controllers/adminAuth.controller';
import { AdminController } from '../../controllers/admin.controller';
import { ProductController } from '../../controllers/product.controller';
import { CategoryController } from '../../controllers/category.controller';
import { CollectionController } from '../../controllers/collection.controller';
import { adminAuthMiddleware } from '../../middleware/adminAuth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from '../../validators/auth.validator';
import { createProductSchema, updateProductSchema } from '../../validators/product.validator';
import { createCategorySchema, updateCategorySchema } from '../../validators/category.validator';
import { updateOrderStatusSchema } from '../../validators/order.validator';
import { createCouponSchema } from '../../validators/coupon.validator';

const router = Router();

// Public Admin Auth routes
router.post('/auth/login', validate(loginSchema), AdminAuthController.login);
router.post('/auth/refresh', validate(refreshTokenSchema), AdminAuthController.refreshToken);
router.post('/auth/logout', AdminAuthController.logout);
router.post('/auth/forgot-password', validate(forgotPasswordSchema), AdminAuthController.forgotPassword);
router.post('/auth/reset-password', validate(resetPasswordSchema), AdminAuthController.resetPassword);

// Protected Admin routes
router.use(adminAuthMiddleware());

router.get('/auth/me', AdminAuthController.getMe);
router.get('/dashboard', AdminController.getDashboard);

// Admin Products
router.post('/products', validate(createProductSchema), ProductController.create);
router.patch('/products/:id', validate(updateProductSchema), ProductController.update);
router.delete('/products/:id', ProductController.delete);

// Admin Categories
router.post('/categories', validate(createCategorySchema), CategoryController.create);
router.patch('/categories/:id', validate(updateCategorySchema), CategoryController.update);
router.delete('/categories/:id', CategoryController.delete);

// Admin Collections
router.post('/collections', CollectionController.create);
router.patch('/collections/:id', CollectionController.update);
router.delete('/collections/:id', CollectionController.delete);

// Admin Orders
router.get('/orders', AdminController.listOrders);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), AdminController.updateOrderStatus);

// Admin Inventory
router.get('/inventory', AdminController.listInventory);
router.patch('/inventory/:variantId', AdminController.updateInventory);

// Admin Customers
router.get('/customers', AdminController.listCustomers);

// Admin Coupons
router.get('/coupons', AdminController.listCoupons);
router.post('/coupons', validate(createCouponSchema), AdminController.createCoupon);

// Admin Content
router.patch('/content/:slug', AdminController.updateContent);
router.get('/activity-logs', AdminController.listActivityLogs);

export default router;
