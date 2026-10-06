import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { CustomerController } from '../../controllers/customer.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', CustomerController.recovery);
router.post('/reset-password', CustomerController.reset);
router.post('/verify-email', CustomerController.verify);
router.get('/me', authMiddleware, AuthController.getMe);

export default router;
