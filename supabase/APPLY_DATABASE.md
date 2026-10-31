# Apply and validate the NOBELLE database

**The hosted database has not been updated by this work.** The SQL has been
executed and tested in isolated PostgreSQL test databases. The public browser key
can check API access; applying SQL requires the Supabase SQL editor or an
authenticated database connection.

## 1. Inspect the correct project

Open the Supabase project matching `VITE_SUPABASE_URL`. Run
[`diagnostics.sql`](diagnostics.sql) in **SQL Editor → New query**.

It reports all 46 public application tables, missing columns and types, validated
relationships/checks/keys, required indexes, RLS policies, Realtime publication
membership, naming differences and Supabase-owned dependencies. It reads
metadata, not customer records. Missing tables and denied permissions are
different findings; an empty RLS-filtered result does not prove a table is absent.

## 2. Choose the matching installation path

| Existing database | SQL to run |
| --- | --- |
| New project, or existing project with partial `store_settings` and/or `product_categories` | [`BOOTSTRAP.sql`](BOOTSTRAP.sql) |
| Baseline NOBELLE schema/functions already installed, but settings table/version/default sections are missing | [`SETTINGS_RECOVERY.sql`](SETTINGS_RECOVERY.sql) |
| Baseline installed, with missing categories and/or settings metadata | [`CATEGORY_SETTINGS_RECOVERY.sql`](CATEGORY_SETTINGS_RECOVERY.sql), containing migrations `202610310013` and `202610310014` |
| Other existing or incompatible application tables/policies | Inspect the audit and apply reviewed incremental migrations; the bootstrap deliberately refuses to overwrite them |

Copy the **entire** chosen SQL file into a new SQL-editor query and run it once.
All three scripts use a transaction. A guard failure rolls the transaction back;
review the reported conflict before continuing. Existing tables, customer data
and saved configuration JSON are not deleted or replaced. Existing configuration
sections use `ON CONFLICT (section) DO NOTHING`; defaults are inserted only for
missing sections. Newly required settings metadata may be added safely.

The bootstrap includes all fourteen numbered migrations, Auth profile
backfilling for actual existing users, RLS, Storage policies, transactional RPCs
and Realtime setup. It never creates demo products, orders, customers or revenue.
It does not infer admin roles from user metadata.

The settings recovery script is repeatable and only repairs settings. It checks
for the baseline permission functions first; it cannot substitute for a missing
catalogue/order schema. It recreates the application-owned settings policy while
refusing unknown additional policies that could broaden access.

The category recovery also restores the product relationship and permission-checked category operations. It preserves existing category fields and product references. Categories used by products must be deactivated or their products reassigned before deletion. Unknown policies or incompatible columns cause a safe failure for review.

All three scripts finish with:

```sql
NOTIFY pgrst, 'reload schema';
```

For CLI-managed projects, use the files in `migrations/` in filename order with
`supabase db push`. Mark SQL-editor-installed versions as applied before later
switching to CLI deployments; do not rerun the fresh baseline over populated
application tables. See [SETUP.md](SETUP.md) for migration-history handling.

Regenerate the install scripts and metadata audit after changing migrations:

```sh
npm run build:supabase
```

This command validates the SQL locally and writes the SQL files; it does not
connect to or update the hosted database.

## 3. Verify settings and column names

The required settings query is valid against the supplied schema:

```sql
select values from public.store_settings where section = 'products';
```

`store_settings` has `id`, unique `section`, JSONB `values`, integer `version`,
`"createdAt"` and `"updatedAt"`. The application also uses `"isActive"` on
published catalogue/content tables. These quoted identifiers are case-sensitive.
Do not change a frontend query to `created_at` or `is_active` unless the audited
table really uses that contract and an explicit migration maps it.

Supabase-owned `auth.sessions` uses native `created_at` and `updated_at`; these
names are intentional. The admin **customers** resource maps to `profiles`, which
references `auth.users`. A separate `customers` table is not required by this app.

If an existing settings row has missing JSON fields, the migration preserves it.
Admin Settings shows an explicit review notice and proposed configuration
defaults. Saving that section is the administrator's explicit action to persist
the reviewed values. The storefront reports incomplete configuration rather
than substituting mock settings or crashing.

## 4. Bootstrap the first administrator

Create/confirm a real email user using Supabase Authentication. The bootstrap
backfills existing Auth users; future registrations get profiles via a trigger.
Obtain the user's UUID from Authentication and run:

```sql
insert into public.admin_roles("userId", role)
values ('YOUR_REAL_AUTH_USER_UUID', 'SUPER_ADMIN');
```

Sign in through `/admin/login`. Roles and staff permissions are database-backed.
Clients cannot assign themselves an admin role. Public visitors only read
published catalogue/content and public configuration; customers access their own
private records; financial and settings writes require checked RPCs/permissions.

## 5. Deploy the necessary Edge Functions

SQL alone does not deploy functions. Run the documented function deployment in
[SETUP.md](SETUP.md), especially `staff` for staff administration and payment
configuration checks. Auth/profile/password operations use Supabase Auth; saved
configuration uses database RPCs. Missing payment-function configuration now
shows a specific error in Payments without blocking unrelated settings tabs.

Keep service-role and payment secrets in Supabase Edge Function secrets, never in
`VITE_` variables. Only the project origin and public publishable/anon key belong
in the React environment. No Express, MySQL or separate backend server is needed.

## 6. Validate after successful execution

1. Rerun `diagnostics.sql`; resolve missing columns, constraints, indexes or RLS
   findings before claiming the schema is complete.
2. Run `npm run check:supabase -- --all`. This uses zero-row API probes and a
   temporary Realtime channel. Protected-table findings may need SQL-editor
   confirmation if anonymous access is intentionally restricted.
3. Sign in as Super Admin; save each Settings section, refresh, then sign out/in
   and verify values persist. Review missing-field notices before saving.
4. With separate customer/staff accounts, confirm private-record isolation and
   rejection of settings/product mutations without the required permission.
5. Create a real category, collection, product, variant and stock record; publish
   the product and verify storefront reads and subsequent edits after refresh.
6. Update homepage content/website settings; verify saved published changes reach
   the storefront. Verify public policies reveal only their published versions.
7. Check the browser network log: `/rest/v1/store_settings` and the other table
   endpoints must succeed. Realtime must use `/realtime/v1/websocket`.

The automated local suite tests schema/query compatibility, every stored Settings
section, permissions, ownership, optimistic concurrency, published policy drafts,
settings recovery, order/payment/inventory transactions and preservation of
unrelated schema grants. It cannot certify hosted deployment until the SQL is
actually executed there and the hosted checks above pass.

## Required public tables

| Area | Tables |
| --- | --- |
| Identity | profiles, admin_roles, staff_permissions, customer_addresses |
| Catalogue | products, product_categories, product_collections, product_collection_links, product_images, product_variants, product_sizes, product_colours, product_reviews |
| Inventory | inventory, inventory_movements |
| Shopping | carts, cart_items, wishlists, wishlist_items |
| Orders/fulfilment | orders, order_items, order_status_history, shipping_addresses, shipments, returns, return_items, refunds |
| Payments | payments, payment_transactions |
| Promotions | coupons, discounts, coupon_usage |
| Website | website_settings, store_settings, homepage_sections, banners, featured_products, policies |
| Operations | admin_notifications, notifications, contact_messages, newsletter_subscribers, activity_logs, email_outbox |
| Shipping | shipping_zones, shipping_rates |

`private.rate_limits` is an internal service-only dependency; it is not a public
API table. Supabase supplies `auth.users`, `auth.sessions`, `storage.buckets` and
`storage.objects`. `database-contract.json` records the exact application
columns, types, constraints and indexes generated from the tested migrations.
