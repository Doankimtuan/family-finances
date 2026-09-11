# Home Investment Read Model Optimization

## 1 Executive Summary

Status: **BENCHMARK_REJECTED**.

The current Home Investment path makes five read-only Supabase requests in two dependency waves. A safe prototype reused the already-deployed `get_investment_home_summary_inputs()` RPC as the first read, eliminating the duplicate `investment_holdings` request while keeping the existing market reads and shared JavaScript valuation resolver.

The prototype was rejected for production because it did not remove a dependency wave and did not improve the paired direct benchmark: 20-sample median was 638.1 ms for the current five-call shape versus 669.1 ms for the four-call prototype. The existing RPC rows were financially equivalent to the current holdings projection in all 20 read-only comparisons. No source code, migration, schema, RLS policy, financial data, or infrastructure was changed.

The fresh five-load Home control reproduced 20 server-side Supabase/Auth fetches, 5/5 Investment section visibility, and no write RPCs. Savings remained on its existing single RPC path.

## 2 Current Investment Architecture

The Home adapter calls `listInvestmentHomeSummary()` from `modules/home/application/home-product-summary-adapters.ts`. The implementation is in `modules/investments/application/queries/investment-queries.ts:620`.

The current request graph is:

1. Gate with `assertMoneyActionAllowed()`.
2. Read active `investment_holdings` for the gated household.
3. When holdings exist, start four reads in parallel:
   - `get_investment_home_summary_inputs()` for latest manual valuation inputs and operation totals.
   - `market_instruments` for instrument metadata.
   - `market_instrument_prices` for current prices.
   - `market_currency_rates` for VND conversion rates.
4. Reuse `resolveInvestmentValuation()` from `modules/investments/application/market-valuation.ts:183` for automatic, manual, FX, stale-price, total-value, and P/L semantics.
5. Aggregate the resolved values into the Home summary.

The first holdings read is an ID/data dependency for the four-request second wave. In the fresh Home trace the second wave started 1–3 ms after the holdings response, so the application is already overlapping the four requests as intended; the cost is the extra remote boundary and the critical-path tail of the second wave.

## 3 Home Fetch Inventory Diff

The fresh five-run server trace counted exactly 20 Supabase/Auth fetches per Home load.

| Request family               | Pre-Savings P8 | Post-Savings current |  Diff | Explanation                                                     |
| ---------------------------- | -------------: | -------------------: | ----: | --------------------------------------------------------------- |
| `/auth/v1/user`              |              1 |                    1 |     0 | Auth gate                                                       |
| `household_members`          |              2 |                    2 |     0 | Membership gate and owner-membership read                       |
| `households`                 |              2 |                    3 |    +1 | Current `HomeTopBar` also resolves `getHouseholdPreferences()`  |
| Savings legacy reads         |              2 |                    0 |    -2 | Removed by the Savings phase                                    |
| `get_home_savings_summary()` |              0 |                    1 |    +1 | Replaces the two Savings reads                                  |
| Investment reads             |              5 |                    5 |     0 | Holdings plus summary/instrument/price/FX                       |
| Other Home reads             |             10 |                   10 |     0 | Accounts, ledger, jars, liabilities, loans, transactions, inbox |
| **Total**                    |         **20** |               **20** | **0** | Savings reduction is offset by the current preference read      |

Current per-load inventory:

| Path                                              |  Count |
| ------------------------------------------------- | -----: |
| `/auth/v1/user`                                   |      1 |
| `/rest/v1/household_members`                      |      2 |
| `/rest/v1/households`                             |      3 |
| `/rest/v1/inbox_items`                            |      2 |
| `/rest/v1/accounts`                               |      1 |
| `/rest/v1/jars`                                   |      1 |
| `/rest/v1/liabilities`                            |      1 |
| `/rest/v1/loans`                                  |      1 |
| `/rest/v1/transactions`                           |      1 |
| `/rest/v1/investment_holdings`                    |      1 |
| `/rest/v1/rpc/get_investment_home_summary_inputs` |      1 |
| `/rest/v1/market_instruments`                     |      1 |
| `/rest/v1/market_instrument_prices`               |      1 |
| `/rest/v1/market_currency_rates`                  |      1 |
| `/rest/v1/rpc/get_account_ledger_balances`        |      1 |
| `/rest/v1/rpc/get_home_savings_summary`           |      1 |
| **Total**                                         | **20** |

## 4 Fresh Baseline

The production build was served locally with `VINHA_PERF_TRACE=1`. The authenticated profiler used a 390×844 viewport, warmed the routes, then captured five Home document loads. The run was read-only.

| Metric                            | Five fresh samples                       |       Median |
| --------------------------------- | ---------------------------------------- | -----------: |
| Home wall time                    | 1,864 / 1,390 / 1,249 / 1,766 / 1,360 ms | **1,390 ms** |
| TTFB                              | 439 / 485 / 338 / 322 / 384 ms           |   **384 ms** |
| Load event                        | 1,312 / 965 / 912 / 1,291 / 1,182 ms     | **1,182 ms** |
| Server-side Supabase/Auth fetches | 20 / 20 / 20 / 20 / 20                   |       **20** |
| Investment section visible        | 5 / 5 / 5 / 5 / 5                        |      **5/5** |

The previous post-Savings five-load reference was 1,420 ms Home median and 373 ms TTFB. The fresh control is within normal run-to-run variance and is not an attributable optimization result.

## 5 Existing Valuation Contract

The Home path intentionally shares the Investments product valuation resolver. The contract is:

- Reporting currency is VND.
- Active, auto-priced instruments use the latest market price and a valid VND or currency-pair FX rate.
- `TOTAL_VALUE` instruments use the price as the total holding value; other pricing modes multiply quantity × price × FX and round to VND.
- Unsupported, inactive, manual, missing, invalid, or FX-incomplete market inputs fall back to the latest manual valuation, if present.
- Unrealized P/L is derived from current value minus remaining cost basis, with null preserved when either side is incomplete.
- Market and FX freshness affect `current` versus `stale` quality, not the underlying automatic value.
- Operation totals come from the existing RPC and are returned as realized P/L and investment income.

The prototype therefore changed only the source of the holding rows. It did not move valuation formulas into SQL, change P/L, change FX handling, change stale thresholds, or alter displayed financial data.

## 6 Consolidation Options

| Option                                              | Shape                                                                                 | Benefit                                                                                        | Risk / decision                                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Complete SQL valuation summary                   | One RPC returns final Home totals                                                     | Could reach 1 call and 1 wave                                                                  | Duplicates `resolveInvestmentValuation()` semantics, including manual fallback and stale quality; rejected without a stronger equivalence harness |
| B. Reuse existing summary RPC as the holding source | RPC first, then instruments/prices/FX in parallel                                     | 5 calls → 4 calls; preserves the resolver                                                      | Still 2 waves; measured median regressed; benchmark rejected                                                                                      |
| C. New invoker read-model RPC for all raw inputs    | One RPC returns holdings, latest valuations, market rows, rates, and operation totals | Could remove the entire Investment dependency wave while preserving client valuation semantics | Requires a new production function and careful RLS/index/shape validation; not justified by the current B result                                  |
| D. Application-only deduplication                   | Cache or share existing promise across Home consumers                                 | Could remove duplicate callers if a duplicate exists                                           | Current trace shows one Investment set per Home load; no measured duplicate to remove                                                             |

## 7 Selected Prototype

Option B was benchmarked as a read-only application-shape prototype without editing production code:

- First read: `get_investment_home_summary_inputs()`.
- Derive instrument IDs from the RPC rows.
- Second wave: the existing `market_instruments`, `market_instrument_prices`, and VND FX reads in parallel.
- Keep the existing shared valuation resolver and aggregation code unchanged conceptually.

This was the smallest safe candidate because the deployed RPC already returns the same active holding identity, asset class, instrument ID, quantity, and remaining cost basis used by the current first read.

## 8 SQL / RPC Definition

No new SQL or RPC was deployed.

The measured existing function is defined in `supabase/migrations/20260905070501_query_performance_hotpaths.sql:4`:

- `public.get_investment_home_summary_inputs()` returns one row per active holding.
- It filters through `public.investment_active_household()`, `lifecycle_status <> 'exited'`, and `quantity > 0`.
- It joins the latest valuation per holding using `valuation_date DESC, created_at DESC`.
- It aggregates realized P/L and investment income from household operations.
- It is SQL-language, `SECURITY INVOKER`, and fixes `search_path` to `public`.

The prototype used this existing function only as a replacement source for the already-fetched holding rows. It did not create a temporary function, alter the remote schema, or add a migration.

## 9 EXPLAIN ANALYZE

The deployed RPC was inspected read-only in the Supabase SQL Editor with an authenticated JWT subject set in a materialized CTE so the existing `investment_active_household()` gate could run.

| Plan item                 |           Result |
| ------------------------- | ---------------: |
| Result rows               |               20 |
| Function scan actual time | 10.348–10.350 ms |
| Total planning time       |         0.123 ms |
| Total execution time      |        11.146 ms |
| Shared buffers            |       1,484 hits |
| Security definer          |            false |
| Search path               |         `public` |

The measured PostgreSQL execution is small relative to the 260–800 ms HTTP request samples. The candidate decision is therefore primarily about remote request boundaries and dependency waves, not SQL execution time.

## 10 Financial Equivalence

**PASS for the measured prototype shape.**

Twenty read-only comparisons queried the current `investment_holdings` projection and the existing summary RPC. Every sample returned 20 rows on both paths, with zero canonical row mismatches across holding ID, asset class, instrument ID, quantity, and remaining cost basis.

Because the prototype retains the same market reads and the same `resolveInvestmentValuation()` implementation, the measured source substitution does not change current value, manual fallback, stale quality, FX conversion, or P/L semantics. No production financial data was written or mutated.

## 11 RLS / Tenancy Matrix

**PASS for the tested matrix.**

| Check                                                 | Result                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Anonymous RPC call                                    | Denied with Postgres `42501`                                                    |
| Authenticated E2E household                           | Allowed; 20 rows for the active household                                       |
| Two representative authenticated ownership identities | Allowed by function grant but returned 0 rows; no cross-household rows observed |
| Function security mode                                | Invoker (`prosecdef = false`)                                                   |
| Function grant                                        | `authenticated` has `EXECUTE`; `anon` is not granted                            |
| Investment holdings / valuations / operations RLS     | Enabled; one select policy per table                                            |
| Market instruments / prices / FX RLS                  | Enabled; authenticated select policies                                          |

The diagnostic did not provision a new cross-household fixture. No service-role client was used for the runtime probes, and the existing function remained unchanged.

## 12 Prototype Benchmark

The direct benchmark used the same authenticated E2E identity, native Supabase client, and 20 sequential samples per shape. All requests were read-only and all calls succeeded.

| Shape                  | Remote calls | Waves | Median total |      P75 |      P95 |        Max |
| ---------------------- | -----------: | ----: | -----------: | -------: | -------: | ---------: |
| Current holdings-first |            5 |     2 | **638.1 ms** | 747.9 ms | 933.3 ms | 1,429.5 ms |
| Prototype RPC-first    |            4 |     2 | **669.1 ms** | 692.2 ms | 717.3 ms | 1,118.7 ms |

Wave detail:

| Shape                  | First wave median | Second wave median |
| ---------------------- | ----------------: | -----------------: |
| Current holdings-first |          280.0 ms |           342.5 ms |
| Prototype RPC-first    |          307.9 ms |           333.6 ms |

The prototype removed one boundary but not one wave and was 31.0 ms slower at the median. Its lower P95 is not enough to meet the phase rule because the primary median did not improve and the dependency graph did not collapse. No implementation was authorized by the evidence.

## 13 Implementation

**None.**

The source tree remains on the current holdings-first Investment path. No migration, RPC, route, cache, region, UI, valuation, RLS, or financial-data change was made in this phase.

## 14 Live Verification

The live checks completed without mutation:

- Fresh five-load Home profile: 5/5 Investment sections visible.
- Every Home load: 20 server-side Supabase/Auth fetches.
- Every Home load: one `get_investment_home_summary_inputs()` call and zero legacy Savings reads.
- Profiler write-RPC scan: no Savings lifecycle write RPCs and no other write operation observed in the profiled Home/Savings flow.
- Direct current and prototype samples: 40 total shape runs, all successful.
- RPC equivalence samples: 20/20 matched holding projections.
- Anonymous access: denied; authenticated access: scoped to the active household.

There is no separate post-implementation verification because the benchmark rejected the candidate before production implementation.

## 15 Home Performance Before vs After

There is no treatment run. The values below distinguish the post-Savings reference from the fresh same-shape control.

| Metric                     | Post-Savings reference | Fresh current control | Attributable change                |
| -------------------------- | ---------------------: | --------------------: | ---------------------------------- |
| Home wall median           |               1,420 ms |              1,390 ms | None; no Investment implementation |
| Home TTFB median           |                 373 ms |                384 ms | None; run variance                 |
| Total Home fetches         |                     20 |                    20 | None                               |
| Investment calls           |                      5 |                     5 | None                               |
| Investment waves           |                      2 |                     2 | None                               |
| Investment section visible |                    5/5 |                   5/5 | None                               |

## 16 Remaining Bottlenecks

The remaining primary bottlenecks are unchanged:

1. Home’s total remote fan-out remains 20 Supabase/Auth fetches.
2. The Investment second wave has a five-run Home critical-path median of 792 ms from holdings start to the last market/summary response; FX was the slowest member in three of five runs.
3. The Home trace has three `households` reads, so the Savings reduction did not lower the total fetch count.
4. The local Vietnam-to-Supabase HTTP floor is approximately 275 ms median from the prior request-path benchmark, while tested PostgreSQL execution is single-digit to low-double-digit milliseconds.

## 17 Recommended Next Step

Do not ship the four-call RPC-first change.

If Investment remains the next target, prototype Option C in a controlled branch only after defining a raw-input RPC contract that returns all data required by `resolveInvestmentValuation()`—including instrument pricing mode, price metadata, FX metadata, latest manual valuation inputs, and operation totals. Require a one-wave result, direct 20-sample median improvement, full financial equivalence, and authenticated/cross-household RLS evidence before deploying a migration.

The lower-risk immediate opportunity outside this phase is to investigate the third `households` read and the Home-wide fan-out, because Investment-only deduplication did not meet the required wave-removal threshold.

## 18 Raw Evidence

Artifacts and raw observations:

- Fresh profile: `/tmp/vinha-rsc-profile-p8/profile.json`.
- Fresh server trace: `/tmp/vinha-perf-p8-server.log`.
- Fresh write scan: `/tmp/vinha-rsc-profile-p8/write-rpc-scan.json`; `writes: []`.
- Home server fetch counts per run: `20, 20, 20, 20, 20`.
- Investment Home spans, in milliseconds:

  | Run | Holdings | Summary RPC | Instruments | Prices |  FX | Holdings→market start | Investment critical path |
  | --- | -------: | ----------: | ----------: | -----: | --: | --------------------: | -----------------------: |
  | 1   |      277 |         277 |         281 |    510 | 509 |                  3 ms |                   792 ms |
  | 2   |      282 |         267 |         266 |    272 | 277 |                  1 ms |                   561 ms |
  | 3   |      284 |         297 |         259 |    276 | 268 |                  2 ms |                   583 ms |
  | 4   |      274 |         290 |         287 |    273 | 693 |                  2 ms |                   969 ms |
  | 5   |      271 |         265 |         263 |    269 | 521 |                  2 ms |                   794 ms |

- Direct current total samples: `1429.5, 933.3, 747.9, 638.1, 585.7, 555.2, 641.5, 607.6, 608.0, 603.8, 622.2, 557.1, 785.1, 614.5, 643.9, 697.7, 836.7, 559.5, 756.1, 737.3` ms.
- Direct prototype total samples: `657.4, 1118.7, 595.7, 630.5, 686.9, 580.1, 623.6, 715.1, 717.3, 669.9, 669.1, 647.9, 692.2, 625.6, 612.0, 713.5, 688.1, 606.5, 702.5, 684.1` ms.
- Direct shape results: current `5 calls / 2 waves / 638.1 ms median`; prototype `4 calls / 2 waves / 669.1 ms median`.
- Equivalence results: `20 samples`, `20 current rows`, `20 RPC rows` each sample, `0 mismatches`.
- Existing RPC plan: function scan `10.348–10.350 ms`, total execution `11.146 ms`, shared hit `1484`, authenticated rows `20`.
- No production financial data mutations, unrelated migrations, or infrastructure changes.
