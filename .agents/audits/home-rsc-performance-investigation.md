# Home RSC Performance Investigation

## 1. Executive Summary

The current authenticated Home document has a **1,576 ms median load time** and a **437 ms median TTFB** in the final P8 recapture. The focused P5 Home recapture, after removing the old inbox-enrichment tail, measured **1,119 ms median load**. The older approximately 3-second symptom was real, but it was not caused by RSC serialization or slow PostgreSQL execution.

The primary cause is the number of hosted Supabase/Auth round trips on the Home critical path: **20 fetches per request**, spread across an authentication gate, a broad first data wave, and several legitimate ID-dependent second-wave reads. Normal hosted request times are approximately 253–299 ms, with 400–811 ms contention outliers. Eager authenticated Link prefetch amplified the original symptom historically; it is now disabled on the relevant product surfaces and did not create a Home stampede in P8.

Supabase/PostgreSQL execution is **fast at the measured dataset size**: prior plans for the hottest reads were approximately 0.06–1.6 ms, and a 10,000-transaction fixture remained approximately 4–9 ms. The exact aggregate database time for the current Home request was not emitted by the application trace, so the database percentage is not directly measurable from this run.

RSC is **partially involved**, because the server component tree determines the fan-out and dependency waves, but RSC itself is not the main bottleneck. Moving Home to browser-side REST/API fetching is **not recommended**: it would move the same Supabase calls to the client and add or expose another network hop. The only justified next optimization, if lower latency is required, is a controlled benchmark of a read-only aggregate that collapses the remaining ID-dependent Home waves.

## 2. Scope and Test Environment

| Field             | Value                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Scope             | Diagnostic-only Home RSC/server-render performance investigation                                                  |
| Git commit        | f9eb0cd84a234b19f1daf6c638d00a56bd59b8f3                                                                          |
| Next.js           | 16.3.1                                                                                                            |
| React / React DOM | 19.2.3                                                                                                            |
| Node.js           | v24.18.0                                                                                                          |
| Build mode        | next build followed by next start; Turbopack build                                                                |
| Browser           | Headless Chromium                                                                                                 |
| Viewport          | 390 × 844                                                                                                         |
| Route             | /vi/home                                                                                                          |
| Supabase project  | family-finances-2, hosted Supabase                                                                                |
| Supabase region   | ap-southeast-2                                                                                                    |
| Runtime region    | Local Next.js process on 127.0.0.1; deployed runtime region unknown                                               |
| Test date         | 9 Sep 2026 for P8 measurements; report written 10 Sep 2026                                                        |
| Dataset           | Existing signed-in household from the dedicated E2E account; household and user identifiers intentionally omitted |
| Sample method     | Warm-up discarded; three document loads per route                                                                 |
| Instrumentation   | Existing gated VINHA_PERF_TRACE=1 server fetch/span trace plus browser Navigation Timing and request collection   |
| Data safety       | No household creation, financial writes, lifecycle writes, or mutation actions                                    |
| Current worktree  | Current staged changes are UI-only; no Home server/data-flow changes were introduced by this investigation        |

The current working tree also passed a fresh production build:

- next build completed successfully.
- TypeScript compilation completed successfully.
- Static generation completed 98/98 routes.

No production behavior or persisted data was changed by this investigation. Existing profiler and trace artifacts are referenced as evidence; the production application was not modified for this report.

## 3. Home Architecture Map

The actual server dependency tree is:

    /[locale]/(product)/home/page.tsx
    ├── await params, setLocale
    ├── getSessionUser()
    ├── resolveActiveMembership(user.id)
    ├── await searchParams
    └── Promise.all
        ├── getTranslations()
        ├── getHomeDashboard(period)
        │   ├── getRealPosition()
        │   │   ├── households: base_currency
        │   │   ├── accounts
        │   │   ├── listActiveMembershipIds() when owner ids exist
        │   │   └── get_account_ledger_balances(account ids)
        │   ├── getPlanPulse()
        │   │   ├── households: plan settings
        │   │   └── jars with embedded jar_plans
        │   ├── getOpenInboxAttention()
        │   │   └── inbox_items: count and unmapped-expense flag
        │   └── listTransactionsForDateRange()
        │       └── transactions for the selected Home period
        ├── getHomeSavingsSummary()
        │   ├── savings
        │   └── saving_cycles by saving ids
        ├── getHomeInvestmentSummary()
        │   ├── investment_holdings
        │   ├── get_investment_home_summary_inputs
        │   ├── market_instruments by instrument ids
        │   ├── market_instrument_prices by instrument ids
        │   └── market_currency_rates for VND
        ├── getHomeLoanSummary()
        │   └── loans
        ├── getHomeDebtSummary()
        │   ├── liabilities
        │   └── household_members for owner membership ids when needed
        └── getHouseholdPreferences()
            └── households: name, locale, timezone, base_currency

The product layout runs before the Home page:

    proxy.ts
    └── updateSession()
        └── auth.getClaims()

    /[locale]/(product)/layout.tsx
    └── requireProductSession()
        ├── getSessionUser()
        │   └── auth.getUser()
        └── resolveActiveMembership()
            └── household_members

The layout also renders ProductNavigation inside Suspense. Its unread badge issues a separate HEAD request to inbox_items and can overlap the Home data work.

React cache() is request-local. It deduplicates the repeated session, membership, and query-helper calls within one request; it does not provide cross-request caching.

## 4. Request Timeline

The median Home shape is a gate followed by a broad parallel wave and then ID-dependent reads:

    Browser request
      │
      ├─ proxy auth.getClaims                         1–2 ms warm
      │
      ├─ product layout: auth.getUser  ∥ membership.resolve
      │                                                  critical max ≈ 411 ms median
      │
      ├─ first domain wave                              starts after the gate
      │   ├─ accounts, jars, loans, holdings
      │   ├─ liabilities, savings, transactions
      │   ├─ inbox_items GET
      │   └─ households projections
      │                                                  usually ≈ 253–299 ms
      │
      ├─ unread inbox HEAD                              overlaps the domain wave
      │
      ├─ ID-dependent second wave
      │   ├─ saving_cycles
      │   ├─ account ledger-balance RPC
      │   ├─ market instruments, prices, currency rates
      │   ├─ investment summary RPC
      │   └─ owner-membership ids when account owners exist
      │                                                  ≈ 256–630 ms per sampled request
      │
      ├─ RSC render, HTML/Flight transfer, hydration assets
      │
      └─ browser load event                           1,576 ms median

The quiet Home r3 trace shows the intended shape:

    auth.getClaims              1 ms
    auth.getUser              290 ms
    membership.resolve        284 ms, overlapping getUser
    first domain wave         approximately 263–299 ms
    ID-dependent wave         approximately 256–269 ms
    browser load              1,247 ms

The slower Home r1 and r2 samples contain 540–811 ms individual hosted fetches. Those samples increase total load time without introducing a new application dependency.

## 5. Browser Measurements

P8 measured full document loads with page.goto. These are the best current end-to-end Home RSC/document measurements. A separate current client-side click-navigation median was not captured in P8; the server call graph is the same for the Home RSC response.

| Scenario                              |             Run 1 |             Run 2 |             Run 3 |       Median |                                  TTFB |                                                      Size |
| ------------------------------------- | ----------------: | ----------------: | ----------------: | -----------: | ------------------------------------: | --------------------------------------------------------: |
| Home document load                    |          1,576 ms |          1,830 ms |          1,247 ms | **1,576 ms** | 481 / 437 / 309 ms; median **437 ms** |               78,590 encoded bytes; 369,698 decoded bytes |
| Earlier focused P5 Home load          |          1,017 ms |          1,119 ms |          2,077 ms | **1,119 ms** | 303 / 324 / 467 ms; median **324 ms** |           P5 payload was not materially larger or smaller |
| Historical pre-optimization Home load | measured baseline | measured baseline | measured baseline | **2,746 ms** |                     median **780 ms** | approximately 307 KB in the first historical Home profile |

The P8 Home rows are 1,247 / 1,576 / 1,830 ms, with a final median of 1,576 ms. The P5 median is retained as a focused comparison, not substituted for the final regression median.

The earlier 2,746 ms baseline is not a current regression target. Between that baseline and P8, authenticated Link prefetch was reduced, auth/membership overlap was added, and the Home inbox path was changed to the lightweight attention projection.

## 6. Server Timing Breakdown

The existing trace emits fetch/span elapsed time, not a complete per-component render profile. The following table therefore distinguishes measured HTTP/span time from inferred orchestration time.

| Stage                            |                                                                             Measured timing |                         Share of current 1,576 ms median | Interpretation                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------: | -------------------------------------------------------: | ----------------------------------------------------------------------------- |
| Warm proxy auth.getClaims        |                                                                                      1–2 ms |                                           less than 0.2% | Not a bottleneck                                                              |
| Authenticated product gate       |               per-run max 442 / 411 / 290 ms; median of per-run maxima approximately 411 ms | approximately 26% as a wall-time reference, not additive | auth.getUser and membership overlap                                           |
| First Home domain wave           |                                                   usually 253–299 ms; outliers up to 722 ms |                   approximately 16–19% for a normal wave | Parallel reads; one slow fetch can extend the wave                            |
| ID-dependent second wave         |                      approximately 256–630 ms in P8; quiet Home r3 approximately 256–269 ms |                 approximately 16–40% depending on sample | Real dependency on returned ids; not the old inbox-enrichment tail            |
| HTTP fan-out overlap             |                                                                      20 fetches per request |                                      dominant multiplier | Each fetch includes hosted network, PostgREST/Auth, server, and database time |
| PostgreSQL execution             | individual hottest reads 0.06–1.6 ms in prior plans; 4–9 ms on a 10,000-transaction fixture |             individually less than 0.1% of the Home load | Aggregate current-request DB time was not emitted                             |
| RSC serialization / local render |                                                                 not separately instrumented |                                               unmeasured | Payload size and local transfer do not indicate a material bottleneck         |
| Browser load tail                |                                                                        included in 1,576 ms |                                    unallocated remainder | Includes final server rendering, transfer, and hydration/static assets        |

The percentages above are not additive because waves overlap and the browser load event includes more than the server fetch span. The measured causal statement is: one auth gate plus two data waves consume the critical path, while individual database execution times are orders of magnitude smaller than hosted request elapsed times.

## 7. Auth Timing

The current auth shape is overlapping, not the historical getUser-then-membership series.

Warm Home r3:

| Span/request                   |     Start | Duration |       End | Relation                     |
| ------------------------------ | --------: | -------: | --------: | ---------------------------- |
| auth.getClaims                 | 50,599 ms |     1 ms | 50,600 ms | Proxy; warm local claim path |
| auth.getUser                   | 50,602 ms |   290 ms | 50,892 ms | Product layout gate          |
| membership.resolve             | 50,608 ms |   284 ms | 50,892 ms | Started before getUser ended |
| GET /auth/v1/user              | 50,605 ms |   284 ms | 50,889 ms | Under getUser span           |
| GET /rest/v1/household_members | 50,609 ms |   282 ms | 50,891 ms | Under membership span        |

Across all 18 warm product documents in P8:

- getClaims was warm at 1–2 ms.
- Each Home request had one getUser and one layout membership resolve.
- Membership began before getUser completed.
- TTFB tracked max(getUser, membership), not their sum.

Auth is therefore a meaningful TTFB floor, approximately 411 ms in the median-of-per-run-max view, but it is not the complete 1,576 ms Home load and is not currently a sequential 700 ms auth chain.

## 8. Database Query Inventory

Rows were not emitted by the existing safe trace, so the Rows column is marked not instrumented rather than guessed. Durations are HTTP/span elapsed times from the three P8 Home samples, not PostgreSQL execution times. Start offsets are relative to the first Home domain wave and are approximate because the trace uses server-log correlation rather than a request id.

| Query/function                         | Caller                      | Table/RPC                              |           Calls per request | Rows             |                                         Duration |         Start offset | Parallel/sequential                   | Notes                                        |
| -------------------------------------- | --------------------------- | -------------------------------------- | --------------------------: | ---------------- | -----------------------------------------------: | -------------------: | ------------------------------------- | -------------------------------------------- |
| getSessionUser                         | product layout              | Auth user endpoint                     |                           1 | not instrumented | 265 / 405 / 284 ms; median 284 ms across fetches |                 gate | parallel with membership              | One request-local cached user                |
| resolveActiveMembership                | product layout              | household_members                      |                           1 | not instrumented |                  267–441 ms; six observed values |                 gate | parallel with getUser                 | Blocks Home children                         |
| getRealPosition: households            | getRealPosition             | households                             |                           1 | not instrumented |             283–290 ms in the quiet sample group |                 0 ms | first wave                            | Base currency projection                     |
| getRealPosition: accounts              | getRealPosition             | accounts                               |                           1 | not instrumented |                289 / 722 / 283 ms; median 289 ms |                 0 ms | first wave                            | Supplies ids for two dependent reads         |
| listActiveMembershipIds                | getRealPosition / debt path | household_members                      |                      0 or 1 | not instrumented |            approximately 267–632 ms when present | approximately 270 ms | second wave when account owners exist | Domain ownership check, not auth             |
| loadAccountLedgerBalances              | getRealPosition             | get_account_ledger_balances RPC        |                           1 | not instrumented |                280 / 264 / 260 ms; median 264 ms | approximately 270 ms | after account ids                     | Read-only aggregate                          |
| getPlanPulse: households               | getPlanPulse                | households                             |           shared projection | not instrumented |        included in two observed households calls |                 0 ms | first wave                            | Plan settings                                |
| getPlanPulse: jars                     | getPlanPulse                | jars with embedded jar_plans           |                           1 | not instrumented |                411 / 280 / 267 ms; median 280 ms |                 0 ms | first wave                            | Home pulse projection                        |
| getOpenInboxAttention                  | getHomeDashboard            | inbox_items                            |                           1 | not instrumented |                434 / 285 / 271 ms; median 285 ms |                 0 ms | first wave                            | Selects id, kind, status only; limit 25      |
| ProductNavigation unread count         | product layout              | inbox_items HEAD                       |                           1 | count only       |                811 / 476 / 425 ms; median 476 ms |                 0 ms | overlaps first wave                   | Separate badge request                       |
| listTransactionsForDateRange           | getHomeDashboard            | transactions                           |                           1 | not instrumented |                540 / 299 / 299 ms; median 299 ms |                 0 ms | first wave                            | One request; selected period; no limit       |
| getHomeSavingsSummary: savings         | Home page                   | savings                                |                           1 | not instrumented |                254 / 289 / 271 ms; median 271 ms |                 0 ms | first wave                            | Supplies saving ids                          |
| getHomeSavingsSummary: cycles          | Home page                   | saving_cycles                          |        1 when savings exist | not instrumented |                264 / 664 / 630 ms; median 630 ms | approximately 270 ms | after saving ids                      | Legitimate id dependency                     |
| listInvestmentHomeSummary: holdings    | Home page                   | investment_holdings                    |                           1 | not instrumented |                266 / 267 / 272 ms; median 267 ms |                 0 ms | first wave                            | Lightweight Home holding projection          |
| listInvestmentHomeSummary: instruments | Home page                   | market_instruments                     | 1 when instrument ids exist | not instrumented |                265 / 622 / 259 ms; median 265 ms | approximately 270 ms | after holding ids                     | Id-dependent market lookup                   |
| listInvestmentHomeSummary: prices      | Home page                   | market_instrument_prices               | 1 when instrument ids exist | not instrumented |                506 / 272 / 265 ms; median 272 ms | approximately 270 ms | after holding ids                     | Parallel with instruments and FX             |
| listInvestmentHomeSummary: FX          | Home page                   | market_currency_rates                  | 1 when instrument ids exist | not instrumented |                791 / 270 / 256 ms; median 270 ms | approximately 270 ms | after holding ids                     | Quote currency VND                           |
| listInvestmentHomeSummary: inputs      | Home page                   | get_investment_home_summary_inputs RPC |       1 when holdings exist | not instrumented |                274 / 272 / 269 ms; median 272 ms | approximately 270 ms | after holding ids                     | Read-only summary input RPC                  |
| getHomeLoanSummary                     | Home page                   | loans                                  |                           1 | not instrumented |                265 / 253 / 263 ms; median 263 ms |                 0 ms | first wave                            | No loan payments/schedules in this dataset   |
| getHomeDebtSummary                     | Home page                   | liabilities                            |                           1 | not instrumented |                290 / 287 / 288 ms; median 288 ms |                 0 ms | first wave                            | Full debt projection; Node filters afterward |
| getHouseholdPreferences                | Home page                   | households                             |                           1 | not instrumented |    included in the two observed households calls |                 0 ms | first wave                            | Separate preference projection               |

The inventory totals **20 fetches per Home request** in P8: one Auth user request, one layout membership request, one possible owner-membership request, two households projections, one request for each listed Home data projection, and the unread HEAD. The exact owner-membership and household call presence is data- and branch-dependent; P8 observed two household requests per Home request and one additional household_members request in the account-owner path.

## 9. Supabase / PostgreSQL Analysis

The available database evidence does not support “Supabase database is slow” as the root cause.

Prior plan evidence for the linked project showed approximately **0.06–1.6 ms PostgreSQL execution** for the hottest reads at the current small dataset. A separate 10,000-transaction fixture produced approximately **4–9 ms** plans for representative balance/aggregate reads, with Node transaction-delta mapping around 0.3 ms. These values are far below the 253–811 ms HTTP elapsed times observed by the Home trace.

Relevant read characteristics:

- get_account_ledger_balances is a read-only Postgres aggregate RPC and is granted to authenticated callers.
- get_investment_home_summary_inputs is a read-only Home summary input RPC.
- inbox unread counting uses an index in the prior plan evidence.
- Home investment and savings projections avoid broad detail paths such as lots, activities, and lifecycle work.
- The transactions query selects a broad transaction projection and has no explicit row limit; this is a scale risk, not a measured current bottleneck.
- The debt Home path selects a full debt projection and filters some ownership state in Node; this is avoidable work at scale, but current HTTP time is still network-dominated.

The P8 application trace did not collect PostgreSQL EXPLAIN or server-side execution spans for each live request. Therefore, the exact sum and percentage of database execution for one current Home request is **unmeasured**. The plans provide strong order-of-magnitude evidence, not a per-request accounting.

## 10. Waterfall Analysis

Confirmed waterfalls:

1. **Product auth gate before Home children.** Proxy claims runs first at the request boundary. The product layout then waits for the authenticated user and active membership before rendering Home. getUser and membership overlap, so the current cost is the maximum of the two hosted reads.
2. **Accounts to account ledger balances.** getRealPosition needs account ids before it can call the batched ledger-balance RPC.
3. **Accounts to owner membership ids.** Ownership filtering needs owner membership ids after accounts return when owner ids exist.
4. **Savings to saving cycles.** The Home savings summary needs saving ids before it can request related current cycles.
5. **Investment holdings to market data and summary inputs.** Instrument ids are read from holdings before market instruments, prices, FX, and the Home summary RPC can run.

Not confirmed:

- The old inbox_items-to-transactions Home tail is **not present** in P5/P8. Transactions and savings start in the first Home domain wave, and P8 observes one transactions request only.
- Auth is not currently getUser followed by membership. The two operations overlap.
- Investments activities are not part of the Home summary path and are not a Home holdings-to-activities waterfall.

Theoretically parallelizable work:

- Auth user and membership are already parallelized.
- All top-level Home summaries are already launched in Promise.all.
- Within investment Home, market instruments, prices, FX, and summary inputs are parallel after holdings ids.
- The remaining opportunities require changing the read shape or RPC boundary, not adding another Promise.all around already-parallel calls.

## 11. Duplicate Work Analysis

Confirmed or likely duplicated work:

| Work                             | Evidence                                                                                      | Measured cost / effect                                                 | Assessment                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| inbox_items GET plus unread HEAD | One Home GET and one layout HEAD in every P8 request                                          | GET median 285 ms; HEAD median 476 ms; they overlap                    | Real extra round trip and backend work, but usually not a full extra sequential wave |
| households projections           | Two households fetches observed per Home request for currency, plan settings, and preferences | Individual calls approximately 283–428 ms; they overlap                | Total-work duplication; low current wall-time impact                                 |
| session helper calls             | Static call graph invokes session helpers from layout and Home data helpers                   | One Auth user fetch and one gate membership fetch observed per request | React cache successfully deduplicates request-local auth work                        |
| owner membership read            | A second household_members read appears after account ids                                     | Approximately 267–632 ms when present                                  | Domain ownership check, not duplicate auth                                           |
| transaction reads                | P8 observes one Home transactions GET and no second transaction after inbox                   | One request per Home request                                           | Old duplicate/enrichment path is removed                                             |
| investment valuation work        | Home-sized investment query uses holdings plus one summary RPC and market reads               | No duplicate Home valuation shape observed                             | Distinct inputs, not proven duplicate work                                           |

The most attractive small cleanup is reusing one inbox projection for both Home attention and the unread badge. It is not the highest-confidence latency fix because the HEAD overlaps the Home wave and its slowest samples do not always determine the final load event.

## 12. Cache Analysis

Current behavior:

- React cache() is used for session user, verified subject, active membership, permission gates, Home summaries, and several module query helpers.
- This cache is request-local. It prevents duplicate work during one render but does not cache data between Home requests.
- No unstable_cache, revalidateTag, cacheTag, or cacheLife usage was found on the Home path.
- Product navigation uses cookies and user/household-specific financial data, so static or cross-request caching is not automatically safe.
- Mutation paths use revalidation helpers, but that alone does not make dynamic, authenticated financial data safe for broad shared caching.

Safe conclusion:

Cross-request caching is not the next fix. It would require a precise household/user cache key, invalidation for every ledger/plan/inbox/savings/investment mutation, and careful privacy isolation. The measured issue is hosted fetch fan-out, not repeated same-request database computation.

## 13. Prefetch Analysis

Historical evidence confirms that default authenticated Link prefetch contributed to the original multi-route slowdown. In-viewport product links could start full authenticated RSC trees, each repeating Auth, membership, and domain Supabase work. This created contention and made the original 1–3 second rows look like a Home-only RSC problem.

Current P8 evidence:

- Home document plus four seconds idle produced exactly one authenticated RSC prefetch: a self-prefetch of /vi/home, approximately 1.9 KB and 4–7 ms.
- No unexpected authenticated viewport or hover prefetch stampede occurred.
- Product Link prefetch is disabled through the existing PRODUCT_LINK_PREFETCH constant on the relevant navigation and product surfaces.
- Plan and Money idle prefetch counts were zero.
- A remaining Savings detail-row prefetch exists, but it is outside the Home route and did not create a Home stampede.

Conclusion: prefetch was a historical contributor and is already addressed for Home. It is not the current Home bottleneck.

## 14. Payload Analysis

P8 Home payload measurements:

- Encoded: 78,590 bytes, approximately 78.6 KB.
- Transfer including response overhead: approximately 78,890 bytes.
- Decoded: 369,698 bytes, approximately 369.7 KB.

The decoded value includes HTML, hydration/static client assets, and the RSC/Flight material; it is not a pure RSC payload measurement. P8 found no significant payload growth versus the earlier profile. Local transfer after TTFB is not large enough to explain the 1.2–1.8 second range.

Over-fetching risks:

- The Home transaction query selects many transaction fields and has no row limit. A large quarter or future growth in transaction count could increase query, mapping, and Flight cost.
- The Home debt adapter selects the full debt projection and filters in Node; a summary projection would reduce scale risk.
- Savings and investment Home queries are already relatively narrow and avoid full detail/lot/activity paths.

Conclusion: Home has scale risks in transactions and debt shape, but current payload/serialization is not a material bottleneck. Do not broaden these paths or persist formatted financial strings as a response-size workaround.

## 15. Infrastructure / Network Analysis

The server runs locally while Supabase is hosted in ap-southeast-2. The deployed application runtime region was not available, so this report cannot prove the production server-to-Supabase geography.

Observed or previously measured network behavior:

- Vietnam-to-hosted REST probes measured approximately 202–309 ms in the prior audit.
- Warm Home PostgREST/Auth reads commonly measured approximately 253–299 ms.
- Auth user and membership commonly measured approximately 265–441 ms.
- Contention outliers reached 411–811 ms, including Home transactions at 540 ms, accounts at 722 ms, and inbox HEAD at 811 ms.

The application logs HTTP/span elapsed time. That time includes TLS/session handling, network RTT, PostgREST/Auth processing, PostgreSQL execution, and response transfer. It is not a pure RTT stopwatch. However, the prior network probes plus sub-10 ms plan execution show that the dominant component is the hosted server-to-Supabase request path, multiplied by the number of calls and waves.

Verdict: server↔Supabase RTT impact is **HIGH** for Home. A closer runtime/database region or fewer round trips would matter more than RSC serialization changes.

## 16. Latency Budget

This is a causal budget with measured ranges, not an additive accounting of one request:

| Budget component            | Evidence                                                                  |                                                                       Approximate contribution |
| --------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------: |
| Auth gate to first byte     | TTFB median 437 ms; per-run auth critical max median approximately 411 ms |                           approximately 26–28% of current median load as a wall-time reference |
| First parallel Home wave    | Most reads 253–299 ms; first-wave outliers 540–722 ms                     |                                      one hosted wave; approximately 16–46% depending on sample |
| Remaining ID-dependent wave | Quiet approximately 256–269 ms; broader P8 samples up to 630 ms           |                                                       approximately 16–40% depending on sample |
| Database CPU/execution      | Prior plans 0.06–1.6 ms; fixture 4–9 ms                                   |                                                 individually less than 0.1% of total wall time |
| App/RSC render and transfer | Not separately traced; encoded response 78.6 KB                           |                                                       unmeasured and not indicated as dominant |
| Hosted contention           | Individual requests 411–811 ms in slow samples                            | explains the 1,576 ms median and 1,830 ms tail variance more directly than new code sequencing |

Answers to the requested shares:

- Auth: approximately 411 ms critical-path median-of-max; current TTFB is 437 ms.
- Application sequencing: approximately 256–269 ms for the quiet ID-dependent Home tail, with approximately 270–480 ms reported across quiet traces; this is about 17–30% of the 1,576 ms final median as a rough wall-time reference.
- Actual database execution: exact current Home sum is unmeasured; individual plans are approximately 0.06–1.6 ms at current size and 4–9 ms in the larger fixture.
- Server↔Supabase network/request latency: normal individual reads are approximately 253–299 ms, with 411–811 ms contention outliers; across 20 fetches and two waves this is the dominant measured contributor.

The percentages are intentionally qualified: overlapping requests mean no honest report can sum every request duration into the browser load time.

## 17. Root Causes

### P0 — Hosted Supabase/Auth round-trip fan-out on the Home critical path

Evidence:

- P8 records 20 fetches per Home request.
- Normal domain reads are approximately 253–299 ms.
- Home has an auth gate, a first domain wave, and ID-dependent follow-up reads.
- Slow samples include inbox HEAD at 811 ms, FX at 791 ms, accounts at 722 ms, and saving_cycles at 664 ms.
- PostgreSQL plans are sub-10 ms for representative reads.

Measured cost:

The Home final median is 1,576 ms; the quiet Home r3 is 1,247 ms; the slowest P8 sample is 1,830 ms. The second wave is approximately 256–269 ms in the quiet sample and approximately 270–480 ms in the broader quiet-trace summary.

Why it happens:

The server-side RSC tree calls Supabase directly for multiple domain projections. Several projections require ids from a prior read, so the number of HTTP round trips cannot be reduced by Promise.all alone.

Confidence:

**HIGH**

### P1 — Remaining ID-dependent Home waves

Evidence:

- accounts must return ids before the ledger-balance RPC and owner-membership lookup.
- savings must return ids before saving_cycles.
- holdings must return instrument ids before market instruments, prices, FX, and summary inputs.
- P8 confirms these waves while also confirming that transactions and savings start in the first wave rather than after inbox_items.

Measured cost:

Approximately 256–269 ms for the quiet Home r3 second wave; approximately 270–480 ms in the quiet-trace summary, with hosted outliers up to 630–664 ms on dependent reads.

Why it happens:

The current domain APIs preserve correct relationships by querying parent rows first, then related rows by returned ids. This is a real data dependency, not accidental RSC serialization.

Confidence:

**HIGH**

### P1 — Authenticated product gate before Home rendering

Evidence:

- TTFB median is 437 ms.
- Product layout waits for getUser and active membership.
- The two operations overlap, so the current trace shows max(getUser, membership), not a series.

Measured cost:

The per-run auth critical-path maxima are 442, 411, and 290 ms in the three Home samples; their median is approximately 411 ms. Warm getClaims is only 1–2 ms.

Why it happens:

Home must fail closed for unauthenticated users and users without an active household membership. That gate is structurally before the child page.

Confidence:

**HIGH**

### P2 — Historical authenticated Link prefetch contention

Evidence:

- Earlier profiling observed multiple authenticated RSC prefetches from viewport links and hover.
- Those prefetches repeated Auth, membership, and domain reads.
- P8 now observes no Home stampede and only one tiny Home self-prefetch.

Measured cost:

Historical extra requests included a second getUser around 337 ms on a Savings navigation and multiple full RSC clones. The current Home cost is not amplified by this behavior.

Why it happens:

Default Next.js Link prefetching treated authenticated product pages as cheap static navigation targets even though each target performs live Supabase work.

Confidence:

**HIGH as a historical cause; LOW as a current cause**

### P2 — Small duplicate projections

Evidence:

- Home GET inbox_items and layout HEAD inbox_items both occur.
- Two households projections are observed per Home request.
- The request-local React cache prevents duplicate Auth user work.

Measured cost:

Inbox GET median is 285 ms and unread HEAD median is 476 ms, but they overlap. Household requests are approximately 283–428 ms individually and overlap.

Why it happens:

The layout badge and Home content have separate projection needs, and module boundaries currently expose several household settings projections.

Confidence:

**MEDIUM**

## 18. Optimization Opportunities

No candidate below was implemented.

| Change                                                                                                | Expected latency reduction                                                                                                                      | Complexity                                               | Risk                                                       | Confidence | Financial correctness affected?                          |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- | ---------- | -------------------------------------------------------- |
| Keep authenticated product prefetch disabled                                                          | Preserves the historical improvement; avoids full RSC contention rather than reducing one isolated Home request                                 | None; already present                                    | Low                                                        | High       | No                                                       |
| Collapse savings plus current-cycle Home reads into one read-only projection                          | Approximately one hosted RTT, likely 260–350 ms when the cycle wave is on the critical path; not measured in the current Home trace             | Medium; existing domain/RPC contract must remain correct | Medium                                                     | Medium     | Yes, read semantics must be proven equivalent            |
| Collapse accounts plus ledger balances and owner-membership inputs into one read-only Home projection | Approximately one hosted RTT, likely 260–350 ms when this wave is critical; not measured                                                        | Medium/high; combines ledger and tenancy checks          | Medium/high                                                | Medium     | Yes, ownership and balance correctness must be preserved |
| Reuse one inbox read for Home attention and unread badge                                              | Avoids one extra request, but current requests overlap; expected wall reduction is 0–approximately 300 ms and may be zero                       | Medium                                                   | Medium; badge/count semantics must remain exact            | Low/medium | No financial value change; inbox behavior can change     |
| Combine household projections                                                                         | At most one overlapping request’s work; expected wall reduction likely near zero in the current wave                                            | Low/medium                                               | Medium; settings/cache ownership must remain clear         | Medium     | No, if projections are equivalent                        |
| Narrow/limit Home transactions and debt projections                                                   | Scale protection; current dataset does not prove a fixed millisecond gain                                                                       | Low/medium                                               | Medium; must preserve Home period and debt-state semantics | Medium     | Yes, financial display completeness must be verified     |
| Move runtime closer to Supabase                                                                       | Potentially removes a large portion of each 253–299 ms request and reduces contention; exact improvement requires production-region measurement | High operational complexity                              | High; deployment, auth cookies, and regional constraints   | Medium     | No domain change, but infrastructure risk                |
| Add cross-request caching                                                                             | Potentially large repeat-navigation gains, but no safe estimate without mutation/invalidation analysis                                          | High                                                     | High privacy and stale-financial-data risk                 | Low        | Yes, stale values and isolation are correctness concerns |
| Convert Home to browser-side REST/API fetching                                                        | Does not remove Supabase calls; likely adds a browser-visible hop and worsens initial critical content                                          | Medium/high                                              | High UX, auth, and loading-state risk                      | High       | Yes, client freshness and error states change            |

The current P8 profile says no further Home optimization is justified solely to chase hosted RTT variance. The two combined-read candidates are the only application-level changes with a plausible one-full-RTT benefit, and both need a controlled benchmark before implementation.

## 19. RSC vs API Decision

Would converting Home to browser-side API fetching solve the measured bottleneck?

**No.** The current product route does not have a product REST gateway that aggregates Home. Server components call Supabase directly. Moving the calls into browser-side API fetching would either:

1. call Supabase directly from the browser, moving the same hosted RTT fan-out out of the server and delaying meaningful content; or
2. call a new application API, which would then make essentially the same Supabase calls and add another request boundary.

Comparison:

| Approach         | Expected effect                                                                                                                         | Decision                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Current RSC      | One server-rendered Home response; direct Supabase fan-out; auth gate plus two data waves                                               | Current behavior; measured at 1,576 ms median     |
| Optimized RSC    | Preserve server-rendered critical content; collapse only proven ID-dependent read waves or colocate runtime                             | Best improvement path                             |
| Hybrid RSC + API | Render essential balance/attention server-side; defer noncritical detail cards through an authenticated endpoint if product UX needs it | Possible later, but not required by this evidence |
| Client API-first | Browser waits for Auth/API/Supabase fan-out; adds loading and failure states and does not remove the underlying reads                   | Not recommended                                   |

RSC is therefore a useful delivery model whose current server data graph exposes network fan-out. It is not itself the measured serialization bottleneck.

## 20. Recommended Next Step

Do not implement a broad Combined RPC, REST migration, region move, or auth rewrite from this investigation.

The smallest next engineering task with the highest plausible application-level impact is:

**Run a controlled, read-only benchmark for one consolidated Home projection that combines the accounts-to-ledger-balance wave and the savings-to-current-cycle wave, preserving the existing domain contracts; implement only if the benchmark removes a full hosted round trip without changing financial or tenancy results.**

Acceptance evidence for that task:

- Same three-warm-load protocol and authenticated household.
- Per-request trace id and explicit start/end spans for each consolidated read.
- Exact row counts and response sizes for the compared projections.
- Comparison against the P8 Home median of 1,576 ms and the focused P5 median of 1,119 ms.
- EXPLAIN ANALYZE for the consolidated read at current and representative larger cardinalities.
- No mutation or lifecycle side effects.

Expected improvement is **estimated at one hosted RTT, approximately 260–350 ms per collapsed critical wave**, or roughly **17–22% of the current 1,576 ms median** if the wave is fully on the critical path. This is an estimate, not a measured result; P8 did not implement or benchmark the consolidated projection.

If no product requirement demands lower Home latency now, the smallest correct action is to close the workstream and retain the current P8 result. The remaining close-band variance is hosted RTT contention on already-documented second waves, not a newly discovered application regression.

## 21. Raw Evidence

### P8 Home browser rows

| Run     |       TTFB | DOM content loaded |         Load |          Encoded |           Decoded |
| ------- | ---------: | -----------------: | -----------: | ---------------: | ----------------: |
| home-r1 |     481 ms |           1,547 ms |     1,576 ms |     78,590 bytes |     369,698 bytes |
| home-r2 |     437 ms |           1,801 ms |     1,830 ms |     78,590 bytes |     369,698 bytes |
| home-r3 |     309 ms |           1,218 ms |     1,247 ms |     78,590 bytes |     369,698 bytes |
| Median  | **437 ms** |       **1,547 ms** | **1,576 ms** | **78,590 bytes** | **369,698 bytes** |

### P8 representative Home trace

    auth.getClaims        at=50599  ms=1     end=50600
    auth.getUser          at=50602  ms=290   end=50892
    membership.resolve    at=50608  ms=284   end=50892
    GET /auth/v1/user     at=50605  ms=284
    GET household_members at=50609  ms=282

    first domain wave at approximately 50895
      accounts, jars, loans, holdings, liabilities,
      savings, transactions, inbox_items GET, households

    ID-dependent wave after parent ids
      saving_cycles, ledger RPC, market/FX,
      investment summary RPC, household_members

### P8 observed Home fetch timings

| Request                                     | Observed durations                                             |                               Median across listed fetches |
| ------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------: |
| GET /auth/v1/user                           | 265, 405, 284 ms                                               |                                                     284 ms |
| GET /rest/v1/household_members              | 441, 632, 340, 630, 282, 267 ms; two requests per Home request | 511 ms across all six; per-request gate/owner roles differ |
| GET /rest/v1/savings                        | 254, 289, 271 ms                                               |                                                     271 ms |
| GET /rest/v1/loans                          | 265, 253, 263 ms                                               |                                                     263 ms |
| GET /rest/v1/investment_holdings            | 266, 267, 272 ms                                               |                                                     267 ms |
| GET /rest/v1/accounts                       | 289, 722, 283 ms                                               |                                                     289 ms |
| GET /rest/v1/liabilities                    | 290, 287, 288 ms                                               |                                                     288 ms |
| GET /rest/v1/households                     | six observations; two per Home request                         |              286–290 ms in the quiet group; 428 ms outlier |
| GET /rest/v1/jars                           | 411, 280, 267 ms                                               |                                                     280 ms |
| GET /rest/v1/inbox_items                    | 434, 285, 271 ms                                               |                                                     285 ms |
| GET /rest/v1/saving_cycles                  | 264, 664, 630 ms                                               |                                                     630 ms |
| GET /rest/v1/market_instruments             | 265, 622, 259 ms                                               |                                                     265 ms |
| POST rpc/get_investment_home_summary_inputs | 274, 272, 269 ms                                               |                                                     272 ms |
| GET /rest/v1/transactions                   | 540, 299, 299 ms                                               |                                                     299 ms |
| POST rpc/get_account_ledger_balances        | 280, 264, 260 ms                                               |                                                     264 ms |
| GET /rest/v1/market_instrument_prices       | 506, 272, 265 ms                                               |                                                     272 ms |
| HEAD /rest/v1/inbox_items                   | 811, 476, 425 ms                                               |                                                     476 ms |
| GET /rest/v1/market_currency_rates          | 791, 270, 256 ms                                               |                                                     270 ms |

The household_members row contains two calls per Home request: the layout membership gate and a later owner-membership query where the data path requires it. The households row contains two distinct projections observed per request. These grouped rows explain why the unique endpoint table has fewer rows than the confirmed total of 20 fetches.

### P5 focused Home evidence

    transactions.start = first domain-wave start
    savings.start      = first domain-wave start
    transactionCount   = 1
    secondTransactionAfterInbox = false

    Home P5 loads: 1,017 / 1,119 / 2,077 ms
    Home P5 median: 1,119 ms
    Earlier P4.1b median: 1,803 ms
    Difference: -684 ms

P5 replaced the enriched Home inbox path with getOpenInboxAttention, which selects only id, kind, and status and preserves the Home count/unmapped-expense contract. P8 confirms that no second transaction request and no inbox-to-transaction enrichment tail returned.

### Prefetch evidence

    Home document plus 4 seconds idle:
      authenticated RSC prefetch count = 1
      destination = /vi/home
      payload = approximately 1.9 KB
      duration = approximately 4–7 ms

    Plan document plus 4 seconds idle:
      authenticated product-tree prefetch count = 0

    Money document plus 4 seconds idle:
      authenticated product-tree prefetch count = 0

### Database evidence

    Prior representative PostgreSQL plans:
      hottest reads at current size = approximately 0.06–1.6 ms execution
      10,000-transaction fixture = approximately 4–9 ms execution
      Node applyTransactionDeltas = approximately 0.3 ms

The plans are recorded in the existing Supabase audit and were not re-run against the live production database during P8. They are used here to separate database execution order of magnitude from observed hosted HTTP elapsed time.

### Safety evidence

The full P8 process log contained no occurrences of:

    backfill_legacy_savings_accounts
    detect_matured_savings
    enqueue_savings_maturity_cascade
    syncSavingsLifecycleAction

Observed POSTs were login token exchange and read-only RPCs. No Home financial mutation or savings lifecycle write was observed.

### Commands and source evidence

Commands used or recorded:

- npm run build
- VINHA_PERF_TRACE=1 next start -p 3010 -H 127.0.0.1
- Headless Chromium page.goto measurements at 390 × 844
- rg source/call-graph searches across app, modules, shared, providers, proxy, and next.config.ts
- Existing P8 server log: /tmp/vinha-perf-p8-server.log
- Existing P8 browser profile: /tmp/vinha-rsc-profile-p8/profile.json

Source and prior audit references:

- .agents/audits/rsc-performance-profile.md, P1–P8
- .agents/audits/performance-supabase-audit.md
- .agents/audits/api-performance-investigation.md
- app/[locale]/(product)/home/page.tsx
- app/[locale]/(product)/layout.tsx
- modules/home/application/get-home-dashboard.ts
- modules/ledger/application/queries/get-real-position.ts
- modules/savings/application/queries/savings-home-summary.ts
- modules/investments/application/queries/investment-queries.ts
- modules/platform/application/perf-trace.ts

Final conclusions:

- Why the historical Home request took approximately 3 seconds: hosted Auth/PostgREST round trips, multiple waves, and historical eager authenticated prefetch contention.
- Auth time: approximately 411 ms critical-path median-of-max; TTFB median 437 ms.
- Application sequencing: approximately 256–269 ms quiet second wave; approximately 270–480 ms across quiet traces.
- Actual database execution: individual representative plans approximately 0.06–1.6 ms at current size; exact current Home aggregate unmeasured.
- Server↔Supabase network/request latency: usually 253–299 ms per read, with 411–811 ms contention outliers.
- Calls per Home request: 20 fetches in P8.
- Sequential calls: auth gate before children; accounts to balances/owner ids; savings to cycles; holdings to market/summary inputs.
- Duplicates: inbox GET plus unread HEAD; two household projections; React cache prevents duplicate request-local Auth user work.
- Over-fetching: transactions and debt are scale risks; current Home summary payload is not a measured bottleneck.
- Prefetch: historical contributor, not a current Home stampede.
- RSC serialization: not materially expensive on the measured payload.
- Supabase database: not the bottleneck at measured cardinality.
- REST/API migration: does not remove the measured fan-out and is not warranted.
- Highest-impact plausible change: benchmark one consolidated read-only projection for the remaining critical ID-dependent waves before implementing anything.
