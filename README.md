# NOBELLE

React, JavaScript, Tailwind CSS and React Router frontend backed by Supabase Auth,
PostgreSQL, RLS, Storage, Realtime and Edge Functions. Vercel hosts the static app.
There is no Express server, Prisma runtime, MySQL connection or API proxy.

## Run locally

1. Complete [Supabase setup](supabase/SETUP.md).
   For a missing-table error, follow [the database application guide](supabase/APPLY_DATABASE.md).
2. Copy `.env.example` to `.env` and set your **public** Supabase URL and key.
3. Run `npm install`, then `npm run dev`.

Only the Vite frontend process is needed. Your managed Supabase project provides
the backend. Never put a service-role key or Paystack secret in a `VITE_` variable.

## Project structure

- `src/lib/supabase.js`: centralized Supabase client and configuration checks.
- `src/api/auth-client.js`: Supabase authentication and existing page compatibility.
- `src/api/supabase-service.js`: reusable queries, uploads, RPC and Edge Function calls.
- `src/context`: existing application state and providers.
- `src/hooks/useSupabaseSync.js`: live catalogue, settings, order and notification refresh.
- `supabase/migrations`: schema, configuration defaults, RLS, storage policies and transactions.
- `supabase/functions`: checkout, payments, webhooks, staff administration and public forms.
- `tests/database.mjs`: embedded PostgreSQL integration tests; no local server required.

## Checks

```sh
npm test
npm run lint
npm run build
npm run check:supabase
npm run build:supabase
```

Database tests run real PostgreSQL SQL and RLS with a small test-only substitute
for Supabase-owned Auth and Storage schemas. They do not test hosted Auth email,
Storage uploads, Realtime delivery, Paystack or Vercel. Complete the hosted checks
in [SETUP.md](supabase/SETUP.md) before accepting real payments.

Connection regression tests verify SDK endpoint construction, error categories,
read deduplication and subscription cleanup. The separate `check:supabase` command
uses your configured public key to check the hosted API without downloading
business records. Current hosted schema issues are documented in
[CONNECTION_REPORT.md](supabase/CONNECTION_REPORT.md).

`supabase/BOOTSTRAP.sql` is the generated one-time SQL-editor installer for a
fresh project or a compatible partial settings table. Its guards and transaction
preserve existing settings and reject conflicting objects; SQL access is required
to apply it. Integration tests exercise UUID/integer settings IDs, policy
conflicts, sensitive configuration rejection and safe Auth profile backfilling.

`supabase/SETTINGS_RECOVERY.sql` repairs settings after the baseline is installed.
Both scripts preserve existing settings JSON and notify PostgREST to refresh its
schema cache. `database-contract.json` and `diagnostics.sql` cover all 46 public
application tables, 174 constraints and 135 indexes. Admin customers map to
`profiles`; application columns retain their quoted camelCase names.

Compatible dependency security fixes have been applied. The package audit still
reports six moderate advisories in the ESLint development dependency chain; no
critical or high advisories remained in the last audit. The build also reports
a large JavaScript chunk warning, which does not prevent deployment.

The former backend source was archived to the ignored `.tmp/legacy-backend.zip`
before removal. Its old local environment file was retained separately under
`.tmp/legacy-backend.env` if present. These are local recovery artifacts, contain
no runtime dependencies, and must not be deployed or published. Git also retains
the tracked backend history. Existing business records have **not** been imported.

The earlier `README (2).md` describes the previous implementation and is superseded
by this document for backend configuration and deployment.
