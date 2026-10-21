# Phase 2 — Root Cause Analysis

**Review date:** 2026-10-21  
**Scope:** F3 investment valuation, F4 loan creation, F2 auth-cookie finding. The original Phase 1 audit artifacts remain unchanged.

## Environment and evidence boundary

The app's configured Supabase project is `family-finances-2` (`bbzffxvgocjwsdbujvgn`), the only active hosted database, and it contains non-fixture financial data. The repository's earlier production-isolation audit documents that local app and E2E commands point to it. The root audit manifest says no authenticated sessions or journeys were created, which conflicts with the prior V2 `progress.json` claims of two synthetic sessions and a test household. I treated those prior claims as historical assertions, not new Phase 2 browser evidence. No local Supabase stack was running. I made no authenticated browser mutations and applied no remote DDL.

## F3 — stale valuation after partial sale

**Original behavior:** the Phase 1 audit reported quantity `60`, unit price `₫120,000`, total value `₫12,000,000`, and an overstated unrealized gain after selling 40 of 100 units. It attributed this to a cached `current_valuation` column not being updated.

**Independent source finding:** `investment_holdings` has no `current_valuation` column. Valuation snapshots are stored separately in `investment_valuations` (`value_vnd`, `unit_price_vnd`, quantity context). Investment detail, list, portfolio, and Home-summary reads call the shared `resolveInvestmentValuation` resolver. Its manual-price path selected the stored snapshot total without recomputing it from the current remaining quantity. That is the stale-value defect; the original cached-column explanation is incorrect.

**Correction:** when a manual valuation includes a unit price, the shared resolver now derives value as remaining quantity × unit price using the existing quantity/money helper. If the historical record has no unit price, it retains its stored total because no safe current quantity-based value can be inferred. No duplicate valuation source or data rewrite was added.

**Deterministic regression evidence:** the new tests cover 100 units bought at `₫100,000`, a first sale of 40 units at `₫120,000`, another sale of 10, and liquidation of the remaining 50. Expected remaining values/basis/P&L reconcile at each step. A portfolio summary test verifies the corrected `₫7,200,000` valuation and `₫1,200,000` unrealized result. Actual browser refresh, Home household net worth, and cash-ledger exactly-once behavior were not re-run in Phase 2 because the only configured backend is the live financial store.

**Issue status: PARTIAL.** Source fix and automated financial regression pass; browser and live aggregate verification remain blocked. No historical data was repaired.

## F4 — loan creation RPC helper absent

**Original behavior:** the Phase 1 audit reported SQLSTATE `42883` for missing `public._loan_insert_schedule_entries(uuid, uuid, jsonb)` on loan creation.

**Independent source/database finding:** the baseline migration's `create_loan_with_schedule` path calls this helper, but the helper has no definition in the repository migrations or the hosted database catalog. The hosted wrapper and its unchecked child are `SECURITY DEFINER`, owned by `postgres`, and pin `search_path=public`; the wrapper is executable by `authenticated`. The application passes the corresponding named RPC arguments and JSON schedule shape. Therefore the missing helper is a verified blocker. There is no evidence that the client signature or RPC grant caused this failure. The unrelated local/remote timestamp difference for `transaction_detail_rows` does not define or explain the helper's absence.

**Correction prepared:** a forward-only migration creates the helper as `SECURITY INVOKER` with a pinned search path, inserts each provided schedule row, revokes execution from API roles, and grants it to `postgres` so the existing `postgres`-owned security-definer path can call it. A contract test checks the helper declaration and ACL. The migration was not applied to the hosted project and has not been executed against PostgreSQL in this phase.

**Access review:** the hosted catalog shows RLS enabled for schedule entries, with authenticated `SELECT` limited to active members of the linked loan household; authenticated users do not have direct table `INSERT`. The existing wrapper resolves the caller's active household and the `postgres`-owned security-definer path performs the insert. This is structural evidence only; cross-account behavior has not been exercised.

**Input-validation risk:** the public authenticated wrapper checks core loan parameters but accepts client-supplied schedule JSON and totals. The normal application command calculates the schedule before calling it, but the database does not independently recompute that schedule. Before release, test both the supported app call and a direct malformed RPC call; add database consistency checks if the public RPC is expected to defend against altered schedule input.

**Remaining scope:** because no safe database target was available, I cannot claim this is the only blocker after DDL application, nor verify schedule persistence, atomic rollback, runtime RLS/ownership, duplicate replay, loan details, malformed-input handling, or cross-account visibility. The local amortization and loan-integrity suites pass but do not execute the database function.

**Issue status: BLOCKED.** The source omission is corrected in a local migration; safe database and browser verification is required before marking fixed.

## F2 — JavaScript-readable Supabase SSR cookie

The app uses both `createServerClient` and `createBrowserClient` from `@supabase/ssr`. Its proxy calls `getClaims()` for session refresh, and server auth paths use `getUser()`/verified claims. Supabase's current hybrid SSR guidance uses browser-readable cookie storage so the browser client can refresh the session; adding `HttpOnly` to that hybrid cookie would break the supported browser refresh path. `SameSite=Lax` is the package default. The repository does not set a production `Secure` cookie option or a Content Security Policy in the inspected app/config surface.

The cookie's JavaScript readability is therefore expected for this hybrid architecture, while XSS remains a meaningful threat because script running in the origin can access the session and make authenticated requests. Keep the hybrid architecture in this phase. Follow up with production-only `Secure` cookies over HTTPS, a tested CSP, and continued safe rendering/HTML handling. Do not add `HttpOnly` without migrating to a server-only session design and revalidating browser auth flows.

References: [Supabase advanced SSR guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [Supabase sessions guide](https://supabase.com/docs/guides/auth/sessions), and [Supabase server package guidance](https://supabase.com/docs/guides/auth/choosing-a-server-package).

**Issue status: REASSESSED.** The reported exposure is real, but `HttpOnly` is not a compatible fix for the current hybrid client. No auth architecture or cookie behavior was changed.

## Audit count discrepancy

The V2 `issues.md` lists seven findings: F1–F7. Its `progress.json` says `total: 6` and counts only two P3 issues, although F2, F5, and F7 are all P3. Correct totals from the ledger are P0 0, P1 2, P2 2, P3 3, total 7. Original files were preserved.
