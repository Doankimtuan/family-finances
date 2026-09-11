# Home Investment One-Wave Read Model

## 1. Executive Summary

Status: **accepted for the Home Investment path**.

The deployed development candidate replaces the Home Investment holdings-first
fan-out with one authenticated raw-input RPC. It reduces Investment reads from
5 calls in 2 waves to 1 call in 1 wave, while keeping valuation formulas in the
existing JavaScript resolver.

All required gates passed:

- Raw-input equivalence: 20/20 paired samples matched.
- Valuation equivalence: 20/20 paired samples matched using the unchanged
  `resolveInvestmentValuation()` resolver.
- RLS/tenancy: active household, zero-investment member, non-member,
  cross-household, and anonymous probes passed.
- Direct benchmark: median improved from 403.16 ms to 204.03 ms; P95 improved
  from 450.03 ms to 242.11 ms.
- Home fetches: 18 to 14, because only the Investment family changed in this
  phase.
- Same-run Home browser median: 1,295.62 ms to 1,237.99 ms. TTFB improved from
  372.45 ms to 324.65 ms.

The migration was applied only to the linked development Supabase project. No
production deployment was performed.

## 2. Existing Investment Contract

Before this phase, `listInvestmentHomeSummary()` performed:

1. `investment_holdings` to obtain active holding and instrument IDs.
2. In parallel: `get_investment_home_summary_inputs()`,
   `market_instruments`, `market_instrument_prices`, and
   `market_currency_rates`.

That was 5 remote reads in 2 dependency waves. The Home adapter and public
`InvestmentHomeSummary` shape remain unchanged. Detail Investment pages keep
their existing queries and behavior.

The existing `resolveInvestmentValuation()` function remains the financial
authority. Its manual fallback, market pricing modes, FX handling, stale
semantics, rounding, quality, and source behavior were not moved into SQL.

## 3. Required Raw Inputs

The candidate returns one row per active holding with only persisted/raw inputs:

- Holding identity: holding ID, asset class, instrument ID, quantity, and
  remaining cost basis.
- Instrument metadata: asset class, symbol, name, exchange, currency, pricing
  mode, automatic-price support, active flag, and metadata.
- Market price: price, currency, type, date, fetched timestamp, provider,
  metadata, and update timestamp.
- FX rate: base/quote currencies, rate, date, fetched timestamp, provider, and
  update timestamp.
- Latest manual valuation: VND value, valuation date, creation timestamp,
  quantity, unit price, source, and all input-currency/rate fields.
- Operation totals: realized P/L and investment income.

No final market value, unrealized P/L, stale classification, or quality
classification is calculated by the RPC.

## 4. RPC Design

Function: `public.get_home_investment_raw_inputs()`

- No arguments; household scope is derived from the authenticated session.
- One PostgREST `POST /rest/v1/rpc/get_home_investment_raw_inputs` call.
- One SQL function execution wave for the Home Investment read.
- Stable, read-only SQL function returning raw rows.
- Existing application mapping converts flat RPC rows back into the resolver's
  existing input types.
- Existing request-local `cache(loadInvestmentHomeSummary)` is preserved.
- Public Home summary shape, route boundary, and section streaming boundary are
  unchanged.

## 5. Security Model

The function is declared `SECURITY INVOKER` with `set search_path to 'public'`.
It has no caller-supplied household argument and uses
`investment_active_household()` to derive the active household from
`auth.uid()` and active membership.

Privileges are explicit:

- `PUBLIC`: execute revoked.
- `authenticated`: execute granted.
- `anon`: no execute privilege.

Because the function is invoker-security, its table reads remain subject to the
existing RLS policies. The function does not use service-role access and does
not bypass tenancy policy.

## 6. SQL Plan

The SQL uses small, maintainable read CTEs:

- `active_holdings` filters the active household, excludes exited holdings, and
  excludes non-positive quantities.
- `household_operations` aggregates existing realized P/L and income fields for
  the active household.
- Existing instrument, price, FX, and latest-valuation indexes support the joins
  and latest manual valuation lookup.

`EXPLAIN (ANALYZE, BUFFERS)` was run in the Supabase SQL Editor through a
temporary transactional claim wrapper so the existing authenticated household
gate could execute. The candidate execution returned one result with:

```text
Planning Time: 0.011 ms
Execution Time: 12.798 ms
Buffers: shared hit=1913
```

The displayed plan is the wrapper's `Result`/function execution rather than an
expanded internal plan, but it exercises the deployed candidate read. Linked
schema lint reported existing unrelated findings in other functions; it did
not report a candidate-specific finding.

## 7. Raw-Input Equivalence

The read-only benchmark compared the old five-call raw projection with the new
one-call projection over 20 paired samples. Every sample returned the same 20
active holdings and matched holding identity, holding fields, instrument data,
price data, FX data, latest manual valuation data, and operation totals after
canonical normalization.

Result: **20/20 matches, zero mismatches**.

The one-row-per-holding flat shape increases the median response from 20,472
bytes to 28,002 bytes (+36.8%). The measured remote wall-time reduction is
still material because the old shape paid for four additional HTTP boundaries
and a second dependency wave.

## 8. Valuation Equivalence

The benchmark loaded the unchanged
`modules/investments/application/market-valuation.ts` resolver and built the
same resolver inputs from both read shapes. Both sides used the same captured
`now` value for stale/fresh comparisons.

The comparison covered each holding's Home-relevant current value, estimated
unrealized P/L, P/L percentage, source, freshness, and quality.

Result: **20/20 samples matched, zero valuation mismatches**.

No valuation formula or stale/manual/FX rule was duplicated in SQL.

## 9. RLS / Tenancy Matrix

| Probe                                      | Active membership | Existing active holdings | Candidate rows | RPC result                 |
| ------------------------------------------ | ----------------: | -----------------------: | -------------: | -------------------------- |
| Primary authenticated household            |                 1 |                       20 |             20 | HTTP 200                   |
| Authenticated member with zero investments |                 1 |                        0 |              0 | HTTP 200                   |
| Authenticated non-member                   |                 0 |                        0 |              0 | HTTP 200                   |
| Cross-household comparison                 |        no overlap |           no target rows | no target rows | passed                     |
| Anonymous                                  |               n/a |                      n/a |            n/a | HTTP 401, Postgres `42501` |

The cross-household probes found no shared primary holding and no readable
target-household rows. Anonymous execution was denied rather than returning an
empty financial result.

## 10. Direct Benchmark

Twenty alternating read-only samples were run against the linked development
project with authenticated bearer sessions. The current control and candidate
were measured on the same run.

| Metric                | Current: 5 calls / 2 waves | Candidate: 1 call / 1 wave |                   Delta |
| --------------------- | -------------------------: | -------------------------: | ----------------------: |
| Median duration       |                  403.16 ms |              **204.03 ms** | **-199.14 ms (-49.4%)** |
| P75 duration          |                  430.11 ms |                  213.65 ms |     -216.46 ms (-50.3%) |
| P95 duration          |                  450.03 ms |              **242.11 ms** | **-207.92 ms (-46.2%)** |
| Maximum duration      |                  799.55 ms |                  250.07 ms |              -549.47 ms |
| Median response bytes |                     20,472 |                     28,002 |         +7,530 (+36.8%) |
| Calls                 |                          5 |                      **1** |           **-4 (-80%)** |
| Errors                |                          0 |                          0 |                       0 |

## 11. Decision Gate

Decision: **PASS; implement the candidate for Home Investment only**.

The candidate has one call and one wave, reduces remote boundaries, improves
both median and P95 materially, preserves raw and valuation equivalence, passes
the tenancy matrix, and has acceptable PostgreSQL execution. The larger flat
payload is a known tradeoff, not a reason to reject the candidate at this
cardinality.

The decision does not authorize a broad Home aggregate, client REST migration,
formula move to SQL, region change, or another optimization phase.

## 12. Implementation

Changed for this phase:

- [home_investment_raw_inputs.sql](/Users/doantuan/Desktop/Plan/family-finances/supabase/migrations/20260911022939_home_investment_raw_inputs.sql)
  adds the invoker RPC and authenticated-only execute grant.
- [investment-constants.ts](/Users/doantuan/Desktop/Plan/family-finances/modules/investments/application/investment-constants.ts)
  centralizes the RPC and query-phase constants.
- [investment-queries.ts](/Users/doantuan/Desktop/Plan/family-finances/modules/investments/application/queries/investment-queries.ts)
  switches only the Home Investment loader to the one-call raw-input path and
  reuses the existing resolver.
- [home-investment-one-wave-benchmark.mjs](/Users/doantuan/Desktop/Plan/family-finances/scripts/home-investment-one-wave-benchmark.mjs)
  provides the read-only benchmark, equivalence checks, resolver comparison,
  and RLS probes.
- [home-product-summary-query-shape.test.ts](/Users/doantuan/Desktop/Plan/family-finances/tests/unit/home-product-summary-query-shape.test.ts)
  covers the Home query shape contract.

Savings, household consolidation, account/ledger, routes, section boundaries,
detail pages, client REST, infrastructure, and financial formulas were left
unchanged by this phase.

## 13. Live Verification

The local Next.js development server ran with `VINHA_PERF_TRACE=1` on port 3000. Headless Chromium loaded the authenticated `/vi/home` route at 440×956.
The after trace showed the new
`POST /rest/v1/rpc/get_home_investment_raw_inputs` and no Home Investment
requests to the old market/instrument/FX fan-out.

Ten successful before loads and ten successful after loads were captured in the
same local server run. The Investment section marker was visible in 10/10
before loads and 10/10 after loads. A live browser inspection also showed the
Overview and product-summary surface rendered with populated Investment data.

No financial data or application rows were written by the benchmark or browser
profiling. The only schema write was the candidate migration on the linked
development project.

## 14. Home Fetch Inventory

This phase starts from the prior household-consolidated Home baseline of 18
fetches, not the older 20-fetch pre-consolidation baseline.

| Request family         | Before |  After |  Delta |
| ---------------------- | -----: | -----: | -----: |
| Auth user              |      1 |      1 |      0 |
| `household_members`    |      2 |      2 |      0 |
| `households`           |      1 |      1 |      0 |
| `inbox_items`          |      2 |      2 |      0 |
| Accounts               |      1 |      1 |      0 |
| Jars                   |      1 |      1 |      0 |
| Liabilities            |      1 |      1 |      0 |
| Loans                  |      1 |      1 |      0 |
| Transactions           |      1 |      1 |      0 |
| Investment reads       |      5 |  **1** | **-4** |
| Account ledger RPC     |      1 |      1 |      0 |
| Savings RPC            |      1 |      1 |      0 |
| **Total Home fetches** | **18** | **14** | **-4** |

## 15. Home Performance

The paired browser samples used the current control before the production code
switch and the candidate after the switch, in the same local run and viewport.

| Metric             |      Before |           After |              Delta |
| ------------------ | ----------: | --------------: | -----------------: |
| Home wall median   | 1,295.62 ms | **1,237.99 ms** |  -57.62 ms (-4.4%) |
| TTFB median        |   372.45 ms |   **324.65 ms** | -47.80 ms (-12.8%) |
| Investment visible |       10/10 |           10/10 |          unchanged |
| Total Home fetches |          18 |          **14** |    **-4 (-22.2%)** |

The Investment direct critical-path benchmark is the attributable performance
measurement for this phase: 403.16 ms median for the old 5-call/2-wave shape
versus 204.03 ms for the new 1-call/1-wave shape. Overview and full Home were
visually verified; separate paired timing samples for those individual streamed
markers were not independently captured in this phase, so no marker timing is
claimed here.

The modest Home wall-time delta is expected: the auth gate, common first-wave
reads, account/ledger dependency, and hosted network variance remain on the
critical path.

## 16. Remaining Bottlenecks

The primary remaining Home bottlenecks are:

1. Authenticated user and membership gates establish a TTFB floor.
2. Common first-wave reads still fan out across accounts, transactions, inbox,
   jars, liabilities, loans, Savings, and household data.
3. Account IDs still precede the account-ledger RPC and owner-membership read.
4. Hosted Supabase/Auth round-trip variance is larger than the measured
   PostgreSQL execution time at this data size.

The Investment dependency wave is no longer the primary measured bottleneck.

## 17. Recommended Next Step

Stop this phase here. If lower Home latency remains necessary, the next
controlled experiment should benchmark an Account/Ledger one-wave raw-input
read model using the same contract, equivalence, RLS, and 20-sample gate. Do
not implement that next phase as part of this change.

## 18. Raw Evidence

- Branch: `codex/home-investment-one-wave`.
- Migration creation: `supabase migration new home_investment_raw_inputs`.
- Dry run showed only
  `20260911022939_home_investment_raw_inputs.sql`.
- Linked migration application showed only that candidate migration applied.
- Direct benchmark command:
  `VINHA_HOME_INVESTMENT_BENCH=1 node scripts/home-investment-one-wave-benchmark.mjs`.
- Direct benchmark result: 20 samples, current 403.16 ms median / 450.03 ms
  P95; candidate 204.03 ms median / 242.11 ms P95; raw 20/20; valuation
  20/20; anonymous denied with `42501`.
- Verification passed: `npm run build`, `npm run typecheck`, and the focused
  Home/valuation unit tests (15 tests).
- Targeted lint for changed code passed.
- Full `npm run lint` remains blocked by pre-existing `no-console` errors in
  `output/vinha-*` profiling artifacts.
- Full `npm run test` has three unrelated pre-existing failures in transaction
  pagination, app-shell spacing, and onboarding source expectations.
- `npm run format:check` reports pre-existing formatting failures in unrelated
  skill and application files.
- Home E2E smoke passed 5/6 checks; the remaining failure is the existing
  period-control focus assertion and is unrelated to this Investment read path.
- No data mutations, unrelated migrations, infrastructure changes, route
  changes, or production deployment were made.
