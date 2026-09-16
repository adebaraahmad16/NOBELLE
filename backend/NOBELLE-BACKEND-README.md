# NOBELLE — Backend API

Production-ready REST API for **NOBELLE**, a Nigerian women's ready-to-wear fashion e-commerce platform.

This backend powers both the **customer frontend** and the **admin dashboard**. All business data — products, orders, payments, inventory, customers, analytics, and website content — is stored in and served from MySQL. There is no demo or hardcoded data anywhere in the system.

```
 Customer Frontend  ──┐
                      ├──►  REST API  ──►  MySQL
 Admin Dashboard   ──┘         │
                               ├──► Paystack (payments)
                               ├──► Object Storage (images)
                               └──► Email Provider (transactional)
```

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Running the Server](#running-the-server)
- [API Overview](#api-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Payments](#payments)
- [File Uploads](#file-uploads)
- [Response Format](#response-format)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Deployment](#deployment)
- [Data Integrity Rules](#data-integrity-rules)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MySQL (InnoDB) |
| ORM | Prisma |
| Auth | JWT access tokens + rotating refresh tokens |
| Password hashing | Argon2 (bcrypt supported) |
| Validation | Zod |
| Payments | Paystack (provider-agnostic interface) |
| File storage | Cloud object storage (S3-compatible) |
| Email | Transactional email provider (SMTP) |
| Real-time | Socket.IO |
| Docs | Swagger / OpenAPI |

---

## Project Structure

```
nobelle-backend/
│
├── src/
│   ├── config/          Environment loading, constants, app configuration
│   ├── controllers/     HTTP request/response handling only
│   ├── middleware/      Auth, RBAC, rate limiting, error handling, uploads
│   ├── routes/          Route definitions and API versioning
│   ├── services/        Business logic (checkout, payments, inventory, etc.)
│   ├── repositories/    Database access via Prisma
│   ├── models/          Domain types and entity helpers
│   ├── validators/      Zod schemas for body, query, params, files
│   ├── utils/           Shared helpers (tokens, slugs, pricing, responses)
│   ├── jobs/            Scheduled and background tasks
│   ├── integrations/    Paystack, storage, email adapters
│   ├── types/           Shared TypeScript definitions
│   ├── app.ts           Express app assembly
│   └── server.ts        Server bootstrap
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

Controllers handle HTTP. Services hold business rules. Repositories talk to the database. Validators guard the boundary. Keep these responsibilities separate.

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- MySQL 8.0 or later
- A Paystack account (test keys are fine for development)
- An S3-compatible storage bucket
- SMTP credentials for a transactional email provider

### Installation

```bash
git clone <repository-url>
cd nobelle-backend
npm install
cp .env.example .env
```

Fill in `.env` with your own values before continuing.

---

## Environment Variables

Copy `.env.example` to `.env` and populate every field.

```env
DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=

STORAGE_PROVIDER=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

FRONTEND_URL=
ADMIN_URL=

NODE_ENV=
PORT=
```

`DATABASE_URL` uses the MySQL connection format:

```
mysql://USER:PASSWORD@HOST:3306/nobelle
```

Append `?sslaccept=strict` when connecting to a managed MySQL instance that requires TLS.

**Rules:**

- `.env` is gitignored and must never be committed.
- Secret keys are server-side only. Only `PAYSTACK_PUBLIC_KEY` may reach the browser.
- Use different secrets per environment. Never reuse development secrets in production.

---

## Database

### MySQL configuration

Prisma connects with the `mysql` provider:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Requirements:

- **MySQL 8.0+** — needed for `SELECT ... FOR UPDATE` with `SKIP LOCKED`, window functions used in analytics aggregation, and CTEs.
- **InnoDB storage engine** on every table, for foreign keys and row-level locking.
- **`utf8mb4` / `utf8mb4_unicode_ci`** charset and collation, so product names and customer messages handle the full Unicode range including emoji.
- **Money columns** use `DECIMAL(12, 2)`, never `FLOAT` or `DOUBLE`. In Prisma this is `Decimal @db.Decimal(12, 2)`, mapped to a decimal library in application code — never to a JavaScript `number`.
- **Timestamps** are stored in UTC as `DATETIME(3)` and converted at the presentation layer.

Full-text search on product name and description uses a MySQL `FULLTEXT` index queried via `MATCH ... AGAINST`. Prisma exposes this through `$queryRaw` with parameter binding — never string interpolation.

### Core entities

`Admin` · `Customer` · `Product` · `ProductVariant` · `Category` · `Collection` · `ProductImage` · `Inventory` · `InventoryTransaction` · `Cart` · `CartItem` · `Wishlist` · `WishlistItem` · `Order` · `OrderItem` · `Payment` · `Coupon` · `CouponUsage` · `Review` · `Delivery` · `DeliveryZone` · `Return` · `ReturnItem` · `Notification` · `WebsiteContent` · `Banner` · `ContactMessage` · `Address` · `RefreshToken` · `ActivityLog`

All tables carry `createdAt` and `updatedAt`. Entities that support soft deletion also carry `deletedAt`. Frequently filtered and searched columns are indexed.

### Migrations

```bash
# Create and apply a migration in development
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Regenerate the Prisma client
npx prisma generate

# Inspect data
npx prisma studio
```

### Seeding

There is **no business-data seed**. The database starts empty and stays empty until real records are created through the API.

An optional development-only seed exists for creating a first admin account. It is disabled by default and must never run against production:

```bash
npm run seed:admin   # development only
```

---

## Running the Server

```bash
npm run dev      # development with hot reload
npm run build    # compile TypeScript
npm start        # run the compiled build
npm run lint     # lint
npm test         # run the test suite
```

Health check:

```
GET /api/health  →  { "status": "ok" }
```

---

## API Overview

All routes are versioned under `/api/v1`.

### Public / Customer

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `login` · `logout` · `refresh` · `forgot-password` · `reset-password` · `verify-email` · `GET /auth/me` |
| Products | `GET /products` · `/products/:slug` · `/products/featured` · `/products/new-arrivals` · `/products/best-sellers` |
| Categories | `GET /categories` · `/categories/:slug` |
| Collections | `GET /collections` · `/collections/:slug` |
| Cart | `GET /cart` · `POST /cart/items` · `PATCH /cart/items/:id` · `DELETE /cart/items/:id` · `DELETE /cart` |
| Coupons | `POST /cart/apply-coupon` · `DELETE /cart/remove-coupon` |
| Wishlist | `GET /wishlist` · `POST /wishlist/:productId` · `DELETE /wishlist/:productId` |
| Addresses | `GET/POST /account/addresses` · `PATCH/DELETE /account/addresses/:id` |
| Orders | `POST /orders` · `GET /orders` · `GET /orders/:id` |
| Returns | `POST /orders/:orderId/return` · `GET /account/returns` |
| Payments | `POST /payments/initialize` · `GET /payments/verify/:reference` · `POST /payments/webhook` |
| Reviews | `POST /products/:productId/reviews` · `GET /products/:productId/reviews` |
| Notifications | `GET /notifications` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all` |
| Content | `GET /content/homepage` · `/content/about` · `/content/contact` · `GET /banners` |

### Admin

| Area | Endpoints |
|---|---|
| Auth | `POST /admin/auth/login` · `logout` · `refresh` · `forgot-password` · `reset-password` · `change-password` · `GET /admin/auth/me` |
| Products | `GET/POST /admin/products` · `GET/PATCH/DELETE /admin/products/:id` |
| Categories | `GET/POST /admin/categories` · `PATCH/DELETE /admin/categories/:id` |
| Collections | `GET/POST /admin/collections` · `PATCH/DELETE /admin/collections/:id` |
| Inventory | `GET /admin/inventory` · `/low-stock` · `/out-of-stock` · `PATCH /admin/inventory/:variantId` |
| Orders | `GET /admin/orders` · `GET /admin/orders/:id` · `PATCH /admin/orders/:id/status` |
| Customers | `GET /admin/customers` |
| Payments | `GET /admin/payments` |
| Coupons | `GET/POST /admin/coupons` · `PATCH/DELETE /admin/coupons/:id` |
| Reviews | `GET /admin/reviews` · `PATCH/DELETE /admin/reviews/:id` |
| Returns | `GET /admin/returns` · `PATCH /admin/returns/:id` |
| Banners | `GET/POST /admin/banners` · `PATCH/DELETE /admin/banners/:id` |
| Content | `PATCH /admin/content/homepage` · `/about` · `/contact` |
| Dashboard | `GET /admin/dashboard` · `/sales` · `/orders` · `/products` · `/customers` |
| Activity | `GET /admin/activity-logs` |

### Pagination

Every list endpoint accepts `?page=` and `?limit=` and returns:

```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

### Filtering and search

Product listing supports `search`, `category`, `collection`, `minPrice`, `maxPrice`, `size`, `color`, and `sort`. Admin orders and customers support `search` against order number, customer name, email, and phone. Filtering happens in the database, not the browser.

---

## Authentication & Authorization

Two separate authentication systems exist: one for customers, one for admins.

- Access tokens are short-lived JWTs sent in the `Authorization: Bearer <token>` header.
- Refresh tokens are stored server-side, rotated on every use, and revoked on logout.
- Passwords are hashed with Argon2. Hashes are never returned by any endpoint.

**Roles:** `ADMIN`, `CUSTOMER`

Customers can only reach their own account, orders, addresses, cart, wishlist, reviews, and notifications. They cannot create or edit products, adjust prices or inventory, change order statuses, moderate reviews, manage coupons or content, view other customers, or read financial analytics. All `/admin/*` routes sit behind admin auth middleware.

---

## Payments

Paystack is integrated behind a provider interface so a second gateway can be added without rewriting checkout.

```
Checkout → pending order created
         → Paystack transaction initialized
         → customer pays
         → webhook received and signature verified
         → payment verified server-side
         → order confirmed, inventory decremented, customer notified
```

Payment verification always happens server-side against Paystack. A frontend callback is treated as a hint to re-check, never as proof of payment. Webhook handling is idempotent: a replayed event cannot duplicate an order, a payment record, or an inventory reduction.

---

## File Uploads

Product, category, collection, banner, and profile images are uploaded to cloud object storage. MySQL stores only the storage key or URL.

Uploads are validated for MIME type, extension, and file size. Only supported image formats are accepted; executables and unrecognised types are rejected.

---

## Response Format

Success:

```json
{ "success": true, "data": {}, "message": "Success" }
```

Error:

```json
{ "success": false, "message": "Validation failed", "errors": [] }
```

Handled status codes: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`. Stack traces and raw database errors are never returned in production.

---

## Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

Coverage focuses on the paths where correctness matters most:

- **Auth** — registration, login, logout, password reset, rejection of unauthorized access
- **Products** — create, update, archive, retrieve
- **Cart** — add, update, remove, stock validation
- **Checkout** — total calculation, coupon validation, stock validation
- **Payments** — verification, webhook handling, duplicate-webhook protection
- **Orders** — creation, status transitions, cancellation, refund
- **Authorization** — customers blocked from every admin endpoint

---

## API Documentation

Swagger UI is served at:

```
/api/docs
```

It documents auth, products, categories, collections, inventory, cart, wishlist, orders, payments, coupons, reviews, customers, delivery, returns, admin, analytics, and website content.

---

## Security

Implemented across the stack:

- Argon2 password hashing
- JWT auth with refresh-token rotation and session revocation
- Role-based authorization on every protected route
- Zod validation of body, query, params, and uploads
- Rate limiting, including stricter limits on auth endpoints
- CORS restricted to `FRONTEND_URL` and `ADMIN_URL`
- Helmet security headers
- Secure, httpOnly cookies where cookies are used
- Input sanitization
- Parameterized queries via Prisma
- File type and size validation
- Centralized error handling that never leaks internals

---

## Deployment

1. Provision MySQL and configure `DATABASE_URL`.
2. Set `NODE_ENV=production` and supply production secrets.
3. Run `npx prisma migrate deploy`.
4. Build with `npm run build` and start with `npm start`.
5. Restrict CORS to the real frontend and admin origins.
6. Terminate TLS at the proxy or load balancer.
7. Configure automated backups (`mysqldump --single-transaction` or your provider's snapshots) and test a restore.
8. Point `/api/health` at your uptime monitor.
9. Connect your error monitoring service.
10. Register the Paystack webhook URL in the Paystack dashboard.

API versioning (`/api/v1`) allows future breaking changes to ship alongside the current version rather than replacing it.

---

## Data Integrity Rules

These are non-negotiable behaviours of the system:

**No fake data.** No seeded products, customers, orders, payments, reviews, or statistics. An empty database returns zeros and empty arrays — the dashboard shows "No data available yet", tables show "No records found".

**Prices are server-side.** Price, discount, subtotal, delivery fee, and total are always recalculated from current database values. Amounts sent by the client are ignored.

**Order items are snapshots.** Product name, SKU, variant, size, colour, quantity, unit price, and line total are copied onto the order at purchase time, so later product edits never rewrite order history.

**Inventory is transactional.** Checkout, refund, and cancellation run inside InnoDB transactions that lock the affected variant rows with `SELECT ... FOR UPDATE` before reading stock. Stock can never go negative, and two simultaneous buyers of the last unit resolve to exactly one sale.

**Inventory is auditable.** Every change writes an `InventoryTransaction` recording type (`SALE`, `RESTOCK`, `ADJUSTMENT`, `RETURN`, `CANCELLATION`), quantity delta, previous and new quantity, reason, responsible user, and timestamp.

**Admin actions are logged.** Product, inventory, order, coupon, banner, and settings changes are written to `ActivityLog` with admin, action, entity, entity ID, timestamp, and metadata.

**Content is database-driven.** Hero sections, banners, about and contact content are managed by admins through the API, not hardcoded in the frontend.

---

## License

Proprietary. All rights reserved.
