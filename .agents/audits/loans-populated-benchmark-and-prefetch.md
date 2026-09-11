# Loans Populated Benchmark and Prefetch

Date: 2026-09-11  
Status: **COMPLETE**

## 1. Executive Summary

The Loans list was measured against a disposable populated fixture in the linked development Supabase project. The existing global `PRODUCT_LINK_PREFETCH=false` policy was applied to `LoanProductRow`.

Results:

- The browser observed **4 detail RSC prefetches per list load before** and **0 after**.
- The list rendered 4 rows with a **1,442 ms median** and **3,042 ms p95** content milestone after the fix.
- Direct hosted reads were approximately **311–322 ms median**; PostgreSQL execution was **0.056–0.088 ms** across the four measured query shapes.
- The list has **3 dependency stages**: auth/membership, Loans list, then parallel payment/schedule/owner reads.
- Detail overlap is confirmed in source and trace, but this fixture does not justify a second production optimization.

No schema, RLS, auth, RPC, index, or infrastructure change was made. Production code changed only for the requested prefetch fix and its regression assertion. Benchmark and fixture scripts are DEVELOPMENT-ONLY.

## 2. Prefetch Fix

Changed `app/[locale]/(product)/money/loans/loan-product-row.tsx`:

```tsx
<Link href={href} prefetch={PRODUCT_LINK_PREFETCH} ...>
```

The value comes from `shared/constants/navigation.ts`; no Loans-specific constant was added. `tests/unit/product-link-prefetch.test.ts` now covers the row file. Next.js 16 documents that `prefetch={false}` disables viewport and hover prefetching for App Router links.

## 3. Disposable Fixture

Created with `VINHA_LOANS_FIXTURE=1 node scripts/loans-populated-fixture.mjs setup` and removed after all measurements.

| Entity                   | Created |
| ------------------------ | ------: |
| Loans                    |       4 |
| Active / completed loans |   3 / 1 |
| Schedule entries         |      74 |
| Historical payments      |      17 |
| Rate periods             |       5 |
| Payment transactions     |      17 |
| Benchmark cash account   |       1 |

The fixture used the existing E2E household and current membership. It included household-owned active data, a personal-owned loan, an overdue loan, an upcoming payment, a completed historical loan, and a promotional fixed-to-floating rate period. IDs were recorded in `output/playwright/loans-populated-fixture.json` during setup and removed by cleanup.

## 4. Financial Fixture Validation

The real authenticated app rendered at `http://localhost:3101/en/money/loans` with a `440x900` Chromium viewport.

Observed app fields:

- Remaining principal: `₫87,000,000`.
- Active loans: `3`.
- Next payments: `₫5,330,000`.
- Overdue: `1 overdue`.
- Personal ownership: `Personal · You`.
- Historical section: one completed loan with `₫0` remaining principal.

Read-only database validation matched the UI: 4 fixture loans, 3 active, 1 completed, 57 upcoming schedule entries, 17 payments, and 5 rate periods.

## 5. Prefetch Before vs After

Ten authenticated list loads were run at `440x900` against a production Next build.

| Measure per list load                 | Before | After |
| ------------------------------------- | -----: | ----: |
| Detail RSC prefetches                 |      4 |     0 |
| Browser requests                      |     46 |    39 |
| Rows rendered                         |      4 |     4 |
| Completed Loans-domain Supabase calls |      4 |     4 |

The server trace showed the same completed list-domain calls in both runs. The before-run RSC requests did not produce additional completed detail Supabase spans, so no server-call saving is claimed; the client-side RSC/request elimination is directly observed.

## 6. Populated Request Inventory

Rows and payload bytes are from 20 direct authenticated samples. Trace duration/start is a representative first populated list load; `+offset` is relative to its Auth user fetch.

| Request                              | Wave / dependency        | Rows | Bytes |        Direct median | Trace start / duration |
| ------------------------------------ | ------------------------ | ---: | ----: | -------------------: | ---------------------: |
| `GET /auth/v1/user`                  | W0 gate                  |    1 | 2,170 |            304.20 ms |            +0 / 370 ms |
| `GET household_members` current      | W0 gate                  |    1 |   167 |            320.11 ms |          +375 / 425 ms |
| `GET loans`                          | W1, after gate           |    4 | 3,398 |            321.63 ms |          +804 / 458 ms |
| `HEAD inbox_items`                   | layout, parallel with W1 |    0 |     0 | not sampled directly |          +808 / 461 ms |
| `GET household_members` owners       | W2, after Loans IDs      |    1 |    47 |            313.19 ms |        +1,281 / 341 ms |
| `GET loan_payments` aggregate        | W2, after Loans IDs      |   17 | 1,732 |            311.35 ms |        +1,281 / 525 ms |
| `GET loan_schedule_entries` upcoming | W2, after Loans IDs      |   57 | 4,992 |            311.98 ms |        +1,282 / 539 ms |

The list makes 4 Loans-domain calls per populated load: the list row read, payment aggregate, upcoming schedule aggregate, and optional owner-membership validation. Auth/membership and the layout inbox badge are excluded from that count.

## 7. Dependency Graph

```text
W0  auth claims/user + active membership
                 │
W1  loans list ───┼── inbox HEAD runs in the layout path
                 │
W2  payment aggregate + upcoming schedule + owner membership
                 │             (parallel after Loans IDs)
                 ▼
            rendered list
```

The source path is `assertMoneyActionAllowed` → `loadLoans` → `loadLoanAggregatesByIds`. Aggregate reads are batched by all returned loan IDs; there is no per-loan request loop.

## 8. Browser Baseline

Production build, `next start -p 3101`, authenticated E2E identity, `440x900`, 10 repeated warm navigations. Percentiles use the `ceil(p*n)-1` convention.

| Metric                |      Min |   Median |      P75 |        P95 |        Max |
| --------------------- | -------: | -------: | -------: | ---------: | ---------: |
| Response start before | 344.3 ms | 537.7 ms | 719.0 ms | 2,509.8 ms | 2,509.8 ms |
| Response start after  | 368.2 ms | 425.6 ms | 552.2 ms | 1,936.1 ms | 1,936.1 ms |
| Content before        | 1,258 ms | 1,622 ms | 1,941 ms |   3,601 ms |   3,601 ms |
| Content after         | 1,252 ms | 1,442 ms | 1,800 ms |   3,042 ms |   3,042 ms |
| Full load before      | 1,269 ms | 1,632 ms | 1,952 ms |   3,614 ms |   3,614 ms |
| Full load after       | 1,262 ms | 1,451 ms | 1,810 ms |   3,053 ms |   3,053 ms |

The timing delta is observational and network-noisy. The causal result is the elimination of detail RSC prefetches, not a claimed percentage speedup.

## 9. Direct Endpoint Benchmarks

Twenty sequential warm authenticated reads per endpoint; all responses were HTTP 200.

| Endpoint          | Rows | Bytes |       Min |    Median |       P75 |       P95 |       Max |
| ----------------- | ---: | ----: | --------: | --------: | --------: | --------: | --------: |
| Loans list        |    4 | 3,398 | 296.15 ms | 321.63 ms | 338.79 ms | 431.43 ms | 437.47 ms |
| Payment aggregate |   17 | 1,732 | 295.56 ms | 311.35 ms | 341.15 ms | 377.43 ms | 402.43 ms |
| Upcoming schedule |   57 | 4,992 | 292.87 ms | 311.98 ms | 332.86 ms | 407.83 ms | 454.72 ms |
| Owner membership  |    1 |    47 | 294.19 ms | 313.19 ms | 362.38 ms | 405.38 ms | 510.49 ms |

## 10. PostgreSQL Plans

Read-only `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` was run against the four populated query shapes. No index was added.

| Query             | Actual rows | Plan                                            | Shared hits | Planning | Execution |
| ----------------- | ----------: | ----------------------------------------------- | ----------: | -------: | --------: |
| Loans list        |           4 | Seq scan + in-memory sort                       |           1 | 0.130 ms |  0.067 ms |
| Payment aggregate |          17 | Bitmap heap using `idx_loan_payments_household` |           2 | 0.128 ms |  0.076 ms |
| Upcoming schedule |          57 | Seq scan + in-memory sort                       |           2 | 0.107 ms |  0.088 ms |
| Owner membership  |           1 | Seq scan                                        |           1 | 0.103 ms |  0.056 ms |

Verdict: PostgreSQL is fast at this fixture cardinality. Hosted HTTP latency is the dominant measured cost. These small plans do not justify speculative indexes or an RPC.

## 11. List Contract / Overfetch

`listLoans` selects the complete shared `Loan` contract, including rate, term, repayment, note, status, ownership, and financial fields. The visible row consumes a smaller subset, but `listLoans` is also used by planning/calendar flows, so narrowing it globally would be a contract change.

The list aggregate reads return 17 payment rows and 57 upcoming schedule rows, then fold totals/counts/next amount in TypeScript. That is measurable payload overfetch at larger household cardinalities, but the current populated fixture shows no database bottleneck. A list-specific read model remains a candidate only after larger production-like cardinality proves the second wave is material.

## 12. Detail Route Benchmark

Five authenticated direct navigations to one active fixture loan were run at `440x900`; the `loan-detail-tabs` milestone was used as content readiness.

| Metric           |      Min |   Median |      P75 |        P95 |        Max |
| ---------------- | -------: | -------: | -------: | ---------: | ---------: |
| Response start   | 336.6 ms | 633.6 ms | 673.5 ms | 1,202.9 ms | 1,202.9 ms |
| Detail content   | 1,179 ms | 1,771 ms | 1,772 ms |   2,729 ms |   2,729 ms |
| Browser requests |       40 |       40 |       40 |         40 |         40 |

The server trace showed 14 completed Supabase fetches per detail load:

- auth user; current and owner membership;
- loan row;
- payment aggregate plus full payment history;
- schedule count, next schedule row, and full schedule history;
- rate periods;
- accounts, household base currency, and account-ledger balances;
- layout inbox badge.

Duplicate reads are confirmed: `getLoanReadResult` aggregates payment/schedule data while the parent also loads full payment/schedule histories. This was measured and documented, not changed in this task.

## 13. Cleanup Verification

Cleanup ran with `VINHA_LOANS_FIXTURE=1 node scripts/loans-populated-fixture.mjs cleanup` and reported removal of 4 loans, 17 payments, 17 transactions, 74 schedule entries, and 5 rate periods.

Post-cleanup read-only verification:

```text
marker loans       0
all loans          0
all schedules      0
all payments       0
all rate periods   0
all accounts       12
all transactions   30
```

The account and transaction totals returned to their pre-fixture values. The fixture state file was removed.

## 14. Decision

**C — Stop Loans optimization for now.**

The requested prefetch fix is complete. The list’s second wave is parallel, direct endpoint medians are about 311–322 ms, and PostgreSQL execution is sub-millisecond. Detail duplicate reads are real, but the current five-navigation result does not establish a product-level latency failure large enough to justify a deduplication or read-model change.

## 15. Recommended Next Step

Keep the prefetch fix and collect the same list/detail measurements at a larger representative household cardinality. Revisit **B (detail deduplication)** only if the detail budget is missed or duplicate history payloads become materially large; revisit **A (one-wave read model)** only if the populated list’s W2 cost becomes material.

## 16. Raw Evidence

Commands:

```text
npm run build
VINHA_PERF_TRACE=1 npm run start -- -p 3101
VINHA_LOANS_FIXTURE=1 node scripts/loans-populated-fixture.mjs setup
VINHA_LOANS_BROWSER_LABEL=before ... node scripts/loans-browser-benchmark.mjs
VINHA_LOANS_BROWSER_LABEL=after ... node scripts/loans-browser-benchmark.mjs
VINHA_LOANS_DIRECT_BENCH=1 node scripts/loans-direct-benchmark.mjs
VINHA_LOANS_FIXTURE=1 node scripts/loans-populated-fixture.mjs cleanup
```

Evidence files:

- `scripts/loans-populated-fixture.mjs`
- `scripts/loans-browser-benchmark.mjs`
- `scripts/loans-direct-benchmark.mjs`
- `output/playwright/loans-benchmark/browser-before.json`
- `output/playwright/loans-benchmark/browser-after.json`
- `output/playwright/loans-benchmark/browser-detail.json`
- `output/playwright/loans-benchmark/direct.json`
- `output/playwright/loans-benchmark/before-server.log`
- `output/playwright/loans-benchmark/after-server.log`
- `output/playwright/loans-benchmark/loans-populated-440.png`

Source evidence:

- `modules/ledger/application/queries/list-money-products.ts` — list contract, batched aggregates, and detail overlap.
- `modules/tenancy/application/get-session-membership.ts` and `resolve-active-membership.ts` — auth/membership gate.
- `modules/tenancy/application/list-active-membership-ids.ts` — optional owner validation.
- `app/[locale]/(product)/money/loans/page.tsx` — list rendering and test IDs.
- `app/[locale]/(product)/money/loans/[id]/page.tsx` — detail `Promise.all` and history reads.
- `shared/constants/navigation.ts` — global prefetch policy.
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` — Next.js 16 Link prefetch contract.

No user credentials, service keys, or production data are included in the report.
