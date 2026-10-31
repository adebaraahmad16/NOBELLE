# Supabase connection investigation

## Endpoint fix

Both local `.env` and `.env.example` contained a project URL ending in
`/rest/v1/`. This made the SDK construct `/rest/v1/rest/v1/...` and
`/rest/v1/realtime/v1/websocket`.

Local `.env` now contains only the project origin. The example file contains
placeholders. `src/lib/supabase.js` is the single frontend client; its shared
configuration helper normalizes copied API URLs to the origin, validates the
protocol, and rejects privileged frontend keys. The SDK constructs REST, Auth,
Storage, Functions and WebSocket URLs. There are no custom endpoint overrides.

## Live read-only results

The expanded audit checks 46 application tables. In the latest full check,
16 expected-public tables returned `PGRST205`, including the eleven storefront
tables listed below plus `featured_products`, `product_sizes`, `product_colours`,
`shipping_zones` and `shipping_rates`. A further 28 protected tables could not be
verified with the public role; they may be missing or hidden by grants and require
SQL-editor confirmation. The latest snapshot (2026-10-31 16:05 UTC) found
`product_categories` reachable but missing `imageUrl`, and `store_settings`
reachable but missing `createdAt`. Earlier probes reported missing settings
`version`; a query reports only its first column error, so run diagnostics.sql
to enumerate all missing columns. No live changes were made by this work.
These are API inspection results, not a claim that SQL migrations were applied.

If a browser still reports `store_settings` itself as missing, verify its
environment points to this same project and restart/redeploy to remove stale
configuration. Run the SQL audit to distinguish physical absence from API-cache
or grant issues.

Using the configured public key, the live server was reachable at:

```text
https://izghiqrtxomsoygsvnxt.supabase.co
```

A temporary diagnostic channel successfully reached `SUBSCRIBED` at:

```text
wss://izghiqrtxomsoygsvnxt.supabase.co/realtime/v1/websocket
```

The following tables returned HTTP 404 / `PGRST205` (not found in the public API
schema cache) during the latest check:

- products
- product_collections
- product_collection_links
- product_images
- product_variants
- inventory
- product_reviews
- discounts
- website_settings
- homepage_sections
- banners

`product_categories` and `store_settings` returned HTTP 400 / `42703` for the
columns above. The application migrations define `version` as an integer starting
at 1, used for optimistic concurrency in Settings. The query contract should not
be weakened to conceal this mismatch.

No explicit permission-denied response was returned by these probes. This does
**not** establish that the hosted RLS policies are correct: unavailable tables
and columns prevent complete policy verification. Public OpenAPI introspection
requires a privileged key on this project, so diagnostics used zero-row queries
instead. No customer or business records were downloaded, and no hosted schema,
grants or policies were modified.

## Resolve schema issues separately

Authenticated Supabase access is needed to inspect SQL metadata or apply repairs.
The Supabase plugin can provide that access after installation and authorization;
the browser publishable key cannot run migrations. It remains unconnected in this
workspace unless explicitly enabled.

For a new project or one containing **only** a compatible partial
`store_settings` table, `BOOTSTRAP.sql` is a generated one-time SQL-editor
installer. It runs all migrations in one transaction, adds missing settings
metadata, inserts missing configuration sections without changing existing JSON,
and backfills profiles for real existing Auth users. It never imports roles from
user metadata and never adds sample products, orders or customers.

The installer refuses other public tables/functions, existing Storage or settings
policies, private asset bucket conflicts, unknown settings fields, and
incompatible types. A refusal rolls back the whole transaction and leaves the
existing schema/data intact. Review such conflicts before using regular targeted
migrations; do not remove the guards or delete existing data to force it through.

1. Follow [APPLY_DATABASE.md](APPLY_DATABASE.md). Run `supabase/diagnostics.sql`
   in the project's SQL editor. It reports all 46 tables, exact missing columns
   and types, 174 constraints, 135 indexes, grants, RLS policies and Realtime
   publication membership without changing the database.
2. Reconcile the hosted schema with the SQL migrations. There is already a partial
   `store_settings` table: inspect it before running a fresh-project migration,
   which would otherwise collide with existing objects. If it meets the guarded
   installer's conditions, run `BOOTSTRAP.sql` in the correct project's SQL
   editor. Otherwise use targeted migrations after reviewing the diagnostics.
   Preserve existing rows.
3. If the diagnostic confirms the expected `store_settings` structure and only
   its version field is missing, the targeted repair is:

   ```sql
   alter table public.store_settings
     add column if not exists version integer not null default 1;
   notify pgrst, 'reload schema';
   ```

4. If tables exist but are absent from the API cache, verify `public` is exposed,
   verify grants and RLS, and reload PostgREST's schema cache. Never disable RLS.
5. Apply `202610310012_realtime_catalogue.sql` after the catalogue tables exist.
   It adds catalogue changes to the publication without altering RLS.
6. Rerun `npm run check:supabase -- --all`. Tables and columns must pass before claiming
   products, collections and content can load successfully.

The public key cannot run SQL or inspect privileged policy metadata. Database
reconciliation requires the Supabase dashboard or an authenticated CLI database
connection; there is no separate application server involved.

## Repeated requests and subscriptions

- One shared, reference-counted Realtime channel survives StrictMode remounts.
- Supabase handles token refresh without recreating application channels.
- Delayed subscriptions and pending cleanup are cancelled or serialized.
- Concurrent public reads share requests and briefly reuse successful results;
  errors and private account records are not cached.
- Auth changes, writes, focus and relevant Realtime events invalidate public reads.
- Order/content events no longer refresh unrelated catalogue/settings requests.
- Settings use Realtime/focus updates instead of a redundant polling timer.
- Missing tables, missing columns, denied access and network failures have
  distinct visible errors. No mock data or disabled RLS is used.

## Vercel

Set `VITE_SUPABASE_URL` to the origin above and
`VITE_SUPABASE_ANON_KEY` to the matching public publishable/anon key for every
Vercel environment in use, then redeploy. Vite embeds variables at build time.
Restart local Vite after `.env` edits. The normalization guard also prevents a
copied service suffix from generating duplicate paths in a newly built app.

The existing SPA rewrite remains in place for admin/account route refreshes.
Hosted Vercel environment variables were not changed from this workspace.
