# Phase 2 — Implementation Summary

## F3 — investment valuation

- **Files changed:** `modules/investments/application/market-valuation.ts`; `tests/unit/market-valuation.test.ts`; `tests/unit/investment-lifecycle.test.ts`; `tests/unit/investment-portfolio-view-model.test.ts`.
- **Change:** the manual valuation branch now derives value from remaining quantity and the recorded unit price when both are present. It reuses the existing safe quantity × unit-price helper. Snapshots without unit price retain their stored total.
- **Database:** none. No rows or valuation history were updated.
- **Verification:** focused investment/loan suites passed: 43 tests in 6 files. Whole-suite results are in [regression-results.md](regression-results.md).
- **Outcome:** deterministic calculation and portfolio-summary assertions pass. Refresh, Home total, and cash exact-once behavior lack Phase 2 browser/DB evidence.
- **Status:** PARTIAL.

## F4 — loan schedule helper

- **Files changed:** `supabase/migrations/20261021020424_loan_insert_schedule_entries.sql`; `tests/unit/rpc-acl-hardening.test.ts`.
- **Change:** added a forward migration defining the missing schedule insert helper. It uses a pinned `public` search path, `SECURITY INVOKER`, narrow execution rights for the existing `postgres`-owned security-definer call path, and the table's existing default for schedule status. The contract test now reads all migrations so it can verify forward migrations as well as the frozen baseline.
- **Database:** local migration file only. No remote migration was applied. No local Supabase instance was running, so the SQL was not executed against a database.
- **Verification:** loan amortization, loan integrity, and RPC ACL contract suites passed (21 tests across those three suites); migration-freeze validation passed. There is no end-to-end RPC result.
- **Outcome:** confirmed missing helper call has a local forward migration. Rollback, idempotent replay, schedule persistence, RLS, detail rendering, and household isolation remain unverified.
- **Status:** BLOCKED pending isolated database and browser verification.

## F2 — authentication finding

- **Files changed:** none.
- **Database/auth changes:** none.
- **Review:** this is a hybrid SSR/browser Supabase client. Browser-readable session cookies support browser-side token refresh in `@supabase/ssr`; adding `HttpOnly` directly conflicts with that design. The phase report recommends compatible hardening and makes no architecture change.
- **Status:** REASSESSED; the original `HttpOnly` expected behavior is not valid for the current hybrid client.

## Unrelated findings

F1, F5, F6, and F7 were not modified. Phase 3 enhancements were not started.
