# NOBELLE commerce integration

This workspace contains the Express/TypeScript API, MySQL schema and migration, and a staged copy of the customer/admin frontend in `frontend-integration/`. No business data is seeded. The existing MySQL `.env` connection settings are preserved.

## Configure and run

1. Install Node.js 22 or later and MySQL 8.0.16 or later. Run `npm ci`.
2. Configure `.env` using `.env.example`. Generate two different random JWT secrets of at least 32 characters. Never commit `.env`.
3. Set `DATABASE_URL` to your MySQL connection. Run `npm run prisma:generate` and `npm run prisma:deploy`. Use `npm run prisma:migrate -- --name change_name` for subsequent development changes.
4. Supply `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (12–72 characters), and `BOOTSTRAP_ADMIN_NAME`. Run `npm run seed:admin` once. Remove those variables afterward. There are no default credentials.
5. Configure Paystack, Cloudinary, and SMTP. Run `npm run dev`, or `npm run build` followed by `npm start`.
6. The frontend uses `VITE_API_URL=/api/v1`. In development, its Vite proxy targets `API_PROXY_TARGET` (default `http://127.0.0.1:5000`). In production, reverse-proxy `/api` to Express and serve the frontend under the same site.

This initial migration creates a new MySQL schema. For an existing database with real records, back it up and review a baseline or data migration before deploying. Tables use utf8mb4_unicode_ci for case-insensitive searches. MySQL 8.0.16 or later is required to enforce CHECK constraints.

## Payments, stock and money

Prices and totals are exact NGN `Decimal(12,2)` values. Calculations use Prisma Decimal, and gateway requests use integer kobo. Frontend prices and totals are never authoritative.

Checkout requires a client-generated UUID idempotency key, an owned or submitted Nigerian address, and a configured delivery zone. It reserves individual variants for 30 minutes and snapshots product identity, image, size, colour and price. Unpaid orders retain stock quantity; successful settlement deducts stock and releases the reservation in one serializable transaction. The worker releases expired reservations every 30 seconds.

Set Paystack's webhook URL to `https://YOUR_API_HOST/api/v1/webhooks/paystack`. Signatures use `PAYSTACK_SECRET_KEY` and the exact received request bytes. Verification and webhooks share settlement checks for reference, email, amount, currency and status. Database uniqueness and serializable retries prevent duplicate stock deductions and critical notifications. A payment arriving after checkout cancellation creates a reconciliation notification; it does not fulfill unavailable inventory. Administrators must verify and refund these payments in Paystack.

Payment references are persisted before gateway initialization. Pending initialization can be retried with the same reference. A server-verified failed payment allows a fresh attempt, with only one pending attempt per order enforced in MySQL. If Paystack accepted initialization but the local authorization URL could not be saved, reconcile that reference rather than create a second payment.

## Sessions and security

Access tokens live in frontend memory. Refresh tokens are random opaque tokens, hashed in MySQL, rotated atomically, and delivered through HttpOnly cookies. Production cookies are Secure and SameSite=Lax. The admin Remember me option controls persistent cookie expiry; otherwise the refresh cookie lasts for the browser session. Admin and customer cookies have separate paths. Browser write requests are restricted to configured frontend origins. Deploy frontend and API under the same site for these cookie semantics. Login, recovery, contact and newsletter operations have per-process rate limits; configure a shared gateway rate limit for multiple replicas. Set `TRUST_PROXY=1` only behind one trusted reverse proxy.

Product image uploads validate extension, MIME type, file signature and size (5 MB, at most 10 files). Cloudinary secrets stay on the API. Images can be ordered, made primary by placing first, and deleted from storage. Pending email jobs are durable and retry independently of payment settlement. SMTP offers at-least-once delivery: a worker crash after sending and before recording success can repeat an email. Critical database notifications remain exactly once.

## Tests and API documentation

`npm test` compiles and runs unit/HTTP checks and the MySQL integration suite. Configure `TEST_DATABASE_URL` to a dedicated database whose name ends in `_test`, deploy the migration there, then run `npm run test:integration`. Test fixtures are created only in that dedicated database; tests remove their own records and never truncate tables.

The integration suite exercises authentication, product updates, guest cart merging, coupons, stock validation, concurrent duplicate checkout, amount mismatch rejection, concurrent payment settlement, status transitions, return eligibility and exactly-once restocking. It does not claim to test Paystack or Cloudinary network behavior. Test those using provider test credentials and signed webhook delivery in staging.

Development documentation is available at `/api/docs` and `/api/docs/openapi.json`; documentation is disabled in production. `GET /api/v1/health` is a liveness check. Startup verifies database connectivity. Structured request logs exclude query strings, cookies, tokens and bodies.

## Deployment operations

Run migrations as a deployment step before starting replicas. Terminate TLS at the trusted reverse proxy, configure exact CORS origins, keep provider keys in a secret manager, and use a least-privilege database role. Configure MySQL backups, point-in-time recovery and periodic restore drills. Alert on failed email jobs, reconciliation notifications, repeated 5xx errors and low stock. Connect logs to your monitoring provider. Use a shared rate limiter at the gateway. Health checks should distinguish process liveness from database/provider readiness.

## Verification status and remaining release requirements

The frontend changes have been applied to the parent project. Original files are backed up in `frontend-backup-20261005-160411/`; the staged source remains in `frontend-integration/` for review. The active customer routes and new admin workspace use API data; legacy admin page entry files delegate to the API-backed workspace and editor.

A production release still requires configured MySQL and provider credentials, executed database tests, real customer/admin browser walkthroughs, mobile checks, and live provider staging checks. Provider-driven refunds, guest cart merging, sales/category/customer-growth reports, homepage/banner/section editing, and multi-collection assignment have been added, but have not been verified against configured MySQL and provider services. Refund timeouts deliberately require reconciliation before any resubmission. Do not call this deployment production-ready until those release requirements are completed and verified.

Browser smoke checks exercised 20 desktop/mobile public and unauthorized route visits with no runtime exceptions or horizontal overflow. These checks used the existing unconfigured database environment and do not verify successful shopping or admin CRUD.

Refunds cover the received merchandise value after proportional coupon discounts, rounded down to kobo; delivery charges are retained. Net revenue subtracts confirmed refunds from successful receipts, avoiding double subtraction when an order becomes Refunded.

The final production dependency audit reported zero advisories after updating Nodemailer and Multer and overriding the vulnerable deepmerge-ts dependency. Audit output is recorded in `dependency-audit-after.json`.

MySQL conversion verification: Prisma validation, client generation, TypeScript build and 8 unit/HTTP tests pass. The database integration test is skipped until TEST_DATABASE_URL is set. The current DATABASE_URL was unreachable; the MySQL migration has not been applied. Cart ownership uses triggers because MySQL disallows CHECK constraints on columns with cascading foreign keys (https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html).
