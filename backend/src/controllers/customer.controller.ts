import { SettingsService } from '../services/settings.service';
import { Request, RequestHandler } from 'express';
import { z } from 'zod';
import { CustomerService } from '../services/customer.service';
import prisma from '../repositories/prisma';
import { ApiError } from '../utils/apiError';
import { parsePagination } from '../utils/pagination';

// Shared thin controller adapter; validation runs before any service or database operation.
export function action(work: (req: Request) => Promise<unknown>, schema?: z.ZodTypeAny): RequestHandler {
  return async (req, res, next) => {
    try {
      if (schema) {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) throw ApiError.unprocessable('Validation failed', parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })));
        req.body = parsed.data;
      }
      const result = await work(req);
      if (req.admin && !['GET','HEAD'].includes(req.method)) await prisma.activityLog.create({ data: {
        adminId: req.admin.id, action: `${req.method}_${req.route?.path || req.path}`, entity: 'Administration', entityId: req.params.id || (result as any)?.id,
      } }).catch(() => console.error(JSON.stringify({ event: 'activity_log_failed', adminId: req.admin!.id })));
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };
}
export const addressSchema = z.object({ recipient: z.string().trim().min(1).max(120), phoneNumber: z.string().min(7).max(30),
  street: z.string().trim().min(3).max(500), city: z.string().trim().min(1).max(120), state: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100).default('Nigeria'), postalCode: z.string().max(20).optional(), isDefault: z.boolean().default(false) });

export const CustomerController = {
  recovery: action(req => CustomerService.recovery(req.body.email), z.object({ email: z.string().email() })),
  reset: action(req => CustomerService.reset(req.body.token, req.body.newPassword), z.object({ token: z.string().min(32), newPassword: z.string().min(12).max(72) })),
  verify: action(req => CustomerService.verifyEmail(req.body.token), z.object({ token: z.string().min(32) })),
  profile: action(req => prisma.customer.update({ where: { id: req.user!.id }, data: req.body,
    select: { id: true, firstName: true, lastName: true, email: true, phone: true } }), z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100), phone: z.string().max(30).optional() })),
  password: action(req => CustomerService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword), z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(72) })),
  addresses: action(req => prisma.address.findMany({ where: { customerId: req.user!.id }, take: 100 })),
  saveAddress: action(req => CustomerService.saveAddress(req.user!.id, req.params.id, req.body), addressSchema),
  deleteAddress: action(async req => { const result = await prisma.address.deleteMany({ where: { id: req.params.id, customerId: req.user!.id } }); if (!result.count) throw ApiError.notFound(); return { deleted: true }; }),
  wishlist: action(req => CustomerService.wishlist(req.user!.id)),
  addWishlist: action(req => CustomerService.wishlist(req.user!.id, req.params.productId)),
  removeWishlist: action(req => CustomerService.wishlist(req.user!.id, req.params.productId, true)),
  review: action(req => CustomerService.review(req.user!.id, req.params.productId, req.body), z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().min(1).max(3000) })),
  returns: action(req => prisma.return.findMany({ where: { customerId: req.user!.id }, ...page(req), include: { items: true, order: { select: { orderNumber: true } } } })),
  requestReturn: action(req => CustomerService.requestReturn(req.user!.id, req.body), z.object({ orderId: z.string().uuid(), reason: z.string().trim().min(3).max(3000), items: z.array(z.object({ orderItemId: z.string().uuid(), quantity: z.number().int().positive() })).min(1).max(100) })),
  notifications: action(async req => ({ items: await prisma.notification.findMany({ where: { customerId: req.user!.id }, ...page(req) }), unreadCount: await prisma.notification.count({ where: { customerId: req.user!.id, isRead: false } }) })),
  readNotification: action(req => prisma.notification.updateMany({ where: { customerId: req.user!.id, ...(req.params.id ? { id: req.params.id } : {}) }, data: { isRead: true } })),
  delivery: action(async () => (await SettingsService.zones()).filter(zone=>zone.isActive)),
  contact: action(async req => { const message = await prisma.contactMessage.create({ data: req.body }); await prisma.notification.create({ data: { title: 'New customer message', message: message.subject, linkUrl: '/admin/messages' } }); return { received: true }; }, z.object({ name: z.string().trim().min(1).max(120), email: z.string().email(), phone: z.string().max(30).optional(), subject: z.string().trim().min(1).max(200), message: z.string().trim().min(10).max(5000), website: z.literal('').optional().transform(() => undefined) }).transform(({ website, ...data }) => data)),
};
export function page(req: Request) {
  const { skip, limit } = parsePagination(req.query);
  return { skip, take: limit, orderBy: { createdAt: 'desc' as const } };
}
