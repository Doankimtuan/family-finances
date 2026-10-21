# Phase 2 — Remaining Risks and Release Readiness

## F3 — investment valuation (PARTIAL)

- The shared resolver now calculates manual unit-price value from current quantity, and focused calculation/portfolio tests pass.
- No Phase 2 browser refresh proved that detail, overview, and Home all show the corrected value in the target build.
- Sale proceeds/idempotent replay, actual household net worth, and persisted values remain unverified against an isolated database.
- Holdings whose historical manual valuation has no unit price retain the snapshot total; a controlled review is needed to determine whether any such record is stale.
- No production rows were repaired. Use a read-only discrepancy inventory first; preserve audit history and require a reviewed recovery plan before any bulk repair.

## F4 — loan creation (BLOCKED)

- The helper is absent on the hosted catalog and a local forward migration now defines it. The migration is not deployed or PostgreSQL-executed.
- A non-production Supabase target and two isolated browser identities are required to validate the full workflow: creation, schedule rows/math, atomic failure rollback, idempotent replay, loan detail, RLS, and cross-account visibility.
- The authenticated RPC accepts caller-supplied schedule JSON and summary totals; the current application command calculates them, but the database does not independently recompute them. Exercise malformed direct RPC inputs and add consistency checks if the RPC is expected to defend that trust boundary.
- Do not run the current E2E global setup against `family-finances-2`; it uses service-role credentials to create or update fixtures in the only active live database.
- After isolated validation, review the migration and recovery path before separately scheduling any hosted change. No production migration has been applied.

## F2 — auth cookie (REASSESSED)

- The readable cookie matches the current hybrid `@supabase/ssr` browser/server session architecture. Blindly setting `HttpOnly` can prevent browser-side refresh and is not the right patch here.
- XSS can still expose or use a live session. The inspected app has no CSP declaration in its config/source surface and no sanitizer dependency/use found by targeted search.
- Recommended follow-up: set `Secure` for production HTTPS cookies while preserving localhost development, retain `SameSite=Lax`, add and test a CSP compatible with Next.js, and review untrusted HTML/render paths. Keep server-side auth decisions on `getClaims()` / `getUser()`, not an unverified session object.
- No auth code or headers changed in this phase.

Official references: [Supabase advanced SSR guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [Supabase sessions guide](https://supabase.com/docs/guides/auth/sessions), [Supabase server package guidance](https://supabase.com/docs/guides/auth/choosing-a-server-package), and [Supabase database functions guide](https://supabase.com/docs/guides/database/functions).

## Audit/report consistency

The preserved V2 `issues.md` contains seven findings while `progress.json` totals six. Correct ledger totals are P0 0 / P1 2 / P2 2 / P3 3 / total 7. The V2 progress file also claims synthetic browser accounts that the root audit manifest never verified; the Phase 2 manifest records no new sessions and does not treat those claims as proof of isolation.

## Gate to complete Phase 2

1. Establish an isolated local Supabase stack or separate non-production project and confirm its fixture ownership boundary.
2. Apply the forward migration only to that isolated target.
3. Run investment and loan Playwright flows with two isolated sessions where permissions require it; retain redacted browser evidence.
4. Verify cash exactly once, household aggregates, schedule persistence, rollback, idempotency, and RLS.
5. Only after those results, assess any separate hosted migration/reconciliation plan.
