import { SettingsService } from '../../services/settings.service';
import { AdminSummaryService } from '../../services/adminSummary.service';
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../repositories/prisma';
import { action, page } from '../../controllers/customer.controller';
import { adminAuthMiddleware } from '../../middleware/adminAuth.middleware';
import { OrderService } from '../../services/order.service';
import { AdminOperationsService } from '../../services/adminOperations.service';
import { ApiError } from '../../utils/apiError';
import multer from 'multer';
import { ImageService } from '../../services/image.service';
import { VariantService } from '../../services/variant.service';
import { RefundService } from '../../services/refund.service';
const router = Router();
router.use(adminAuthMiddleware());
router.get('/summary/:section', action(req => AdminSummaryService.get(req.params.section)));
router.get('/customers/:id', action(async req => {
  const customer = await prisma.customer.findFirst({ where: { id: req.params.id, deletedAt: null }, select: {
    id: true, firstName: true, lastName: true, email: true, phone: true, isActive: true, createdAt: true,
    addresses: { take: 20 }, orders: { take: 50, orderBy: { createdAt: 'desc' }, select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true } },
    wishlist: { select: { items: { take: 50, select: { id: true, product: { select: { id: true, name: true } } } } } },
    returns: { take: 20, orderBy: { createdAt: 'desc' }, select: { id: true, status: true, reason: true, createdAt: true } },
    _count: { select: { orders: true } },
  } });
  if (!customer) throw ApiError.notFound('Customer not found');
  const [payments, refunds] = await Promise.all([
    prisma.payment.aggregate({ where: { status: 'SUCCESS', order: { customerId: customer.id, status: { not: 'CANCELLED' } } }, _sum: { amount: true } }),
    prisma.paymentRefund.aggregate({ where: { status: 'SUCCESS', returnRequest: { customerId: customer.id } }, _sum: { amount: true } }),
  ]);
  return { ...customer, totalSpent: payments._sum.amount?.sub(refunds._sum.amount || 0).toFixed(2) || '0.00' };
}));

router.get('/staff', action(() => SettingsService.staff()));
router.get('/stock-history', action(async req => {
  const history = await prisma.inventoryTransaction.findMany({ ...page(req), orderBy: { createdAt: 'desc' }, include: { inventory: { include: { variant: { include: { product: { select: { name: true } } } } } } } });
  const admins = await prisma.admin.findMany({ where: { id: { in: history.map(item => item.recordedBy).filter((id): id is string => Boolean(id)) } }, select: { id: true, name: true } });
  return history.map(item => ({ ...item, recordedByName: admins.find(admin => admin.id === item.recordedBy)?.name || (item.recordedBy ? 'Former administrator' : 'System') }));
}));

router.post('/returns/:id/refund', action(req => RefundService.initiate(req.params.id, req.admin!.id)));
router.post('/refunds/:gatewayId/verify', action(req => RefundService.synchronize(req.params.gatewayId)));
const variantSchema = z.object({ sku: z.string().trim().max(100).optional(), size: z.string().trim().min(1).max(40), color: z.string().trim().min(1).max(80), priceDiff: z.number().multipleOf(0.01).default(0), quantity: z.number().int().nonnegative().optional(), isActive: z.boolean().default(true), imageUrl: z.string().url().optional().nullable() });
router.post('/products/:id/variants', action(req => VariantService.save(req.params.id, undefined, req.body, req.admin!.id), variantSchema));
router.patch('/products/:id/variants/:variantId', action(req => VariantService.save(req.params.id, req.params.variantId, req.body, req.admin!.id), variantSchema.omit({ quantity: true })));
const images = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 10 } });
router.post('/products/:id/images', images.array('images', 10), action(req => ImageService.upload(req.params.id, req.files as Express.Multer.File[])));
router.delete('/products/:id/images/:imageId', action(req => ImageService.remove(req.params.id, req.params.imageId)));
router.patch('/products/:id/images/order', action(req => ImageService.reorder(req.params.id, req.body.ids), z.object({ ids: z.array(z.string().uuid()).max(100) })));
const sectionSchema = z.object({ name: z.string().min(1).max(100), heading: z.string().max(200), description: z.string().max(3000), imageUrl: z.string().url().or(z.literal('')).optional(), linkUrl: z.string().regex(/^\/(?!\/)/).or(z.literal('')).optional(), sortOrder: z.number().int().nonnegative().default(0), isActive: z.boolean().default(true) }).transform(({ heading, description, imageUrl, linkUrl, ...rest }) => ({ ...rest, data: { heading, description, imageUrl: imageUrl || '', linkUrl: linkUrl || '' } }));
router.get('/homepage-sections', action(async req => (await prisma.homepageSection.findMany({ skip: page(req).skip, take: page(req).take, orderBy: { sortOrder: 'asc' } })).map(section => ({ ...section, ...(section.data as object) }))));
router.post('/homepage-sections', action(req => prisma.homepageSection.create({ data: req.body }), sectionSchema));
router.patch('/homepage-sections/:id', action(req => prisma.homepageSection.update({ where: { id: req.params.id }, data: req.body }), sectionSchema));
router.delete('/homepage-sections/:id', action(req => prisma.homepageSection.delete({ where: { id: req.params.id } })));
const bannerSchema = z.object({ title: z.string().trim().min(1).max(200), subtitle: z.string().max(1000).optional(), imageUrl: z.string().url(), linkUrl: z.string().regex(/^\/(?!\/)/).optional(), buttonText: z.string().max(100).optional(), sortOrder: z.number().int().nonnegative().default(0), isActive: z.boolean().default(true) });
router.get('/banners', action(req => prisma.banner.findMany({ ...page(req) })));
router.post('/banners', action(req => prisma.banner.create({ data: req.body }), bannerSchema));
router.patch('/banners/:id', action(req => prisma.banner.update({ where: { id: req.params.id }, data: req.body }), bannerSchema.partial()));
router.delete('/banners/:id', action(req => prisma.banner.delete({ where: { id: req.params.id } })));
router.get('/products', action(req => prisma.product.findMany({ where: { deletedAt: null }, ...page(req), include: { collectionLinks: true, category: true, collection: true, images: { orderBy: { sortOrder: 'asc' } }, variants: { include: { inventory: true } } } })));
router.get('/products/:id', action(req => prisma.product.findUniqueOrThrow({ where: { id: req.params.id }, include: { collectionLinks: true, category: true, collection: true, images: true, variants: { include: { inventory: true } } } })));
router.get('/categories', action(req => prisma.category.findMany({ where: { deletedAt: null }, ...page(req) })));
router.get('/collections', action(req => prisma.collection.findMany({ where: { deletedAt: null }, ...page(req) })));
router.get('/orders/:id', action(req => OrderService.getOrderById(req.params.id)));
router.patch('/orders/:id/shipment', action(async req => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order?.stockCommitted) throw ApiError.conflict('Order must be paid before shipment');
  return prisma.shipment.upsert({ where: { orderId: order.id }, create: { orderId: order.id, ...req.body }, update: req.body });
}, z.object({ carrier: z.string().trim().min(1).max(100), trackingNumber: z.string().trim().min(1).max(100) })));
router.get('/payments', action(req => prisma.payment.findMany({ ...page(req), include: { order: { select: { orderNumber: true, customer: { select: { email: true, firstName: true, lastName: true } } } } } })));
router.patch('/customers/:id', action(req => prisma.customer.update({ where: { id: req.params.id }, data: req.body, select: { id: true, isActive: true } }), z.object({ isActive: z.boolean() })));
router.get('/reviews', action(req => prisma.review.findMany({ ...page(req), include: { product: { select: { name: true } }, customer: { select: { firstName: true, lastName: true } } } })));
router.patch('/reviews/:id', action(req => prisma.review.update({ where: { id: req.params.id }, data: req.body }), z.object({ isApproved: z.boolean() })));
router.delete('/reviews/:id', action(req => prisma.review.delete({ where: { id: req.params.id } })));
router.get('/returns', action(req => prisma.return.findMany({ ...page(req), include: { refund: true, items: true, order: true, customer: { select: { firstName: true, lastName: true, email: true } } } })));
router.patch('/returns/:id/status', action(req => AdminOperationsService.returnStatus(req.params.id, req.body.status, req.admin!.id), z.object({ status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RECEIVED', 'COMPLETED']) })));
router.get('/delivery-zones', action(req => prisma.deliveryZone.findMany({ ...page(req) })));
const deliverySchema = z.object({ name: z.string().trim().min(1).max(120), states: z.array(z.string().min(1).max(100)).min(1), fee: z.number().nonnegative().multipleOf(0.01), estimatedDays: z.string().min(1).max(100), isActive: z.boolean().default(true) });
router.post('/delivery-zones', action(req => prisma.deliveryZone.create({ data: req.body }), deliverySchema));
router.patch('/delivery-zones/:id', action(req => prisma.deliveryZone.update({ where: { id: req.params.id }, data: req.body }), deliverySchema.partial()));
router.delete('/delivery-zones/:id', action(req => prisma.deliveryZone.update({ where: { id: req.params.id }, data: { isActive: false } })));
router.get('/notifications', action(async req => ({ items: await prisma.notification.findMany({ where: { customerId: null }, ...page(req) }), unreadCount: await prisma.notification.count({ where: { customerId: null, isRead: false } }) })));
router.patch('/notifications/read-all', action(() => prisma.notification.updateMany({ where: { customerId: null }, data: { isRead: true } })));
router.patch('/notifications/:id/read', action(req => prisma.notification.updateMany({ where: { id: req.params.id, customerId: null }, data: { isRead: true } })));
router.delete('/notifications', action(() => prisma.notification.deleteMany({ where: { customerId: null, isRead: true } })));
router.get('/messages', action(req => prisma.contactMessage.findMany({ ...page(req) })));
router.patch('/messages/:id', action(req => prisma.contactMessage.update({ where: { id: req.params.id }, data: req.body }), z.object({ isRead: z.boolean() })));
router.get('/reports', action(req => AdminOperationsService.report(new Date(String(req.query.from || new Date(Date.now() - 30 * 86400_000).toISOString())), new Date(String(req.query.to || new Date().toISOString())))));
router.get('/settings', action(async () => (await prisma.websiteContent.findUnique({ where: { slug: 'store-settings' } }))?.data || {}));
router.patch('/settings', action(() => { throw ApiError.conflict('Use the section-specific Settings API to preserve configuration.'); }));
router.patch('/profile', action(req => prisma.admin.update({ where: { id: req.admin!.id }, data: req.body, select: { id: true, name: true, email: true } }), z.object({ name: z.string().trim().min(1).max(120) })));
const couponSchema = z.object({ code: z.string().trim().min(2).max(40).transform(s => s.toUpperCase()), discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']), value: z.number().positive().multipleOf(0.01), minSpend: z.number().nonnegative().optional().nullable(), maxDiscount: z.number().nonnegative().optional().nullable(), usageLimit: z.number().int().positive().optional().nullable(), perCustomerLimit: z.number().int().positive().optional().nullable(), isActive: z.boolean().optional(), startsAt: z.coerce.date().optional().nullable(), expiresAt: z.coerce.date().optional().nullable() });
router.patch('/coupons/:id', action(req => prisma.coupon.update({ where: { id: req.params.id }, data: req.body }), couponSchema.partial()));
router.delete('/coupons/:id', action(req => prisma.coupon.update({ where: { id: req.params.id }, data: { isActive: false } })));
export default router;
