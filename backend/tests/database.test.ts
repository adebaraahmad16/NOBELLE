import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();
const url = process.env.TEST_DATABASE_URL;
if (url && (new URL(url).protocol !== 'mysql:' || !new URL(url).pathname.endsWith('_test'))) throw new Error('Integration tests require a dedicated database ending in _test');
if (url) process.env.DATABASE_URL = url;

test('MySQL commerce flow: authentication, products, checkout races, payment idempotency and returns', { skip: !url ? 'TEST_DATABASE_URL is not configured' : false }, async () => {
  const { default: prisma } = await import('../src/repositories/prisma');
  const { AuthService } = await import('../src/services/auth.service');
  const { ProductService } = await import('../src/services/product.service');
  const { CartService } = await import('../src/services/cart.service');
  const { CheckoutService } = await import('../src/services/checkout.service');
  const { PaymentService } = await import('../src/services/payment.service');
  const { OrderService } = await import('../src/services/order.service');
  const { CustomerService } = await import('../src/services/customer.service');
  const { AdminOperationsService } = await import('../src/services/adminOperations.service');
  const key = randomUUID();
  const category = await prisma.category.create({ data: { name: key, slug: key } });
  const zone = await prisma.deliveryZone.create({ data: { name: key, states: ['Lagos'], fee: '10.00', estimatedDays: '2 days' } });
  const customer = await AuthService.register({ email: `${key}@example.test`, password: 'integration-only-password', firstName: 'Integration', lastName: 'Fixture' });
  const { PasswordUtil } = await import('../src/utils/password');
  const { AdminAuthService } = await import('../src/services/adminAuth.service');
  const admin = await prisma.admin.create({ data: { email: `${key}-admin@example.test`, name: 'Fixture', passwordHash: await PasswordUtil.hash('integration-only-admin-password') } });
  const product = await ProductService.createProduct({ name: 'Test fixture only', sku: key, description: 'Isolated test database fixture', categoryId: category.id,
    price: '100.01', isActive: true, variants: [{ sku: `${key}-S`, size: 'S', color: 'Red', quantity: 1 }] });
  const variant = product.variants[0];
  const coupon = await prisma.coupon.create({ data: { code: key.toUpperCase(), discountType: 'PERCENTAGE', value: 10, perCustomerLimit: 1, usageLimit: 1 } });
  const orderNumbers: string[] = [];
  try {
    assert.equal((await AdminAuthService.login(admin.email, 'integration-only-admin-password')).admin.id, admin.id);
    assert.equal((await AuthService.login(customer.customer.email, 'integration-only-password')).customer.id, customer.customer.id);
    await assert.rejects(() => AuthService.login(customer.customer.email, 'wrong-password'));
    await ProductService.updateProduct(product.id, { price: '100.02' });
    const guestToken = randomUUID();
    const { TokenUtil } = await import('../src/utils/token');
    await CartService.addItem(`guest:${TokenUtil.hashToken(guestToken)}`, variant.id, 1);
    await CartService.mergeGuest(customer.customer.id, guestToken);
    await assert.rejects(() => CartService.addItem(customer.customer.id, variant.id, 1));
    const payload = { idempotencyKey: randomUUID(), deliveryZoneId: zone.id, couponCode: coupon.code,
      shippingAddress: { recipient: 'Test', phoneNumber: '08000000000', street: 'Test', city: 'Test', state: 'Lagos', country: 'Nigeria' } };
    const orders = await Promise.all([CheckoutService.create(customer.customer.id, payload), CheckoutService.create(customer.customer.id, payload)]);
    orderNumbers.push(orders[0].orderNumber);
    assert.equal(orders[0].id, orders[1].id);
    assert.equal(orders[0].totalAmount.toFixed(2), '100.02');
    assert.equal((await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity, 1);
    const payment = await prisma.payment.create({ data: { orderId: orders[0].id, reference: key, amount: orders[0].totalAmount } });
    const verified = { reference: key, status: 'success', amount: 10002, currency: 'NGN', customer: { email: customer.customer.email } };
    await assert.rejects(() => PaymentService.confirm(key, { ...verified, amount: 1 }));
    await Promise.all([PaymentService.confirm(key, verified), PaymentService.confirm(key, verified)]);
    assert.equal((await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity, 0);
    assert.equal(await prisma.inventoryTransaction.count({ where: { inventoryId: variant.inventory!.id, type: 'SALE' } }), 1);
    assert.equal(await prisma.emailJob.count({ where: { key: `payment:${key}` } }), 1);
    assert.equal((await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).usageCount, 1);
    assert.equal(await prisma.paymentTransaction.count({ where: { paymentId: payment.id } }), 1);
    await assert.rejects(() => OrderService.updateOrderStatus(orders[0].id, 'DELIVERED', admin.id));
    for (const status of ['PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED']) await OrderService.updateOrderStatus(orders[0].id, status, admin.id);
    const request = await CustomerService.requestReturn(customer.customer.id, { orderId: orders[0].id, reason: 'Test return', items: [{ orderItemId: orders[0].items[0].id, quantity: 1 }] });
    await AdminOperationsService.returnStatus(request.id, 'APPROVED', admin.id);
    await Promise.all([AdminOperationsService.returnStatus(request.id, 'RECEIVED', admin.id), AdminOperationsService.returnStatus(request.id, 'RECEIVED', admin.id)]);
    assert.equal((await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity, 1);
    await assert.rejects(() => CustomerService.requestReturn(customer.customer.id, { orderId: orders[0].id, reason: 'Duplicate', items: [{ orderItemId: orders[0].items[0].id, quantity: 1 }] }));
  } finally {
    // Delete only this test's owned records; never truncate database tables.
    await prisma.notification.deleteMany({ where: { customerId: null, OR: [{ message: { in: orderNumbers } }, { message: { contains: key } }] } });
    await prisma.activityLog.deleteMany({ where: { adminId: admin.id } });
    await prisma.return.deleteMany({ where: { customerId: customer.customer.id } });
    await prisma.couponUsage.deleteMany({ where: { customerId: customer.customer.id } });
    await prisma.coupon.delete({ where: { id: coupon.id } });
    await prisma.order.deleteMany({ where: { customerId: customer.customer.id } });
    await prisma.customer.delete({ where: { id: customer.customer.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.category.delete({ where: { id: category.id } });
    await prisma.deliveryZone.delete({ where: { id: zone.id } });
    await prisma.admin.delete({ where: { id: admin.id } });
    await prisma.emailJob.deleteMany({ where: { OR: [{ recipient: customer.customer.email }, { key: `payment:${key}` }] } });
    await prisma.$disconnect();
  }
});
