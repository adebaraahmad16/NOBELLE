# Supabase and Vercel setup

## Current scope

This repository contains a migration of the existing NOBELLE application. The
SQL creates an empty business database with configuration defaults; it does not
seed products, customers, orders, revenue or administrator credentials. Applying
migrations, configuring hosted Auth and deploying functions are required before
the app can operate. No Supabase or Vercel project is assumed to exist.

The existing components and branding are preserved. Anonymous visitors can browse
published catalogue records; customers sign in before saving carts or checking
out. Stock is reserved at checkout and deducted after verified payment. Backorders
and alternate stock deduction modes are deliberately unavailable in settings.
This implementation processes checkout in NGN; changing to another currency is
rejected until that currency's gateway configuration and tests are implemented.
Paystack checkout requires a positive total; fully discounted zero-total orders
are rejected before stock is reserved and require assistance from the store.

## 1. Create and configure a Supabase project

For connection errors, first read [the connection report](CONNECTION_REPORT.md)
and run `npm run check:supabase`. That command checks the configured project
with zero-row table/column requests and a temporary Realtime channel. Run
`diagnostics.sql` in the SQL editor to distinguish missing tables from missing
grants, RLS policies and publication entries before changing an existing schema.
For the complete SQL-editor workflow, use [APPLY_DATABASE.md](APPLY_DATABASE.md).

Create a hosted project. In Authentication, enable email/password sign-in, email
confirmation and a minimum password length of 12. Configure production SMTP for
reliable signup and recovery emails. Supabase Auth handles recovery links and
confirmation; previous backend tokens and passwords are not compatible.

Set the Auth Site URL to your final Vercel origin, and add these redirect URLs:

```text
https://YOUR_DOMAIN/account
https://YOUR_DOMAIN/account?reset=true
https://YOUR_DOMAIN/admin/reset-password
http://localhost:5173/account
http://localhost:5173/account?reset=true
http://localhost:5173/admin/reset-password
```

The frontend uses PKCE. Complete email links in the browser that requested them.
Email changes require Supabase email confirmation. No admin role comes from
user metadata or frontend state.

Install the Supabase CLI using its official installation instructions, then:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

For a fresh project, the SQL files can alternatively be applied in filename order
through the Supabase SQL editor. Do not run them blindly against an existing
schema with colliding table names. No existing database is dropped by these files.
Mixed-case columns are quoted to preserve compatibility with the current React
components; table names use PostgreSQL snake_case.

For SQL-editor installation, `BOOTSTRAP.sql` combines the migrations into one
transaction and can also adopt a compatible partial `store_settings` table
without replacing its existing configuration. Missing sections are inserted;
existing settings JSON is never merged or overwritten. Generate it with
`npm run build:supabase`. Read its preflight checks and `CONNECTION_REPORT.md`
before running it: it stops on unknown schema or policy conflicts rather than
overwriting them. Supabase SQL access is required; a frontend public key cannot
execute this installer. Existing Auth users are backfilled as ordinary profiles,
and the first Super Admin still requires the explicit role assignment below.

The SQL-editor installer does not modify Supabase CLI migration history. If you
subsequently adopt CLI deployments, first mark the fourteen successfully installed
migration versions (`202610310001` through `202610310014`) as applied with
`supabase migration repair --status applied`, then use `supabase db push` for
later migrations. Do not rerun fresh-project migrations over an installed schema.

If the baseline schema exists and only settings are broken, use the generated
`SETTINGS_RECOVERY.sql`. It recreates a missing settings table, safely adds version
metadata, restores the application policy and inserts missing sections without
updating existing records. It finishes by notifying PostgREST to reload its cache.

For category errors on an otherwise installed baseline, use
`CATEGORY_SETTINGS_RECOVERY.sql` (migrations 013 and 014). It also restores
permission-checked category operations and product relationships, preserves
existing records, and rejects incompatible columns or unknown policies for review.

All application tables have RLS. Financial writes are transactional security
definer functions with fixed search paths and restricted execution grants.
Only the service role can settle payments/refunds or expire orders. Every caller
Edge Function verifies its user with Supabase Auth and checks ownership or staff
permission. JWT checking at the function gateway is disabled in config because
verification is explicitly performed inside those handlers; the public webhook
uses Paystack HMAC verification instead.

## 2. Bootstrap the first Super Admin

Register your real administrator through `/account`, verify the email, and obtain
that user's UUID in Supabase Authentication. Run this once in the SQL editor:

```sql
insert into public.admin_roles("userId", role)
values ('YOUR_AUTH_USER_UUID', 'SUPER_ADMIN');
```

Then sign in through `/admin/login`. Use Settings → Admin & Permissions to create
staff. Existing customer accounts can be promoted by inserting an authorized
role assignment in the SQL editor. The staff creation function will not take over
an existing email account. Keep at least one active Super Admin.

Roles map to the existing UI: `SUPER_ADMIN`, `MANAGER` (Store Manager),
`ORDER_MANAGER`, `INVENTORY_MANAGER`, `MARKETING_MANAGER`, `SUPPORT` (Customer
Support). Permission changes take effect on database requests immediately;
removing a staff role leaves the customer's account and historical records intact.

## 3. Configure the React app

Get the project URL and **publishable/anon public key** from Supabase's API settings.
Put them in local `.env` and Vercel's build environment:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY
```

Both are public identifiers protected by RLS. Never use `sb_secret_` or a legacy
service-role JWT as the second value. The client rejects recognizable privileged
keys. Restart Vite after local changes; rebuild Vercel after production changes.
Old `VITE_API_URL` and `API_PROXY_TARGET` variables are obsolete.

## 4. Deploy Edge Functions

Supabase supplies the standard `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` function environment variables. Add project-specific
secrets directly in Supabase's Edge Function secrets settings. Do not paste them
into React, commit them, or put them in Vercel's frontend environment.

| Secret | Purpose |
| --- | --- |
| `SITE_URL` | Exact final frontend origin, e.g. `https://nobelle.example` |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins, including localhost for development |
| `RATE_LIMIT_SALT` | Random private value for hashing public form rate-limit keys |
| `PAYSTACK_SECRET_KEY_TEST` | Paystack `sk_test_…` key |
| `PAYSTACK_SECRET_KEY_LIVE` | Paystack `sk_live_…` key; only required for live sales |
| `PAYSTACK_PUBLIC_KEY_TEST` | Optional display of configured test public key in Settings |
| `PAYSTACK_PUBLIC_KEY_LIVE` | Optional display of configured live public key in Settings |
| `RESEND_API_KEY` | Optional business-event email provider key |
| `EMAIL_FROM` | Verified Resend sender, e.g. `NOBELLE <orders@YOUR_DOMAIN>` |
| `EMAIL_WORKER_SECRET` | Random private secret for scheduled email delivery |

```sh
supabase functions deploy checkout
supabase functions deploy payments
supabase functions deploy paystack-webhook
supabase functions deploy public-forms
supabase functions deploy staff
supabase functions deploy send-notifications
```

`public-forms` uses persistent database rate limits and server-side field limits.
If a `TURNSTILE_SECRET_KEY` is configured, requests must also include a valid
`captchaToken`; add the matching public Turnstile widget to the contact/newsletter
forms before enabling that optional setting. Do not enable the secret alone.

## 5. Configure Paystack

In Paystack, set the webhook URL for each configured mode to:

```text
https://YOUR_PROJECT.supabase.co/functions/v1/paystack-webhook
```

Start in TEST mode. Without a test secret, checkout creates a real **unpaid** test
order, displays an explicit no-charge notice and never marks it successful. With
a test key it opens Paystack's actual test checkout. LIVE mode fails closed if
its live secret is missing. The mode stored on each payment determines which
key verifies it, even if settings are subsequently changed.

The browser's callback is informational. Both callback verification and signed
webhooks re-fetch the transaction from Paystack and compare reference, amount,
currency and test/live domain. SQL settlement is idempotent. Duplicate webhooks
cannot deduct stock twice. Only allowlist-checked HTTPS gateway URLs are opened.

Refunds require an authorized staff role and received return items. The server
calculates the refundable item amount, including the original coupon allocation;
delivery fees are excluded. Restocking happens once after gateway-confirmed
success. An uncertain refund request is never automatically resubmitted. If a
network timeout happens before its gateway ID is saved, reconcile it in Paystack
and update the matching refund's gateway ID through the SQL editor before using
Check refund. Do not clear its dispatch marker without reconciling the gateway.

Payment received after cancellation/expiry is recorded and creates an urgent
staff notification; the cancelled order is not fulfilled using released stock.
Such late payments require an operator refund/reconciliation through Paystack.

## 6. Schedule reservation expiry

Enable Supabase Cron (`pg_cron`) and schedule this in the Supabase SQL editor:

```sql
select cron.schedule(
 'nobelle-expire-reservations',
 '* * * * *',
 'select public.expire_orders();'
);
```

Only add the job once. The checkout function also expires older unpaid orders
before creating a new one. Without Cron, expired stock remains reserved until
another checkout or an operator invokes `expire_orders()`.

## 7. Configure the store

Set real business information, policies, supported sizes/colours and delivery
zones. Upload images and add actual products in the existing admin dashboard.
The migration creates `product-images`, `store-assets` and `avatars` storage
buckets with image type/size limits and RLS policies. Images are public storefront
assets; never upload sensitive documents to those buckets.

Use Website Manager for homepage content, sections, banners and featured products.
Use Settings for store and notification preferences. Dashboard notifications
come from database activity, not demo data. Enabling an email event queues it in
`email_outbox`. Business-event email delivery uses the included
`send-notifications` Edge Function with Resend; verify your sending domain and
set the optional email secrets to activate delivery. Auth email delivery is
handled independently by Supabase SMTP. Session management uses real Supabase
Auth sessions and allows administrators to revoke their other sessions.

For email delivery, enable Supabase Cron, `pg_net` and Vault. Store the private
worker secret in Vault as `nobelle_email_worker_secret` through its dashboard.
Schedule the following once, replacing only the project URL:

```sql
select cron.schedule('nobelle-email-delivery','* * * * *',$job$
 select net.http_post(
  url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-notifications',
  headers := jsonb_build_object('Content-Type','application/json','x-worker-secret',
   (select decrypted_secret from vault.decrypted_secrets where name='nobelle_email_worker_secret' limit 1)),
  body := '{}'::jsonb
 );
$job$);
```

The worker claims bounded batches atomically, uses a stable provider idempotency
key, and retries failures with backoff. Uncertain messages older than 23 hours
are quarantined for reconciliation rather than being sent again after the
provider's idempotency window. Without provider secrets and scheduling, queued
business emails remain pending; dashboard notifications still work.

Existing MySQL business records are not automatically converted. If needed,
export them before retiring that database, map customer identities to Supabase
Auth UUIDs, and import parent tables before their related records. Do not import
old password hashes into profile rows. Prefer new account confirmation/recovery.

## 8. Deploy the frontend to Vercel

Import the existing repository as a Vite project with root `.` and set the two
public build variables above. Build command is `npm run build`; output is `dist`.
`vercel.json` supplies the SPA rewrite so direct admin and account route refreshes
work. No API rewrite, serverless Express entrypoint or Render service is needed.
Update Auth redirect URLs, `SITE_URL` and `ALLOWED_ORIGINS` to the deployed domain.

## Hosted acceptance checks

Use separate real test accounts: one customer, another customer, and each staff
role. Create test-only catalogue records in a non-production Supabase project.

- Register, confirm email, sign in/out, recover a password and save profile/address changes.
- Ensure a customer cannot assign roles, read another customer's orders or call settlement RPCs.
- Check unauthorized admin routes and direct PostgREST mutations are rejected.
- Upload images, add/edit/archive a product and verify its published storefront state after refresh.
- Check filters, sizes, colours, wishlist and cart persistence in another session.
- Place an order; verify SQL-calculated shipping/discount totals and stock reservations.
- Have two customers compete for the last unit; only one checkout may reserve it.
- Complete Paystack TEST checkout; verify payment record, order, inventory, timeline and alerts.
- Replay a webhook; verify stock, payment transactions and notifications are not duplicated.
- Fail/cancel/expire unpaid orders; verify reservations are released.
- Process and deliver an order; verify customer tracking and history.
- Request/receive/refund an item; verify discounted refund amount and exactly-once restocking.
- Check real report totals and empty states; change settings and verify persistence.
- Save homepage content, banners and sections; verify storefront refresh and Realtime.
- Submit a real contact message; verify dashboard notification, read/status/archive actions and rate limits.
- Refresh `/admin/products` and `/account/orders/UUID` on the deployed Vercel origin.

Local automated results cannot substitute for these hosted checks. Credentials,
external service setup and deployment must be completed before claiming the
live website is ready for customers.

References: [Supabase Auth](https://supabase.com/docs/guides/auth),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Edge Function authentication](https://supabase.com/docs/guides/functions/auth),
[Paystack verification](https://paystack.com/docs/payments/verify-payments/),
[Paystack webhooks](https://paystack.com/docs/payments/webhooks/).
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
