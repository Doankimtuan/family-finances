# Investments List One-Wave Read Model

Measured on 2026-09-11 against the linked development Supabase project. The
change is limited to `/[locale]/money/investments`; the existing detail,
mutation, Home, and Money-summary paths remain unchanged.

## 1. Executive Summary

Accepted. The Investments list now has one raw-input RPC call and one domain
wave instead of nine calls and two waves. The same TypeScript valuation and
portfolio functions remain authoritative. Twenty paired samples matched for
raw inputs, valuation output, and portfolio output. Direct candidate median
latency was 308.48 ms versus 800.16 ms current, with zero request errors.

## 2. Current List Architecture

Before the prototype, `loadInvestmentPortfolio()` combined `loadHoldings()`
and `listInvestmentActivities()`.

| Wave | Current reads                                                                       | List use                                                |
| ---- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1    | holdings, full valuations, lots, operations with nested fees, second valuation read | holding rows, latest valuation, activity-derived totals |
| 2    | active memberships, instruments, prices, FX                                         | ownership and automatic valuation inputs                |

The page blocked on the complete portfolio assembly. The page now calls
`listInvestmentListPortfolio()` only; other callers of
`listInvestmentPortfolio()` were deliberately left on the existing path.

## 3. Financial Contract

The list contract preserves holding identity, active/closed lifecycle, history
status, quantity, remaining cost basis, provider, accounting method, financial
scope, owner membership, instrument identity, pricing mode, price, FX, manual
fallback, valuation quality/freshness, realized P/L, investment income, fees,
allocation, coverage, and portfolio totals.

Derived values are still produced in TypeScript by the existing
`resolveInvestmentValuation()` and portfolio builder. No final value, P/L,
percentage, stale state, or allocation was moved into SQL.

## 4. Raw Input Contract

`get_investments_list_raw_inputs()` returns one row per visible holding:

- holding fields: id, household, name, symbol, asset class, provider,
  visibility, lifecycle/history status, quantity, cost basis, notes, scope,
  owner membership, accounting method, created timestamp;
- ownership input: owner membership active flag;
- instrument input: metadata, symbol/name/exchange/currency, pricing mode,
  automatic-price support, active flag;
- market input: latest price, currency, type, date, fetch/provider metadata;
- FX input: base/quote, rate, date, fetch/provider metadata;
- latest manual valuation input: VND value/date, quantity/unit price/source,
  original input currency/value/rate fields;
- repeated household operation aggregates: realized P/L, investment income,
  and fees total.

Raw inputs are separated from derived values. The list does not receive final
portfolio numbers from SQL.

## 5. Candidate RPC Design

The candidate is a zero-argument, `STABLE`, `SECURITY INVOKER` SQL function
with `set search_path to 'public'`. It resolves the active household through
the existing auth-aware `investment_active_household()` helper, applies the
existing table RLS, and returns a stable holding-row shape. There is no
household argument and no service-role access.

The latest valuation is selected with a per-holding lateral lookup ordered by
`valuation_date desc, created_at desc`. Operations and fees are reduced to the
three totals actually needed by the list contract.

## 6. Operation Aggregate Semantics

The SQL totals reproduce `summarizeInvestmentActivities()` exactly:

- `realized_pnl`: sum of every operation's `coalesce(realized_result_vnd, 0)`;
- `investment_income`: sum of `executed_value_vnd` only when
  `income_kind is not null`;
- `fees_total`: sum of every nested investment fee value for the household.

The adapter reads these repeated row-level household totals once and passes
them to the existing `buildInvestmentPortfolio()` function.

## 7. Security Model

The candidate function is invoker-security, stable, explicit-search-path, and
has no user-controlled household parameter. Public execute was revoked and
authenticated execute was granted. Existing RLS remains the data boundary;
the function does not bypass it.

The existing `investment_active_household()` helper remains the auth identity
resolver. It is intentionally unchanged because changing it would expand the
scope into tenancy infrastructure.

## 8. SQL Plan

The pre-change migration state was inspected and `supabase db push --dry-run
--linked` was attempted. It remains blocked by pre-existing remote/local
migration drift (`20260911055706` remote-only and `20260911055502` local-only);
no unrelated migration was applied.

Only the candidate migration was applied to linked development. No data
mutation, index, policy, or production deployment was performed.

The authenticated EXPLAIN used the active role context for a 20-row household:

```text
Function Scan on get_investments_list_raw_inputs
(cost=0.25..10.25 rows=1000 width=1411)
(actual time=25.302..25.304 rows=20 loops=1)
Buffers: shared hit=2010
Planning Time: 0.055 ms
Execution Time: 25.547 ms
```

The function scan is opaque in the top-level plan, so the direct HTTP and
equivalence measurements below are the release gates for the complete path.

## 9. Raw Equivalence

PASS: 20 of 20 paired authenticated samples matched after normalizing the
household-owner null representation (`null owner` is household-owned in the
existing adapter). Rows were canonicalized and sorted by holding id.

## 10. Valuation Equivalence

PASS: 20 of 20 samples matched while running the same fixed `now` through the
same `resolveInvestmentValuation()` implementation. This covers manual
fallback, automatic price, TOTAL_VALUE behavior, FX conversion, and stale/
quality inputs present in the fixture.

## 11. Portfolio Equivalence

PASS: 20 of 20 samples matched after the unchanged TypeScript portfolio
calculation. Active/closed grouping, quantity, basis, current value, unrealized
P/L, realized P/L, income, fees, allocation, and coverage matched.

## 12. RLS / Tenancy

PASS for the exercised matrix. The candidate returned 20 rows for the primary
active member, zero rows for an active member with no investment holdings, and
no primary rows to either ownership test identity. The non-member identity was
denied by the existing auth-household guard with no data returned. Anonymous
access returned HTTP 401 / `42501`.

No former-owner row existed in the configured fixture (`formerOwnerRows: 0`),
so that branch was not runtime-exercised; the owner active flag and existing
capability resolver remain in the application contract.

## 13. Direct Benchmark

The read-only benchmark ran 20 paired samples with the same authenticated
session, no service role, fixed valuation time, and no financial mutations.

| Metric                |      Current |  Candidate |
| --------------------- | -----------: | ---------: |
| Calls                 |            9 |          1 |
| Errors                |            0 |          0 |
| Response bytes median |       47,747 |     36,551 |
| Median                |   800.159 ms | 308.482 ms |
| P75                   |   967.808 ms | 342.370 ms |
| P95                   | 1,111.997 ms | 584.067 ms |
| Max                   | 1,527.228 ms | 652.229 ms |

Median direct latency improved 61.4%; P95 improved 47.5%; response bytes
decreased 23.4%.

## 14. Decision Gate

All requested gates passed:

1. one Investments RPC call;
2. one Investments domain wave;
3. raw equivalence 20/20;
4. valuation equivalence 20/20;
5. portfolio equivalence 20/20;
6. RLS/tenancy probe passed;
7. no financial data mutation.

The prototype is accepted and the list path is switched.

## 15. Implementation

Changed:

- `modules/investments/application/investment-constants.ts`: canonical RPC
  and query-phase constants;
- `modules/investments/application/queries/investment-queries.ts`: raw-row
  adapter, one-wave loader, and extracted portfolio builder;
- `app/[locale]/(product)/money/investments/page.tsx`: only the Investments
  list page switched to the new loader;
- `supabase/migrations/20260911130747_investments_list_raw_inputs.sql`: the
  candidate function;
- `scripts/investments-list-one-wave-benchmark.mjs`: repeatable paired,
  equivalence, direct-latency, and tenancy benchmark.

Untouched by this switch: Home RPC, Money investment summary, detail routes,
buy/sell/income/valuation/conversion mutations, and other list callers.

## 16. Fetch Inventory Before vs After

| Scope                        | Before | After |
| ---------------------------- | -----: | ----: |
| Total page fetches           |     12 |     4 |
| Investments-specific fetches |      9 |     1 |
| Investments domain waves     |      2 |     1 |

After the switch, the traced page has one auth/session or membership-related
shared path, one inbox HEAD check, and one Investments RPC. No duplicate
valuation read, lots read, full operations read, or second-wave market lookup
is hidden behind the list adapter.

## 17. Browser Performance Before vs After

The existing investigation baseline was approximately 1,666 ms warm content
median and 2,050 ms warm P95. Ten authenticated content-ready browser loads
after the switch at 440 px measured:

```text
samples: 1561, 1125, 1291, 1335, 1288, 1410, 1500, 1134, 1271, 1279 ms
median: 1288 ms
p75: 1410 ms
p95: 1561 ms
max: 1561 ms
```

The page-wide result is a meaningful improvement but remains above the
500–800 ms heuristic because auth, membership resolution, inbox checking, and
hosted request variance dominate the remaining page time.

## 18. Functional Validation

Read-only browser checks passed in Chromium:

- portfolio summary rendered;
- active tab rendered `Active (20)` and closed tab rendered `Closed (0)`;
- ownership labels (`Personal · Partner`) rendered;
- stale and NAV valuation states rendered;
- missing-price state was not available in this fixture;
- first list item navigated to its detail route successfully;
- no runtime or hydration errors were observed on the list/detail flow;
- no horizontal overflow at 390, 440, 768, or 1280 px;
- light/dark color schemes and reduced-motion mode were exercised at the same
  viewport matrix.

The red dev overlay count seen in the development screenshot represented the
intentional `vinha.perf` console instrumentation entries, not hydration or
application exceptions.

## 19. Remaining Bottlenecks

The Investments domain is no longer call-amplified. Traced warm loads show
roughly 300–700 ms auth and membership requests, a 300–600 ms inbox HEAD, and
roughly 300–500 ms candidate RPC time. These are shared page/session or hosted
request costs, not additional Investments list reads.

## 20. Recommended Next Step

STOP INVESTMENTS optimization; revisit shared auth/membership or prefetch costs only as a separate measured task if page-wide latency becomes a user-visible problem.

## 21. Raw Evidence

Benchmark command:

```text
VINHA_INVESTMENTS_LIST_BENCH=1 \
VINHA_INVESTMENTS_LIST_BENCH_REPEATS=20 \
node scripts/investments-list-one-wave-benchmark.mjs
```

Compact benchmark result:

```json
{
  "repeats": 20,
  "current": {
    "medianMs": 800.159167,
    "p95Ms": 1111.997042,
    "bytes": 47747,
    "calls": 9,
    "errors": 0
  },
  "candidate": {
    "medianMs": 308.4815,
    "p95Ms": 584.067458,
    "bytes": 36551,
    "calls": 1,
    "errors": 0
  },
  "raw": "20/20",
  "valuation": "20/20",
  "portfolio": "20/20",
  "primary": {
    "activeMemberships": 1,
    "activeHoldings": 20,
    "candidateRows": 20,
    "status": 200
  },
  "zeroInvestmentMember": {
    "activeMemberships": 1,
    "candidateRows": 0,
    "status": 200
  },
  "nonMember": { "candidateRows": 0, "status": 400, "errorCode": "P0001" },
  "anonymous": { "status": 401, "errorCode": "42501" }
}
```

SQL metadata evidence: `security_definer=false`, `provolatile=s`,
`anon_execute=false`, `authenticated_execute=true`.

Focused verification:

```text
npx eslint <changed TypeScript/page/benchmark files>       PASS
npx prettier --check <changed TypeScript/benchmark files>  PASS
npm run typecheck                                          PASS
npm run test -- --run tests/unit/investment-portfolio-orchestration.test.ts PASS (9/9)
git diff --check                                           PASS
```

Repository-wide `npm run lint` and `npm run test` still report four unrelated
pre-existing test failures and ten unrelated `output/` profile-script lint
errors; none reference the changed Investments implementation. The complete
unit run otherwise passed 227 test files / 1,446 tests.

Browser evidence was collected with the Playwright CLI against the running
authenticated app; the final 1280 px dark-mode screenshot is stored under
`.playwright-cli/` as generated tool output.
