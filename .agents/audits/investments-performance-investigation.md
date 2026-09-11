# Investments Performance Investigation

Date: 2026-09-11  
Mode: diagnostic only; no production code, schema, financial data, or auth/RLS behavior changed.

Evidence sources:

- Source trace: `app/[locale]/(product)/money/layout.tsx` does not exist; the effective parent is `app/[locale]/(product)/layout.tsx`.
- Primary page: `app/[locale]/(product)/money/investments/page.tsx`.
- Query path: `modules/investments/application/queries/investment-queries.ts`.
- Browser: built app via `npm run build`, then `VINHA_PERF_TRACE=1 npm run start -- -p 3101`, authenticated Chromium at 440px wide.
- Dataset at measurement time: 20 holdings, 15 distinct instruments, 14 valuation rows, 20 operations, 0 lots, 1 owner-membership ID.

## 1. Executive Summary

The Investments list is page-wide blocking and does not reuse the Home one-wave RPC. A warm authenticated load executes 12 Supabase/Auth HTTP requests: 1 Auth user call, 10 Investments/PostgREST reads, and 1 product-layout inbox badge `HEAD`.

The Investments data path has two domain waves after the auth/membership gate:

```text
auth.getUser + membership resolve
  ↓
holdings + latest valuations + lots + operations + activity valuations
  ↓
owner-membership validation + instruments + prices + FX
```

The biggest measured cost is hosted Supabase request latency and the dependency wave, not PostgreSQL execution. Direct endpoint medians were approximately 284–310 ms even when PostgreSQL execution was 0.04–13.5 ms. The list’s first useful content and portfolio content became visible together; warm browser samples ranged from 1.16 s to 2.05 s in the final 10-sample batch, with median 1.67 s and p95 2.05 s. A prior warm batch was faster at median 1.10 s, confirming material hosted variance.

The first implementation target should be one list-specific, security-invoker raw-input read model for Investments. It should preserve the existing TypeScript valuation resolver, ownership/capability semantics, and RLS contract. Do not switch directly to the Home RPC: its raw contract is not sufficient for the Investments list.

## 2. Route Architecture

````text
/{locale}/money
  └─ listInvestmentHomeSummary()
       └─ get_home_investment_raw_inputs()       (Home-only context)

/{locale}/money/investments                     PRIMARY
  └─ getSessionUser + resolveActiveMembership
  └─ listInvestmentPortfolio()
       ├─ loadHoldings()
       └─ listInvestmentActivities()

/{locale}/money/investments/[id]
  ├─ getInvestmentHoldingResult(id)
  └─ listInvestmentActivities(id)

/{locale}/money/investments/[id]/buy|sell|income|valuation
  └─ InvestmentOperationPage
       ├─ listInvestmentPortfolio()
       ├─ listAccounts()
       └─ getInvestmentHolding(id) when an id exists

/{locale}/money/investments/convert
  └─ InvestmentOperationPage(CONVERSION)
       ├─ listInvestmentPortfolio()
       └─ listAccounts()

/{locale}/money/investments/new
  └─ listAccounts()

Server actions / action boundaries:

- `investment-creation-actions.ts`
- `investment-actions.ts`
- `investment-detail-actions.ts`
- `investment-input-currency-actions.ts`
- `market-instrument-actions.ts`
- `InvestmentOperationPage` is shared by buy, sell, income, valuation, and conversion routes.

Loading/error boundaries:

- List: `investments/loading.tsx`.
- Detail: `investments/[id]/loading.tsx`.
- New: `investments/new/loading.tsx`.
- No Investments-local `error.tsx`; the product error boundary is inherited from `app/[locale]/(product)/error.tsx`. Read failures also render `investment-read-error.tsx`.

## 3. Primary Target

PRIMARY TARGET:

`/{locale}/money/investments`

SECONDARY TARGETS:

- `/{locale}/money/investments/[id]`.
- `/{locale}/money/investments/[id]/buy|sell|income|valuation`.
- `/{locale}/money/investments/convert`.
- `/{locale}/money/investments/new`.

The list/hub is the correct first target because it is the highest-level Investments surface, renders the complete portfolio, and is the only route required to answer the existing Home-RPC reuse question.

## 4. Server Component / Streaming Structure

The route is page-wide blocking for investment content:

1. Product layout runs `requireProductSession()` and starts the Suspense-wrapped bottom-navigation inbox count.
2. The page calls `getSessionUser()` and `resolveActiveMembership()`.
3. Only after the page gate does it await `listInvestmentPortfolio()` alongside translations.
4. `InvestmentOverviewClient` receives the completed portfolio as serialized server props.

There is no page-level Suspense boundary around the portfolio and no section-level streaming boundary. The route fallback skeleton is visible during the wait, but it is replaced as one page result. In the browser, the shell and `[data-testid="investment-overview-client"]` became visible within the same measurement window; there was no independently streamed portfolio summary.

There is no client-side list refetch, SWR/React Query fetch, or `useEffect` refresh on initial hydration.

## 5. Remote Request Inventory

Representative warm authenticated list load; request count is by Supabase/Auth HTTP call, not local React spans.

| # | Wave | Request | Source | Class | Rows / bytes observed | Consumer |
|---:|---|---|---|---|---:|---|
| 1 | Gate | `GET /auth/v1/user` | `getSessionUser()` | AUTH | 200, body not captured in route trace | Product/page session |
| 2 | Gate | `GET /rest/v1/household_members` | `resolveActiveMembership()` | TENANCY | 1 membership | Product/page gate |
| 3 | Concurrent layout | `HEAD /rest/v1/inbox_items` | `countUnreadOpenInboxItems()` | OTHER / layout | count only | Bottom navigation badge; not blocking portfolio |
| 4 | Wave 1 | `GET /rest/v1/investment_holdings` | `loadHoldings()` | HOLDINGS | 20 rows / 10,519 bytes | Holding identity, lifecycle, basis, ownership fields |
| 5 | Wave 1 | `GET /rest/v1/investment_valuations` | `loadHoldings()` | VALUATIONS | 14 rows / 5,296 bytes | Latest manual valuation per holding |
| 6 | Wave 1 | `GET /rest/v1/investment_lots` | `loadHoldings()` | OPERATIONS / lots | 0 rows / 2 bytes | Portfolio model; not list UI |
| 7 | Wave 1 | `GET /rest/v1/investment_operations` + nested fees | `listInvestmentActivities()` | OPERATIONS | 20 rows / 17,139 bytes | Realized P/L, income, fee totals |
| 8 | Wave 1 | second `GET /rest/v1/investment_valuations` | `listInvestmentActivities()` | VALUATIONS | 14 rows; activity projection | Valuation activity construction; duplicate table read |
| 9 | Wave 2 | `GET /rest/v1/household_members` | `listActiveMembershipIds()` | OWNERSHIP | 1 row / 47 bytes | Active owner capability status |
| 10 | Wave 2 | `GET /rest/v1/market_instruments` | `loadHoldings()` | INSTRUMENTS | 15 rows / 4,547 bytes | Instrument metadata and pricing mode |
| 11 | Wave 2 | `GET /rest/v1/market_instrument_prices` | `loadHoldings()` | PRICES | 15 rows / 4,041 bytes | Current market price |
| 12 | Wave 2 | `GET /rest/v1/market_currency_rates` | `loadHoldings()` | FX | 1 row / 208 bytes | Currency conversion to VND |

The first request is an Auth remote call. Warm `getClaims()` spans were local after JWKS was cached; a cold process added JWKS fetches. The `HEAD inbox_items` request belongs to the product layout and is not Investments-specific.

## 6. Dependency Graph

```text
proxy.updateSession()
  └─ auth.getClaims()                 local warm; cold may fetch JWKS

requireProductSession()
  ├─ getSessionUser()                 GET /auth/v1/user
  ├─ getVerifiedAuthSubject()         warm local claims verification
  └─ resolveActiveMembership()        GET household_members

listInvestmentPortfolio()
  ├─ loadHoldings()
  │    ├─ investment_holdings
  │    ├─ investment_valuations      latest selected in TypeScript
  │    └─ investment_lots
  │         └─ after holdings return:
  │              ├─ owner membership validation
  │              ├─ market_instruments
  │              ├─ market_instrument_prices
  │              └─ market_currency_rates
  └─ listInvestmentActivities()
       ├─ investment_operations + investment_fees
       └─ investment_valuations      valuation activities
````

The portfolio branches start together. The market/ownership branch is blocked by holding rows because it needs instrument IDs and owner-membership IDs.

## 7. Dependency Waves

Counting the auth/membership gate, there are 3 waves. Counting Investments domain work only, there are 2 waves.

| Wave     | Calls                                                | Approximate warm server-trace behavior                                       | Blocks                                                                   |
| -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Gate     | Auth user + active membership; claims are local warm | Auth and membership were commonly 200–300 ms, with hosted outliers above 1 s | All page content                                                         |
| Domain 1 | Holdings, 2 valuation reads, lots, operations        | Warm samples commonly 213–305 ms; outliers 521–899 ms                        | Entire page because `listInvestmentPortfolio()` is awaited before render |
| Domain 2 | Owner membership + instruments + prices + FX         | Commonly 201–298 ms; hosted outliers 500–829 ms                              | Final portfolio assembly and page response                               |

The product-layout inbox `HEAD` runs concurrently under Suspense. It does not block the investment summary, but it competes for the same hosted Supabase boundary.

## 8. Production-Like Baseline

Command and environment:

```text
npm run build
VINHA_PERF_TRACE=1 npm run start -- -p 3101
```

The build passed on Next.js 16.3.1. The final baseline uses 10 warm authenticated browser loads at 440×900 after discarding the first cold sample. One additional warm sample was used to complete the 10-sample set.

| Metric                                   |   min | median |   p75 |   p95 |   max |
| ---------------------------------------- | ----: | -----: | ----: | ----: | ----: |
| Browser response start / TTFB proxy (ms) |   311 |    380 |   428 |   703 |   703 |
| Shell visible (ms)                       | 1,163 |  1,666 | 1,755 | 2,048 | 2,048 |
| Portfolio summary visible (ms)           | 1,164 |  1,666 | 1,758 | 2,051 | 2,051 |
| Full page load complete (ms)             | 1,164 |  1,666 | 1,758 | 2,051 | 2,051 |

The first cold sample was 2.90 s with a 1.52 s response start. A previous warm batch measured 1.08–1.20 s after warm-up. This variance is evidence of hosted request latency, not a stable local CPU bottleneck.

## 9. Auth / Membership

Observed behavior:

- The product layout calls `requireProductSession()`.
- The Investments page independently calls `getSessionUser()` and `resolveActiveMembership()`.
- React `cache()` deduplicates the shared session user and membership calls within the render. The route trace showed one `/auth/v1/user` and one gate membership query per page load, not one per child query.
- `getSessionMembership()` overlaps verified JWT subject resolution with `getSessionUser()` and resolves membership from the verified subject.
- `assertMoneyActionAllowed()` is request-local memoized and reused by Investments queries.
- Ownership validation is separate: `listActiveMembershipIds()` adds a second `household_members` query only when holdings contain owner IDs.

Auth is a meaningful variance source but not the best first implementation target. The current deduplication is working; auth architecture must not be changed as part of this investigation.

## 10. Financial Contract

### Raw inputs

- Holding identity: id, name, symbol, asset class, lifecycle/history status, quantity, remaining cost basis, provider/custodian, financial scope, owner membership, accounting method.
- Instrument: symbol, name, exchange, currency, pricing mode, active state, automatic-pricing support, metadata.
- Market price: price, currency, price type/date, fetched timestamp, provider, metadata.
- FX: base/quote currencies, rate/date, fetched timestamp, provider.
- Latest manual valuation: VND value, date, quantity, unit price, source, input currency/unit price/total, FX input, rate date/source.
- Operations: executed/quoted values, basis consumed/added, realized result, income kind, unit/input values, effective date, and fee values.

### Derived outputs

`resolveInvestmentValuation()` remains the single valuation authority:

- Manual fallback applies for missing/inactive/manual pricing, missing/invalid market price, invalid FX, or unsupported automatic pricing.
- Automatic unit pricing calculates quantity × price × FX and rounds to VND.
- Total-value pricing uses price × FX without quantity multiplication.
- It produces current value, estimated unrealized P/L, P/L percentage, price metadata, source, provider, freshness, and quality.
- Stale price/FX state is preserved; it is not converted into a fresh value.

`loadHoldings()` maps the resolver output into ownership-aware `InvestmentHolding` values. `loadInvestmentPortfolio()` derives totals, allocation basis points, valuation/basis coverage, realized P/L, income, and fees from the mapped holdings and activity rows.

No formula, cost-basis rule, FX rule, pricing mode, fallback, status, or ownership semantics were changed.

## 11. Existing Home RPC Reuse

The Investments hub does not reuse the Home RPC.

- Home uses `listInvestmentHomeSummary()` → `get_home_investment_raw_inputs()`.
- Investments list uses `listInvestmentPortfolio()` → multi-read `loadHoldings()` + `listInvestmentActivities()`.
- The Home RPC filters to active, positive-quantity holdings in SQL and returns latest valuation inputs plus household operation totals.
- The Investments list needs holding names, provider/custodian, lifecycle/history status, visibility, financial scope, owner membership, and both active and closed holdings. The Home RPC does not provide that complete contract and intentionally omits lots/activity history.

Read-only direct benchmark comparison:

| Shape                                    | Calls |                                         Median |      p95 |  Bytes | Equivalence                |
| ---------------------------------------- | ----: | ---------------------------------------------: | -------: | -----: | -------------------------- |
| Existing Home-style multi-read benchmark |     5 |                                       421.5 ms | 762.2 ms | 20,472 | baseline                   |
| Home raw-input RPC                       |     1 | 213.4 ms in the dedicated 20-sample comparison | 283.3 ms | 28,002 | raw 20/20; valuation 20/20 |

A separate direct 20-sample RPC run later measured a 300.8 ms median and 501.4 ms p95, confirming endpoint variance. The equivalence result is strong; contract equivalence for Investments is not established.

RLS probe was read-only and passed: primary identity returned 20 rows, a non-member returned 0, a different household member returned 0 for the target household, and anonymous RPC access returned HTTP 401 / `42501`.

## 12. Holdings

The list query reads all household holdings ordered by `created_at`, with no SQL filter for exited status or positive quantity. Active/closed classification happens in TypeScript:

- Active: lifecycle is not exited and quantity is greater than zero.
- Closed: everything else.

Measured dataset: 20 returned rows, 20 shown as active, 0 closed. The current query still over-reads closed holdings when they exist because the list route needs the closed tab.

The list needs holding identity, asset class, quantity, basis, valuation result, provider/instrument labels, freshness/quality, and ownership. It does not need lots or the full activity history to render the overview.

## 13. Market Data

After holding IDs are known, three bulk reads run in parallel:

- 15 market instruments for 15 distinct instrument IDs.
- 15 latest instrument prices.
- 1 currency rate row for the VND quote currency.

No provider APIs are called during the list request. Provider sync is separate from the read path. The client maps one price per instrument and one FX row per currency pair, then the shared resolver applies pricing-mode semantics.

The market reads are not individually slow in PostgreSQL; their hosted HTTP medians cluster around 288–292 ms.

## 14. Manual Valuations

List behavior:

- Reads all household valuation rows in one bulk query.
- Orders by valuation date and creation time descending.
- Keeps the first row per holding in TypeScript as the latest manual valuation.
- Fetches input-currency/rate fields needed by detail and valuation flows even though the list mostly needs the latest resolved value and freshness metadata.

Measured dataset: 14 valuation rows for 20 holdings. The list does not fetch per holding, but it does fetch history rather than a latest-per-holding projection.

## 15. Operations / P&L

The list reads all household `investment_operations`, ordered by effective and creation dates, including nested `investment_fees`. It does not use an operations-summary RPC or preaggregated totals.

The list folds raw activities in TypeScript to derive:

- Realized sale result.
- Investment income.
- Investment fees.

Measured dataset: 20 operation rows and 17,139 bytes. The operation endpoint had a 310.4 ms median and 511.7 ms p95 over 20 direct samples. The list UI consumes realized and income; fee totals are retained on the portfolio model but are not rendered by `investment-overview-client.tsx`.

## 16. Ownership / Capability

Ownership inputs are read from each holding's `financial_scope` and `owner_membership_id`. `listActiveMembershipIds()` validates referenced owner memberships for the same household and active state. `resolveFinancialCapabilities()` then determines read/mutate capability.

The extra membership read is a separate second-wave dependency. It must remain security-preserving. The first target must not fold ownership into a new read model without preserving:

- Household RLS.
- Active membership validation.
- Former-owner behavior.
- Personal/household visibility.
- `canMutate` capability output.

## 17. Duplicate / Overlapping Reads

| Finding                                | Evidence                                                                                                                     | Classification                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Two valuation reads on the list        | `loadHoldings()` reads latest valuation inputs; `listInvestmentActivities()` reads valuation history to construct activities | Confirmed duplicate table dependency; P1 candidate                                  |
| Lots read on list                      | `loadHoldings()` always reads lots; list UI does not use `holding.lots`                                                      | Confirmed list overfetch; P2 by wall-time evidence because the table is empty today |
| Full operation history for list totals | All operations and nested fees are fetched, then reduced in TypeScript                                                       | Confirmed overfetch/aggregation candidate; P2 until measured at larger history size |
| Full valuation history for list        | All valuation rows are fetched although only latest per holding is used in holding mapping                                   | Confirmed overfetch; P2 until a latest projection is measured                       |
| Product-layout inbox count             | `HEAD /rest/v1/inbox_items` runs with the page                                                                               | Confirmed layout dependency; not blocking investment content because of Suspense    |
| Auth/membership overlap                | Page and layout call the same cached session/membership APIs                                                                 | Not a duplicate remote call in the measured request                                 |
| Client refresh/SWR                     | No initial client fetch or refresh in the list component                                                                     | Not a problem                                                                       |
| Link prefetch                          | One controlled browser load emitted 2 RSC requests to `/en/money/investments/convert`; no detail-link prefetch was observed  | Confirmed secondary amplification; not the first target                             |

## 18. PostgreSQL Plans

Plans were run read-only with `EXPLAIN (ANALYZE, BUFFERS, SETTINGS)` using the authenticated role context.

| Read                               | Plan shape                                               | Execution | Buffers / note                                                                    |
| ---------------------------------- | -------------------------------------------------------- | --------: | --------------------------------------------------------------------------------- |
| Holdings                           | Sequential scan + sort; RLS membership predicate present | 13.496 ms | 280 shared-hit buffers                                                            |
| Valuations                         | Sequential scan + sort                                   |  1.353 ms | 247 shared-hit buffers; latest index not used for the full-household ordered read |
| Lots                               | `investment_lots_position_date_idx` index scan           |  0.052 ms | 2 buffers; 0 rows                                                                 |
| Operations                         | Household index scan + sort                              |  0.694 ms | 22 buffers                                                                        |
| Instruments                        | Hash distinct holding IDs + instrument PK nested loop    |  0.786 ms | 67 buffers                                                                        |
| Prices                             | Price-table scan + hash join to holding instrument IDs   |  0.701 ms | 23 buffers                                                                        |
| FX                                 | Bitmap scan using primary key                            |  0.039 ms | 2 buffers                                                                         |
| Owner membership                   | Semi-join with owner index                               |  1.235 ms | 9 buffers                                                                         |
| Layout inbox count                 | Bitmap heap/index scan                                   |  2.444 ms | 12 buffers                                                                        |
| `get_home_investment_raw_inputs()` | Function scan                                            | 35.528 ms | 1,357 buffers; function body is opaque from the outer plan                        |

Conclusion: PostgreSQL execution is fast enough for this dataset. The 200–700+ ms direct HTTP medians cannot be explained by 0.04–13.5 ms individual SQL execution.

## 19. Direct Benchmarks

Twenty authenticated sequential samples per endpoint; all 200, zero errors.

| Endpoint           | Rows |  Bytes |   Median |      p75 |      p95 |        Max |
| ------------------ | ---: | -----: | -------: | -------: | -------: | ---------: |
| Holdings           |   20 | 10,519 | 304.7 ms | 639.1 ms | 787.0 ms | 1,162.4 ms |
| Valuations         |   14 |  5,296 | 293.5 ms | 311.4 ms | 410.8 ms |   443.6 ms |
| Lots               |    0 |      2 | 285.5 ms | 313.4 ms | 543.8 ms |   885.0 ms |
| Operations + fees  |   20 | 17,139 | 310.4 ms | 377.3 ms | 511.7 ms |   674.1 ms |
| Instruments        |   15 |  4,547 | 288.2 ms | 300.6 ms | 357.3 ms |   432.6 ms |
| Prices             |   15 |  4,041 | 292.3 ms | 321.1 ms | 353.6 ms |   366.3 ms |
| FX                 |    1 |    208 | 283.9 ms | 298.2 ms | 361.9 ms |   480.8 ms |
| Owner membership   |    1 |     47 | 288.3 ms | 335.1 ms | 720.8 ms |   754.0 ms |
| Home raw-input RPC |   20 | 28,002 | 300.8 ms | 318.8 ms | 501.4 ms |   508.2 ms |

The endpoint data supports reducing dependency count/waves. It does not support a SQL-index-first recommendation.

## 20. Payload / Overfetch

Overall classification: HIGH OVERFETCH for the list loader.

- Holdings: MODERATE. Several fields are list-visible, but notes/accounting/detail-oriented fields are carried through the full portfolio model.
- Valuations: HIGH. Full household history and input-rate fields are read to obtain latest manual values.
- Lots: HIGH for list consumption. The list UI does not consume them; current dataset returns an empty payload but the remote dependency remains.
- Operations: HIGH. Full operations, input fields, and nested fees are read to derive three totals; the overview renders only realized P/L and income.
- Instruments/prices: MODERATE. Core display/valuation fields are needed; metadata is not central to the list.
- FX: LOW for row count and bytes; it is already a single small row.

Payload reduction is not automatically the first target. It becomes valid after measuring whether a narrower query also reduces hosted wall time. The current evidence favors wave reduction first.

## 21. Client / Post-Hydration Requests

Initial list rendering is server-owned:

- No client `fetch()` for portfolio data.
- No SWR/React Query query for the list.
- No initial `router.refresh()`.
- No market refresh after hydration.

The controlled browser network list showed one document request plus static assets and two RSC prefetch requests for `/en/money/investments/convert`. No detail RSC prefetch was observed. The Investments-specific row links do not explicitly pass the shared `PRODUCT_LINK_PREFETCH` constant; the observed convert prefetch is therefore a secondary navigation concern.

Mutating forms use server actions and may call `router.replace()`/refresh after a successful action, but those flows were not exercised because this investigation is diagnostic-only.

## 22. Detail Route Observations

The detail route starts `getInvestmentHoldingResult(id)` and `listInvestmentActivities(id)` in parallel.

Important overlap:

- `getInvestmentHoldingResult(id)` calls the same full `loadHoldings()` path for every holding, then finds one ID in memory.
- `listInvestmentActivities(id)` still reads operations and valuation history separately.
- The detail page therefore performs two valuation-table reads and loads all holdings/market data before selecting one holding.
- Detail renders activity history and valuation history, so its larger operation/valuation contract is legitimate, but the full all-holdings read is broader than the requested ID.

Five read-only detail navigations measured 1.19–1.79 s, median 1.665 s, p75 1.789 s, p95 1.793 s. An earlier list batch had a 1.096 s median, so detail was slower in that batch. A later list batch rose to the same 1.666 s median because hosted latency shifted. Treat “detail is intrinsically slower” as INCONCLUSIVE; the code has extra history and all-holdings overlap, but the current sample is too network-variable to make detail the first target.

## 23. Root-Cause Classification

| Cause                                             | Priority      | Evidence                                                                                                                  |
| ------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Hosted Supabase/Auth request latency and variance | P1            | Direct read medians ~284–310 ms; SQL execution mostly sub-14 ms; route outliers track remote-call outliers                |
| Two domain dependency waves                       | P1            | First wave must finish before IDs unlock the four market/ownership reads; page waits for final portfolio before rendering |
| Page-wide blocking of the portfolio               | P1            | Shell and portfolio became visible together; no section-level Suspense around list data                                   |
| Duplicate valuation read                          | P1/P2         | Two same-table reads per list/detail render; confirmed in every trace group                                               |
| Full operation/valuation history on list          | P2            | High overfetch confirmed; wall-time gain from narrowing is not yet measured                                               |
| Lots read on list                                 | P2            | List UI does not use lots; current payload is 0 rows, so current wall-time gain is unproven                               |
| Layout inbox `HEAD`                               | P2            | Concurrent 2–3 ms SQL / 200–900 ms HTTP; Suspense prevents it from blocking portfolio content                             |
| Link prefetch to convert                          | P2            | Two RSC requests observed; can amplify full route work, but not the primary initial-load blocker                          |
| PostgreSQL execution                              | NOT A PROBLEM | Plans: 0.039–13.496 ms for major reads; Home RPC 35.528 ms                                                                |
| Auth/membership deduplication                     | NOT A PROBLEM | One Auth user and one gate membership request per warm load; request-local cache works                                    |
| Client hydration refresh                          | NOT A PROBLEM | No initial client data fetch or refresh observed                                                                          |
| Detail route intrinsically dominates list         | INCONCLUSIVE  | Detail code is broader, but hosted variance overlaps list results                                                         |

## 24. Ranked Optimization Candidates

| Rank | Candidate                                                                                                                  | Expected gain                                                            | Confidence                                                                    | Financial risk | Security risk                                      | Complexity | Maintainability                               |
| ---: | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | -------------- | -------------------------------------------------- | ---------- | --------------------------------------------- |
|    1 | List-specific security-invoker raw-input read model that returns the complete Investments list contract in one domain wave | High; removes the measured wave and several hosted RTTs                  | High for latency shape; medium for contract design                            | Medium         | High unless RLS/capabilities are proven equivalent | Medium     | Good if it reuses the TypeScript resolver     |
|    2 | Remove list-only valuation-history and lots dependencies from the portfolio loader                                         | Low–medium                                                               | High for overfetch; low–medium for wall-time gain                             | Low            | Low                                                | Low–medium | Good if list and detail loaders are separated |
|    3 | Stop duplicate valuation reads by separating summary activity aggregation from valuation history                           | Low–medium                                                               | High for call reduction; medium for wall-time gain because calls are parallel | Low            | Low                                                | Low–medium | Good                                          |
|    4 | Narrow operations/valuation fields or move only aggregates into a read model                                               | Medium at larger history sizes                                           | Medium                                                                        | Medium         | Medium                                             | Medium     | Good if raw/final equivalence is tested       |
|    5 | Suppress Investments-specific convert prefetch                                                                             | Situational; reduces duplicate navigation work, not initial page latency | Medium                                                                        | Low            | Low                                                | Low        | Good                                          |
|    6 | Section-level streaming                                                                                                    | UX gain more certain than wall-time gain                                 | High for perceived loading; low for total wall time                           | Low            | Low                                                | Medium     | Good if boundaries remain simple              |

## 25. Recommended First Implementation

FIRST TARGET:

`modules/investments/application/queries/investment-queries.ts:listInvestmentPortfolio` and a new, narrowly scoped Supabase security-invoker read model for the Investments list contract. Do not implement it in this investigation.

CURRENT SHAPE:

- 12 warm Supabase/Auth HTTP calls including product layout.
- 9 Investments-specific PostgREST calls after auth/layout: 5 in domain wave 1 and 4 in domain wave 2.
- Two valuation reads.
- Page-wide blocking until portfolio assembly completes.
- Warm browser list content median 1.666 s in the final batch; p95 2.051 s.

TARGET SHAPE:

- One Investments list raw-input call in one domain wave, with the gate retained.
- Preserve the current TypeScript `resolveInvestmentValuation()` and portfolio derivations.
- Preserve holding identity/lifecycle/history, ownership/capability inputs, latest manual valuation, instrument/price/FX inputs, and realized/income totals.
- Expected call shape: 12 total → approximately 4 total (Auth, gate membership, layout inbox, list read), or 5 if owner capability validation must remain a separate read.
- Expected domain shape: 5 + 4 reads across 2 waves → 1 list read wave.

WHY:

- The existing Home RPC already demonstrates raw-input and valuation equivalence at 20/20 samples, but it is not contract-compatible with the Investments list.
- Individual PostgreSQL reads are fast; each removed hosted request is more valuable than a micro-optimization inside the resolver.
- The list currently waits for a second market/ownership wave before any useful portfolio content appears.
- The target addresses the measured dependency graph while leaving financial formulas, RLS, tenancy, ownership, and Auth architecture intact.

EXPECTED RISK:

MEDIUM. The latency shape is high-confidence; the risk is preserving list-specific ownership/capability and active/closed semantics in a new security-invoker contract. Required validation before implementation: raw-input equivalence, final view-model equivalence, RLS/tenancy probe, former-owner behavior, and error/fallback behavior.

No implementation was made.

## 26. Raw Evidence

### Source evidence

- `app/[locale]/(product)/layout.tsx`: product session gate and Suspense-wrapped inbox badge.
- `app/[locale]/(product)/money/investments/page.tsx`: page gate and page-wide `listInvestmentPortfolio()` await.
- `app/[locale]/(product)/money/investments/[id]/page.tsx`: parallel holding/activity detail reads.
- `app/[locale]/(product)/money/investments/investment-operation-page.tsx`: operation route loader overlap.
- `modules/investments/application/queries/investment-queries.ts`: all list/detail remote calls and derived mapping.
- `modules/tenancy/application/get-session-membership.ts`: request-local auth/membership overlap.
- `modules/tenancy/application/assert-money-action-allowed.ts`: request-local read gate.
- `modules/inbox/application/queries/review-items.ts`: product-layout inbox `HEAD` count.
- `supabase/migrations/20260911022939_home_investment_raw_inputs.sql`: Home one-wave RPC contract.
- `modules/platform/application/perf-trace.ts`: server request trace format.

### Browser baseline evidence

- Build: passed.
- Warm authenticated list samples: 10.
- Viewport: 440×900.
- Shell and portfolio visibility: same blocking window.
- Final warm list result: response-start median ~380 ms; shell/portfolio median ~1,666 ms; p95 ~2,051 ms.
- Detail samples: 5; median ~1,665 ms.
- Client post-hydration data fetches: 0.
- RSC prefetch observed: 2 convert requests in one controlled load; no detail prefetch observed.

### Direct endpoint evidence

- 20 samples per major read.
- All responses HTTP 200; zero errors.
- Largest observed list payloads: operations 17,139 bytes; holdings 10,519 bytes; Home RPC 28,002 bytes.

### PostgreSQL evidence

- `EXPLAIN (ANALYZE, BUFFERS, SETTINGS)` completed for holdings, valuations, lots, operations, instruments, prices, FX, owner membership, inbox count, and Home RPC.
- Individual read execution: 0.039–13.496 ms.
- Home RPC execution: 35.528 ms.

### Safety evidence

- No financial data mutation.
- No Supabase migration or production code change.
- No service-role client used in browser/runtime paths.
- No RLS, tenancy, Auth, valuation, P/L, FX, or pricing semantics changed.
