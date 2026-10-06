import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { once } from 'node:events';
import { money, kobo, couponDiscount } from '../src/utils/money';
import { PaystackService } from '../src/integrations/paystack';
import { ENV } from '../src/config/env';
import { registerSchema } from '../src/validators/auth.validator';
import { createOrderSchema } from '../src/validators/order.validator';
import app from '../src/app';
import { validatePayment } from '../src/utils/paymentValidation';
import { TokenUtil } from '../src/utils/token';
import { PasswordUtil } from '../src/utils/password';

test('decimal totals preserve exact kobo and reject sub-kobo amounts', () => {
  assert.equal(kobo(money('0.1').add('0.2')), 30);
  assert.equal(kobo('1234567.89'), 123456789);
  assert.throws(() => kobo('1.001'));
  assert.throws(() => kobo('-1'));
});
test('coupon calculations respect cap, subtotal and rounding', () => {
  assert.equal(couponDiscount(money('100.01'), { discountType: 'PERCENTAGE', value: money(15), maxDiscount: null }).toFixed(2), '15.00');
  assert.equal(couponDiscount(money(100), { discountType: 'PERCENTAGE', value: money(50), maxDiscount: money(20) }).toFixed(2), '20.00');
  assert.equal(couponDiscount(money(100), { discountType: 'FIXED_AMOUNT', value: money(500), maxDiscount: null }).toFixed(2), '100.00');
});
test('webhook authentication signs exact received bytes', () => {
  const previous = ENV.PAYSTACK_SECRET_KEY;
  ENV.PAYSTACK_SECRET_KEY = 'isolated-unit-test-key';
  try {
    const raw = Buffer.from('{ "event": "charge.success" }');
    const signature = createHmac('sha512', ENV.PAYSTACK_SECRET_KEY).update(raw).digest('hex');
    assert.equal(PaystackService.verifyWebhookSignature(signature, raw), true);
    assert.equal(PaystackService.verifyWebhookSignature(signature, Buffer.from('{"event":"charge.success"}')), false);
    assert.equal(PaystackService.verifyWebhookSignature('', raw), false);
    assert.equal(PaystackService.verifyWebhookSignature('x'.repeat(128), raw), false);
  } finally { ENV.PAYSTACK_SECRET_KEY = previous; }
});
test('registration requires matching strong passwords', () => {
  const body = { email: 'person@example.com', firstName: 'Test', lastName: 'Person', password: 'secure-test-password', confirmPassword: 'different-test-password' };
  assert.equal(registerSchema.safeParse({ body }).success, false);
  body.confirmPassword = body.password;
  assert.equal(registerSchema.safeParse({ body }).success, true);
});
test('password hashing rejects input beyond bcrypt byte capacity', async () => {
  await assert.rejects(() => PasswordUtil.hash('é'.repeat(40)));
  assert.equal(await PasswordUtil.compare('é'.repeat(40), 'unused-hash'), false);
});
test('checkout requires delivery selection and a stable idempotency key', () => {
  assert.equal(createOrderSchema.safeParse({ body: { totalAmount: 1 } }).success, false);
});
test('settlement rejects mismatched reference, amount, currency, owner and status', () => {
  const expected = { reference: 'test-reference', currency: 'NGN', amount: money('100.02'), email: 'buyer@example.test' };
  const valid = { reference: expected.reference, currency: 'NGN', amount: 10002, status: 'success', customer: { email: expected.email } };
  assert.doesNotThrow(() => validatePayment(valid, expected));
  for (const change of [{ reference: 'other-order' }, { amount: 1 }, { amount: '10002' }, { currency: 'USD' }, { status: 'pending' }, { customer: { email: 'someone-else@example.test' } }]) {
    assert.throws(() => validatePayment({ ...valid, ...change }, expected));
  }
});
test('HTTP security: admin authorization, health, origin checks, invalid JSON and rate limits', async () => {
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address() as import('node:net').AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(`${base}/api/v1/health`)).status, 200);
    assert.equal((await fetch(`${base}/api/v1/admin/orders`)).status, 401);
    const previousSecret = ENV.JWT_ACCESS_SECRET;
    ENV.JWT_ACCESS_SECRET = 'isolated-unit-test-signing-key-with-sufficient-length';
    const customerToken = TokenUtil.generateAccessToken({ id: 'test-customer', email: 'buyer@example.test', role: 'CUSTOMER' });
    assert.equal((await fetch(`${base}/api/v1/admin/orders`, { headers: { Authorization: `Bearer ${customerToken}` } })).status, 403);
    ENV.JWT_ACCESS_SECRET = previousSecret;
    for (let i = 0; i < 25; i++) assert.equal((await fetch(`${base}/api/v1/auth/me`)).status, 401);
    const origin = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers: { Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(origin.status, 403);
    const invalid = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(invalid.status, 400);
    for (let i = 0; i < 20; i++) await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const limited = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(limited.status, 429);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
import { AdminSummaryService } from '../src/services/adminSummary.service';
import prisma from '../src/repositories/prisma';
test('order overview keeps payment-pending and packed orders in their fulfilment groups', async () => {
 const database = { order: { groupBy: async () => [
  { status: 'PENDING', _count: 2 }, { status: 'PAYMENT_PENDING', _count: 3 },
  { status: 'PAID', _count: 4 }, { status: 'PROCESSING', _count: 5 }, { status: 'PACKED', _count: 6 },
  { status: 'SHIPPED', _count: 7 }, { status: 'OUT_FOR_DELIVERY', _count: 8 },
  { status: 'DELIVERED', _count: 9 }, { status: 'CANCELLED', _count: 1 }, { status: 'RETURNED', _count: 2 },
 ] } } as unknown as typeof prisma;
 const summary = await AdminSummaryService.get('orders', database);
 const value = (label: string) => summary.find(metric => metric.label === label)?.value;
 assert.equal(value('All Orders'), 47); assert.equal(value('Pending'), 5);
 assert.equal(value('Processing'), 15); assert.equal(value('Shipped'), 15);
});
test('payment overview deducts completed refunds and retains exact kobo', async () => {
 const database = { payment: { groupBy: async () => [{ status: 'SUCCESS', _count: 2, _sum: { amount: money('100.03') } }, { status: 'FAILED', _count: 1, _sum: { amount: money('20') } }] },
 paymentRefund: { aggregate: async () => ({ _sum: { amount: money('0.02') } }) } } as unknown as typeof prisma;
 const summary = await AdminSummaryService.get('payments', database);
 assert.equal(summary.find(metric => metric.label === 'Total Revenue')?.value, '100.01');
 assert.equal(summary.find(metric => metric.label === 'Successful Payments')?.value, 2);
 assert.equal(summary.find(metric => metric.label === 'Pending')?.value, 0);
});
