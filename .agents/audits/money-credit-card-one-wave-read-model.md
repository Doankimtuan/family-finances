# Money Credit Card One-Wave Read Model

Date: 2026-09-11  
Scope: authenticated `/en/money` credit-card summary path  
Status: **COMPLETE**  
Supabase target: development project `family-finances-2`

## 1. Executive Summary

The current MONEY credit-card summary path used three remote reads in two dependent waves: card accounts, followed by settings and open billing months. The accepted candidate replaces only that summary read model with one narrow raw-input RPC. The shared household-context read remains request-local and parallel to the RPC.

All decision gates passed:

- Raw equivalence: 20/20 paired authenticated samples.
- Final card equivalence: 20/20 samples through the existing TypeScript mappers and summary builder.
- RLS/tenancy: active card household, active no-card household, authenticated non-member, cross-household attempt, and anonymous probes all passed.
- Direct median: 427.336 ms current vs 202.927 ms candidate.
- Direct p95: 707.709 ms current vs 243.615 ms candidate.
- MONEY warm browser content median: 908 ms before vs 519 ms after.
- Total warm MONEY Supabase/Auth HTTP fetches: 12 before vs 10 after.

The candidate is accepted and implemented. No financial data was mutated, no RLS policy was changed, and the card detail loader was left unchanged.

## 2. Current Card Architecture

`listCreditCards()` first applies `assertMoneyActionAllowed()`. Before this phase, the summary loader started the following graph:

```text
MONEY page wave
  ├─ card accounts read
  └─ shared household context read
       └─ after card IDs return
            ├─ credit-card settings read
            └─ open card billing-months read
```

The settings and billing-month reads were already parallel with each other, but both depended on the account-ID read. This made the card family 3 calls / 2 waves.

`getCreditCardDetail(accountId)` remains a separate detail contract. It still reads the account, settings, billing months, billing items, and currency projection in parallel and was not changed by this phase.

## 3. Billing / Financial Contract

The candidate returns raw billing inputs only. Existing TypeScript logic remains authoritative:

- `mapCreditCardSettingsRow()` maps credit limit, statement day, due day, and linked bank account.
- `mapBillingMonthRow()` maps billing month dates, statement/paid amounts, due date, status, and remaining amount.
- `computeOutstanding()` sums `max(statement amount - paid amount, 0)` for non-settled months.
- Available credit remains `max(0, credit limit - outstanding)`.
- Utilization remains the existing rounded percentage calculation.
- Existing due-date, payment-state, amount, and empty/missing-settings behavior is preserved.

The SQL does not calculate financial summaries, round money, format currency, or persist display values.

## 4. Candidate Designs

| Candidate | Shape                                                                               | Decision                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| A         | Keep separate reads and only reuse the request-local household context              | Already covered the duplicate household projection; leaves the 3-call / 2-wave card dependency. Not sufficient for this phase. |
| B         | One narrow raw-input RPC returning account, settings, and open billing-month fields | **Selected.** Removes the dependent remote wave while keeping domain semantics in TypeScript.                                  |
| C         | SQL-computed card summaries or JSONB read model                                     | Rejected. Moves financial rules and numeric/shape semantics across the boundary without a measured need.                       |
| D         | RPC wrapper around the existing separate reads                                      | Rejected. It would hide the calls rather than reduce the remote/database work.                                                 |

## 5. Selected RPC

Migration: `supabase/migrations/20260911055502_money_credit_card_raw_inputs.sql`

Function: `public.get_money_credit_card_raw_inputs()`

The function returns one row per active, unarchived credit-card account/open billing-month combination. Settings are left-joined and repeated on month rows. Accounts with no settings or no open months still have a raw row, matching the current intermediate state; the application continues to omit cards without settings from the summary.

The result is ordered by account creation order, billing month, and billing-month ID. The application groups rows by account with a `Map`, reuses `mapCreditCardSettingsRow()`, `mapBillingMonthRow()`, and `buildCreditCardSummary()`, and returns the existing `CreditCardSummary[]` contract.

## 6. Security Model

The function is:

- `SECURITY INVOKER`;
- `STABLE`;
- explicitly configured with `search_path = public`;
- executable by `authenticated` only;
- revoked from `public`.

It accepts no household ID from the caller. Household scoping is derived from the existing authenticated active-household helper and is additionally constrained by the existing table RLS policies. The raw shape retains `financial_scope`, `owner_membership_id`, and owner-membership activity as ownership/capability inputs; no authorization decision was moved into client code.

Privilege introspection after applying the migration reported:

```text
is_security_definer: false
proconfig: ["search_path=public"]
anon_can_execute: false
authenticated_can_execute: true
```

## 7. SQL Plan

The exact RPC invocation was checked with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` through the Supabase SQL tool:

| Measure                   |    Result |
| ------------------------- | --------: |
| Actual returned rows      |         3 |
| Function-scan actual time | 11.953 ms |
| Total execution time      | 12.011 ms |
| Shared hit blocks         |     1,058 |

An inline SQL-body plan reported 2.854 ms planning and 6.181 ms execution. It used an account scan, indexed settings lookups through `idx_credit_card_settings_account`, and billing-month bitmap scans through `idx_card_billing_months_card`. The plan was acceptable at the representative household size, and the direct benchmark showed that hosted request latency, not PostgreSQL execution time, dominated.

No index, table, RLS, or financial schema change was added.

## 8. Raw Equivalence

Twenty paired authenticated samples ran the current three-read shape and the candidate RPC against the same active household. Numeric values were normalized without floating-point conversion; date values were normalized to their date portion; rows were grouped and sorted by stable identifiers before comparison.

| Check                                                | Samples | Matches | Mismatches |
| ---------------------------------------------------- | ------: | ------: | ---------: |
| Account, ownership, settings, and billing raw inputs |      20 |      20 |          0 |

Compared fields included account ID/name/type, archived state, financial scope, owner membership ID, credit limit, statement day, due day, linked bank account, billing-month ID/card ID, billing month, statement amount, paid amount, due date, and status.

## 9. Final Card Equivalence

Both normalized raw shapes were passed through the same existing card mapper and summary builder used by production. The comparison covered card count, account IDs, names, settings, statement/due fields, billing months, amounts, payment state, ownership/capability inputs, currency, and missing/empty states.

| Check                | Samples | Matches | Mismatches |
| -------------------- | ------: | ------: | ---------: |
| Final card summaries |      20 |      20 |          0 |

The representative authenticated household returned three cards in every paired sample. No billing formula or card summary implementation was duplicated in SQL.

## 10. RLS / Tenancy

The read-only tenancy matrix passed without foreign card, settings, or billing data:

| Case                              | Identity used                                             | Current rows | Candidate rows | Candidate status | Result |
| --------------------------------- | --------------------------------------------------------- | -----------: | -------------: | ---------------: | ------ |
| A. Active household with cards    | Primary authenticated user                                |            3 |              3 |              200 | PASS   |
| B. Active household without cards | Authenticated ownership-B user                            |            0 |              0 |              200 | PASS   |
| C. Authenticated non-member       | Ownership-A user                                          |            0 |              0 |              200 | PASS   |
| D. Cross-household attempt        | Primary credentials with foreign-household filter attempt |            — |              0 |              200 | PASS   |
| E. Anonymous                      | No bearer session                                         |            — |              — |    401 / `42501` | PASS   |

The ownership-A probe had zero active memberships and received zero candidate rows. The ownership-B probe had an active membership but no cards and also received zero rows. The candidate never accepted a caller-supplied household identifier.

## 11. Direct Benchmark

Protocol: 20 sequential samples per shape, one warmup before collection, authenticated direct REST reads, same filters and household, no writes.

| Shape     | Calls | Waves |     Median |        P75 |        P95 |        Max | Response bytes | Errors |
| --------- | ----: | ----: | ---------: | ---------: | ---------: | ---------: | -------------: | -----: |
| Current   |     3 |     2 | 427.336 ms | 453.779 ms | 707.709 ms | 834.584 ms |          1,903 |      0 |
| Candidate |     1 |     1 | 202.927 ms | 207.805 ms | 243.615 ms | 247.510 ms |          1,733 |      0 |

The candidate median was approximately 52.5% lower and the p95 approximately 65.6% lower, with a 170-byte response reduction for this household.

## 12. Decision Gate

| Gate                        | Result                                        |
| --------------------------- | --------------------------------------------- |
| Raw equivalence             | PASS, 20/20                                   |
| Final card equivalence      | PASS, 20/20                                   |
| RLS/tenancy                 | PASS, A–E                                     |
| Dependency waves decrease   | PASS, 2 → 1                                   |
| Remote calls decrease       | PASS, 3 → 1                                   |
| Median improves materially  | PASS, 427.336 → 202.927 ms                    |
| P95 is not materially worse | PASS, 707.709 → 243.615 ms                    |
| SQL execution acceptable    | PASS, 12.011 ms exact function invocation     |
| Architecture maintainable   | PASS, raw RPC plus existing TypeScript mapper |

The candidate was accepted and integrated only after all gates passed.

## 13. Implementation

Implemented changes:

- Added the read-only RPC migration.
- Added the RPC name and operation constants in `ledger-shared-constants.ts`.
- Switched only the MONEY hub summary loader in `list-credit-cards.ts`.
- Added a small row-grouping adapter that reuses existing mappers and summary logic.
- Added a unit query-shape/security-contract test.
- Added the read-only direct benchmark script at `scripts/money-credit-card-one-wave-benchmark.mjs`.

The card detail loader, card routes, mutation paths, billing formulas, RLS policies, and persisted financial data were not changed. There is no permanent fallback path.

## 14. MONEY Fetch Inventory

Warm production-server trace counts, excluding the one navigation used to warm the browser before the measurement loop:

| Fetch family                 | Before |  After |
| ---------------------------- | -----: | -----: |
| Auth user                    |      1 |      1 |
| Active household membership  |      1 |      1 |
| Shared household context     |      1 |      1 |
| Credit-card accounts         |      1 |      0 |
| Credit-card settings         |      1 |      0 |
| Card billing months          |      1 |      0 |
| Credit-card raw-input RPC    |      0 |      1 |
| Account ledger RPC           |      1 |      1 |
| Savings summary RPC          |      1 |      1 |
| Investment raw-input RPC     |      1 |      1 |
| Liabilities                  |      1 |      1 |
| Loans                        |      1 |      1 |
| Inbox badge                  |      1 |      1 |
| **Total MONEY HTTP fetches** | **12** | **10** |

The after trace contained no `/rest/v1/accounts`, `/rest/v1/credit_card_settings`, or `/rest/v1/card_billing_months` request for the hub. The card family changed from 3 calls / 2 waves to 1 call / 1 wave.

## 15. MONEY Performance Before vs After

Protocol: production build, local Next server, hosted Supabase, authenticated Chromium, 10 consecutive `/en/money` navigations, 440×900. The response-start field is the Playwright `page.goto(..., waitUntil: "domcontentloaded")` document-navigation proxy, not isolated server TTFB. Content-complete is the `data-testid="money-hub"` marker.

| Measure                          |   Before |  After |
| -------------------------------- | -------: | -----: |
| Document-navigation proxy median |   742 ms | 507 ms |
| Document-navigation proxy p95    | 1,467 ms | 766 ms |
| MONEY content-complete median    |   908 ms | 519 ms |
| MONEY content-complete p95       | 1,653 ms | 809 ms |
| Total warm MONEY HTTP fetches    |       12 |     10 |
| Card server critical-path median | 444.5 ms | 226 ms |
| Card server critical-path p95    | 1,214 ms | 506 ms |

The browser result is consistent with the direct card-family benchmark, while still retaining hosted-network variance rather than attributing the full page improvement to PostgreSQL.

## 16. Remaining Bottlenecks

- Auth user and active-membership resolution remain a pre-page gate and were intentionally not weakened.
- The investment raw-input RPC remains the largest previously measured MONEY payload at 28,002 bytes for 20 active holdings.
- MONEY still renders its main sections as a page-wide server composition; useful independent section streaming is not yet present.
- Hosted Supabase request-boundary latency remains much larger than the measured PostgreSQL execution time for these small result sets.
- Card detail remains a separate multi-read route by design; this phase did not claim detail-route optimization.

## 17. Recommended Next Step

Choose **B. INVESTMENT PAYLOAD NARROWING** as the next measured phase; do not implement it here, and first repeat the same raw/final-equivalence and direct/browser gates against the existing investment resolver contract.

## 18. Raw Evidence

Source audits used:

- `.agents/audits/money-performance-investigation.md`
- `.agents/audits/money-transactions-prefetch-optimization.md`
- `.agents/audits/money-transactions-payload-pagination-benchmark.md`
- The referenced `.agents/audits/money-credit-card-household-read-reuse.md` was not present in the workspace; the pasted execution brief and the three available audits were used instead.

Implementation and benchmark evidence:

- `npm run build`: PASS, Next.js 16.3.1, 98 static pages.
- `npm run typecheck`: PASS.
- Targeted unit tests: PASS, 2 files / 18 tests.
- Changed-file ESLint: PASS.
- Direct benchmark output: `output/playwright/money-credit-card-baseline/direct-benchmark.json`.
- Before browser benchmark: `output/playwright/money-credit-card-baseline/`.
- After browser benchmark: `output/playwright/money-credit-card-candidate/browser-benchmark.txt`.
- After server trace: `output/playwright/money-credit-card-candidate/server.log`.
- Exact RPC `EXPLAIN (ANALYZE, BUFFERS)` and privilege introspection were run through the connected Supabase SQL tool.
- Remote migration history showed the candidate appended to the development project; no unrelated migration was applied.

The benchmark script prints only timings, counts, statuses, and equivalence outcomes. Household IDs, account IDs, tokens, and financial values are intentionally omitted from this report.
