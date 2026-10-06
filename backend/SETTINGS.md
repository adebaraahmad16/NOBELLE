The admin Settings page is part of the existing application at `/admin/settings`.

Apply database changes on other environments with `npm run prisma:deploy`, then regenerate the client with `npm run prisma:generate` and restart the backend. The additive migration records administrator profile data, revocable session metadata and order configuration snapshots.

The local development database migration has been applied. Database integration checks use a separate MySQL database whose name ends in `_test`; configure `TEST_DATABASE_URL` before running `npm run test:integration`. Unit checks run with `npm run test:unit`.

Paystack uses existing credentials or separate `PAYSTACK_TEST_SECRET_KEY` / `PAYSTACK_LIVE_SECRET_KEY` and matching public keys. Set `PAYSTACK_SUPPORTED_CURRENCIES` to the currencies actually enabled for the merchant. Secret values belong exclusively in server environment configuration. Email preferences queue jobs through the existing email worker; delivery requires the existing SMTP configuration. Branding uploads use `UPLOAD_DIR/settings`, which must remain persistent when deploying.

Section saves validate input and check section versions to prevent overwriting concurrent edits. Shared logo/favicon settings update Store Information and Website together. Policy drafts are separate from published content; public pages return only published policies. Role permission changes revoke affected staff sessions, and every authenticated admin API request checks current role permissions.

Orders snapshot deduction timing, currency, payment mode, cancellation and return rules at checkout. Stock is reserved during checkout, deducted at the selected stage and restored on unpaid cancellation/expiry. Backorders cannot be packed or shipped until inventory has been fulfilled. Existing orders retain the previous rules.

Two-factor authentication is unavailable in the current backend; the Security page states this without providing a misleading enable control. Session locations are not collected. Settings refresh after saves, on browser focus, across tabs and at one-minute intervals on the storefront.
