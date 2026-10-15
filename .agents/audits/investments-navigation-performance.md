# Investments Navigation Performance — Phase 0

Date: 2026-10-10

## Status

**INVESTIGATION COMPLETE.** The current critical paths and one Phase 1 direction are evidence-backed. This was read-only: no investment/account values, quantities, prices, transactions, or schema were changed. Temporary timing instrumentation and the temporary authenticated browser state were removed.

## Method and limits

- Built and ran the local production app on Next.js 16.3.1 with temporary server spans enabled. The production build passed; no tests were added or run.
- Used authenticated Chromium at 440×900 with reduced motion. The app ran locally; Supabase was hosted in region `ap-southeast-2`. This does not identify the production deployment region.
- Recorded one cold-ish direct list load and five warm samples for Money→Investments, List→Detail, Detail→app Back, Detail→browser-history Back, and List→Create. Separate browser captures measured RSC timing/decoded bytes and list prefetch behavior.
- Used an existing account whose sampled holding is read-only. Create form rendering was observed. Buy/Sell/Update Price routes were opened without submitting, but they rendered read-only or automatic-pricing states; their editable control readiness could not be verified.
- No fixture setup, write path, SQL `EXPLAIN`, or production deployment was used. Browser response bodies, identifiers, cookie values, and financial values were not retained.

The earlier audit dated 2026-09-11 predates the current Investments list read-model migration. Its multi-wave list topology and timings are stale; this report uses current source and runtime evidence.

## Route map

| Surface                            | Route and page                                                    | Blocking read path                                                                           | Loading/error behavior                                              |
| ---------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Investments List                   | `/{locale}/money/investments` → `investments/page.tsx`            | Product session; list RPC and local portfolio assembly                                       | `investments/loading.tsx`; no Investments-local error boundary      |
| Overview alias                     | `/{locale}/money/investments/overview` → re-exports the List page | Same as List                                                                                 | Has its own `overview/loading.tsx`                                  |
| Create                             | `/{locale}/money/investments/new` → `new/page.tsx`                | `listAccounts()` completes before `OpeningPositionForm` renders                              | `new/loading.tsx`                                                   |
| Detail                             | `/{locale}/money/investments/[id]` → `[id]/page.tsx`              | Holding/valuation/market context and activity/valuation history are both awaited             | `[id]/loading.tsx`                                                  |
| Buy / Sell / Income / Update Price | `/{locale}/money/investments/[id]/{buy,sell,income,valuation}`    | Shared `InvestmentOperationPage`; portfolio, accounts, and selected holding load in parallel | Inherits `[id]/loading.tsx`; no operation-specific loading boundary |
| Convert                            | `/{locale}/money/investments/convert`                             | Shared `InvestmentOperationPage`; portfolio and accounts                                     | Inherits the Investments loading boundary                           |
| History / Activity                 | No separate route; rendered in Detail                             | Operations and valuation records for the selected holding                                    | Blocks the Detail page with its hero                                |

All routes sit under `app/[locale]/(product)/layout.tsx`, which awaits `requireProductSession()` before returning the product shell. `money/layout.tsx` provides Money messages. The product layout’s unread-inbox count is inside Suspense and is not an Investments data dependency. There is no Investments-local `error.tsx`; product errors inherit `app/[locale]/(product)/error.tsx`.

There is no route-level Suspense boundary separating the List summary from holdings, or the Detail hero from activity/history. The Home screen streams its product summaries separately; that is outside the Investments route render.

Home and Money show a summary backed by `get_home_investment_raw_inputs()` before navigation; the dedicated List uses the separate full-list RPC. Both summary links use `BaseRow` with the shared no-prefetch policy. Plan has no direct Investments route or summary link in current source.

## Data model and valuation semantics

- `investment_holdings` is the current position row. Buy/sell and valuation records are separate `investment_operations` and `investment_valuations`; a buy does not create a new UI position row for every purchase. `investment_lots` stores explicit lots where FIFO accounting applies.
- Cost basis is per holding’s `accounting_method`: weighted-average disposal consumes basis proportionally from remaining basis and quantity; FIFO consumes explicit lots in acquisition order and fails if lot quantity is insufficient. The mapper defaults an unrecognized/missing method to weighted average. Do not change this as part of a read-path optimization.
- For `UNIT_PRICE` instruments, automatic market value is `quantity × price per unit × FX to VND`; unrealized P/L compares that value with remaining cost basis. Prices and FX come from internal market tables, not a live quote call during page render. VND uses the identity FX rate.
- `TOTAL_VALUE` instruments (currently the bond pricing mode) are the explicit exception: the stored quote is already a position total and is not multiplied by quantity. Manual valuations use the saved `value_vnd` as current value and may also carry unit-price/input-currency fields. The valuation screen is an update to valuation inputs, not a change to these semantics.
- List aggregation of current value, P/L, and allocation is local TypeScript work over raw rows; the measured mapping span was 0–1 ms. Realized P/L, income, and fees are supplied as operation totals by the List RPC.

## Navigation map and behavior

| Transition                     | Mechanism                                                                              | Evidence                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Home → Investments             | Home product-summary `BaseRow` link                                                    | Source has the route link under a streamed Home summary. Not separately timed in this browser batch.                             |
| Money → Investments            | `MoneyModuleRow`/`BaseRow` Next `Link`                                                 | 5 warm samples; median 843 ms.                                                                                                   |
| List → Detail                  | Direct Next `Link` in `AssetRow`                                                       | 5 warm samples; median 1,351 ms.                                                                                                 |
| Detail → List, app control     | Top bar `backHref={APP_PATH.MONEY_INVESTMENTS}` Next `Link`                            | Fresh List RSC observed; 5 warm samples; median 1,328 ms.                                                                        |
| Detail → List, browser Back    | Browser history Back                                                                   | No RSC request observed in 5 samples; median 38 ms.                                                                              |
| List → Create                  | Header Next `Link`; floating action uses `router.push`                                 | 5 warm samples; median 1,336 ms.                                                                                                 |
| Detail → Buy/Sell/Update Price | Detail quick actions use `router.push`; actions render only when `ownership.canMutate` | Sampled holding had no mutation controls; direct safe GETs rendered read-only/automatic-pricing states. No submit was attempted. |
| Missing session / membership   | Server redirect to login / onboarding                                                  | Source behavior; not benchmarked.                                                                                                |

The Product layout requires the canonical `requireProductSession()` gate. The Investments page also calls `getSessionUser()` and `resolveActiveMembership()`, but the underlying React `cache()` helpers deduplicate the same user/membership within a server render. Runtime traces showed one Auth user request and one primary membership resolution per route render, not duplicate remote calls from those helper invocations. `getSessionMembership()` starts verified-subject resolution alongside `getUser()`; auth is not a proven duplicate-read target here.

The List’s search text reset on both app Back and browser-history Back. Browser-history Back also reset the internal scroll position from a non-zero sample; app Back scroll restoration was not separately captured. Browser-history Back is much faster, but it did not restore the sampled search state. The Closed tab had no positions, so tab restoration across Detail could not be tested. The app Back control is a fresh route link, not a history restore.

## Overview critical path

The active route imports `InvestmentsOverview` from `overview/investments-overview.tsx`. The server page waits for the product/session gate and then for `listInvestmentListPortfolio()` before returning the data-backed screen. Summary, holding rows, and allocation become useful together; the root `loading.tsx` is a skeleton, not useful portfolio content.

| Dependency                         | Awaited before useful List UI?   | Remote read?                               | Needed for current first useful UI?                           |
| ---------------------------------- | -------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| Auth / active household            | Yes, product layout gate         | Auth user + membership query               | Yes, authorization and household scope                        |
| Investment holdings and identity   | Yes, inside one List RPC         | No separate holdings request on this route | Yes, position rows and summary                                |
| Latest manual valuation            | Yes, embedded per row in the RPC | No separate valuation request              | Yes when manual fallback is current                           |
| Instrument/current market price/FX | Yes, embedded per row in the RPC | No per-holding PostgREST request           | Yes for automatic valuation where supported                   |
| Cost basis and operation totals    | Yes, embedded raw fields/totals  | One RPC                                    | Yes for current P/L and totals                                |
| Accounts                           | No                               | None                                       | No                                                            |
| Full activity/history              | No                               | None                                       | No; List needs aggregate operation totals only                |
| Allocation/chart                   | Local after the RPC              | None                                       | The allocation visualization is CSS, not a chart-data request |

Current loader `listInvestmentListPortfolio()` calls `get_investments_list_raw_inputs()` once, maps the returned rows with the shared valuation resolver, then aggregates locally. The live response had 20 positions and was 36,555 decoded bytes. Server span medians over the instrumented run: RPC/SDK 263 ms; local mapping 1 ms. The browser’s first cold-ish direct List render was 3,232 ms; five warm Money→Investments transitions had a median of 843 ms (range 831–1,336 ms). The cold-ish value includes first-process/JWKS and hosted-service warm-up and is not mixed into the warm median.

This List loader has no per-holding price-query N+1: current prices, FX, latest manual valuation, and owner status are joined into one RPC response. A separate browser prefetch effect exists (see Prefetch behavior below), but it is not a List-loader N+1.

## Detail critical path

`[id]/page.tsx` awaits `getInvestmentHoldingResult(id)` and `listInvestmentActivities(id)` in one `Promise.all`. The activity branch requests all matching operations and valuation records for the selected holding in parallel; the query has no page limit or pagination. The holding branch first fetches one base holding row; after that row reveals its instrument and owner IDs, it starts a second parallel wave for latest manual valuations, lots, owner membership status, and—when linked to an instrument—market instrument, current price, and FX. The Detail page does not fetch a price-history series.

The hero and timeline share the route’s blocking wait. One useful Detail sample read a 550-byte base holding row; activity rows were requested at the same time as that base row, but the related-price/ownership/lot wave began after the base result. Across 29 instrumented Detail invocations, median spans were: base read 255 ms, activity reads 331 ms, related reads 536 ms, and local mapping 0 ms. Five warm List→Detail samples had a median of 1,351 ms.

One browser timeline sample measured 1,344 ms from click to the Detail hero marker. The route RSC response ended at 913 ms and was 21,444 decoded bytes; the marker appeared about 409 ms later. That gap is browser/Next route processing, not a React CPU profile. The shared allocation UI has no chart library, and no evidence points to chart rendering as the main bottleneck.

## Form critical paths

| Route        | Reads awaited before rendering                                                                      | First useful state / limitation                                                                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create       | `listAccounts()` plus translations                                                                  | The form’s initial fields wait for account roster/ownership/balance data even though account choice is later in the workflow. Warm form marker median: 1,336 ms; account-list span median: 1,084 ms.                                                                          |
| Buy          | Full `listInvestmentPortfolio()`, `listAccounts()`, and `getInvestmentHolding(id)` concurrently     | The selected holding and eligible accounts feed the operation form. Under the read-only sampled account, the route rendered an informational state rather than editable controls. One direct route sample reached its route marker in about 1,263 ms.                         |
| Sell         | Same shared reads as Buy                                                                            | Source uses selected holding quantity for the Sell All control and 25/50/100% quick choices. These are not authoritative limits: the sell RPC re-reads and locks the holding before disposal. Editable quantity/MAX readiness could not be verified for the read-only sample. |
| Update Price | Same shared reads; then auto-price-supported holdings return an automatic-pricing information state | The sampled route was automatic-pricing-only, so there was no manual price form to measure. A manual instrument’s route also reads current holding/valuation context before rendering.                                                                                        |

The operation page currently loads the full activity-bearing portfolio and a selected holding through separate loader paths. A single read-only Buy route trace observed two `investment_holdings` requests, two lots reads, two instrument reads, two price reads, two FX reads, and three valuation reads (the full portfolio, full activity summary, and selected-holding path overlap). It also loaded all portfolio operations for the shared portfolio model. The source shows the page only passes portfolio holdings into its form logic; the activity-derived portfolio totals are not used by the operation form. This is confirmed duplicate/over-broad read work, not a reason to weaken validation.

A single operation-route trace measured `listInvestmentPortfolio()` at 1,194 ms, selected holding at 1,334 ms, and accounts at 935 ms. They run concurrently, so these are overlapping spans rather than additive time. The route still cannot render until the slowest branch completes.

Crypto input-currency rate lookup is a later client action after choosing a non-VND crypto input currency. It does not add an initial route read for the default VND state. Sell proceeds preview uses the loaded holding and selected unit-price input; final writes still go through the validated server command/RPC path.

## Request topology and prefetch

### Current read topology

- **List:** one security-invoker `get_investments_list_raw_inputs()` RPC. It joins position, current market price/FX, owner status, latest manual valuation, and operation/fee totals. TypeScript performs valuation resolution and portfolio aggregation.
- **Detail:** base holding first; parallel activity reads beside it; then a dependent related-read wave for valuations, lots, ownership, and instrument/price/FX. The activity and holding branches both query valuation records.
- **Operation routes:** portfolio, accounts, and selected holding are started with `Promise.all`; each subtree has internal parallel reads. The full portfolio branch includes complete operations/valuation activity even though the form uses its holdings.
- **Create:** account reads complete before form render. There is no account reference lookup after the page becomes interactive.

React `cache()` is request-scoped for session, membership, and portfolio helpers. It does not provide cross-user financial caching. The newer List loader has its own request memoization; it does not share cached data with the legacy full-portfolio operation loader.

### Prefetch behavior

The shared product-link policy is `PRODUCT_LINK_PREFETCH = false` and is applied by `BaseRow` and `TopAppBar`. The active `AssetRow`, the List header add link, and the Convert link use direct Next `Link`s without that prop, so they retain Next’s default prefetch behavior. In a 3-second idle window after a direct List load at 440px, the browser issued RSC requests with HTTP 200 for two holding-detail route entries, two `/new` entries, and two `/convert` entries. Not all prefetched bodies completed during the observation window; treat this as evidence of eager route work, not a delivered-payload count. Scrolling can expose additional holding links.

### Browser transition sample

`First useful UI` is the real data-backed page marker after URL change; skeletons were not counted. RSC byte counts are decoded browser bodies, not compressed transfer sizes.

| Transition                    | 5-sample warm median (range) | One RSC timeline sample                 |     RSC end → useful UI |
| ----------------------------- | ---------------------------: | --------------------------------------- | ----------------------: |
| Money → List                  |           843 ms (831–1,336) | 750 ms response; 43,021 bytes           |                   75 ms |
| List → Detail                 |       1,351 ms (1,343–1,854) | 913 ms response; 21,444 bytes           |                  409 ms |
| Detail → app Back             |         1,328 ms (825–1,333) | 802 ms response; 40,095 bytes           |                  508 ms |
| Detail → browser-history Back |                38 ms (32–39) | No RSC request observed in five samples |          Not applicable |
| List → Create                 |       1,336 ms (1,327–1,352) | Account reads block the form marker     | Not separately captured |

The app Back RSC/body is consistent with a fresh List render; the browser-history route is served from client/router history much faster. The RSC-to-UI gaps on Detail and app Back are measurable, but this investigation did not run a browser CPU profile, so it does not attribute those gaps to React specifically.

## Supabase attribution and advisors

Server spans separate request-to-headers from response-body completion. Across the instrumented authenticated workload, representative medians were:

| Request/span                  |                              Median | Body / mapping evidence                          |
| ----------------------------- | ----------------------------------: | ------------------------------------------------ |
| Auth `getUser()`              |                              232 ms | Auth HTTP response                               |
| Primary membership resolution |                              324 ms | 167-byte response; body completion about 1 ms    |
| List RPC                      | 260 ms to headers / 263 ms SDK span | 36,555-byte response; body completion about 1 ms |
| Detail base holding           |     253 ms to headers / 255 ms span | 550-byte response                                |
| Detail related reads          |                              536 ms | Parallel service reads after the base holding    |
| Detail activity reads         |                              331 ms | Operations and valuation reads in parallel       |
| Local list/detail mapping     |                              0–1 ms | No meaningful CPU cost observed                  |

Most measured PostgREST time was before response headers; body streaming took about 0–1 ms for these samples. That is HTTP/hosted Supabase/PostgREST wait, **not proof of PostgreSQL execution time**. The app ran locally against hosted Supabase in `ap-southeast-2`; no latency is attributed to a deployment region. No authenticated/RLS-aware `EXPLAIN (ANALYZE, BUFFERS)` was run because no single SQL statement was isolated as the repeated dominant cost.

The current live List RPC is `SECURITY INVOKER`, so its table RLS applies. Relevant investment holding/operation/valuation/fee policies scope reads to active household membership; lots validate through their holding/household; accounts are household-member scoped; market instruments/prices/FX are authenticated-readable reference data. Current Supabase advisors report unindexed foreign-key relationships on some financial tables and an unused holding index; these are supporting observations only. No index change is recommended without query-plan and workload evidence. Security advisor warnings about `SECURITY DEFINER` mutation RPCs are preserved as review prompts, not a reason to move validation to the client.

## Security and mutation authority

`InvestmentHolding.ownership` is resolved from financial scope and active owner membership. Detail actions render only when `canMutate`; the shared operation page renders a read-only explanation otherwise. Server commands validate inputs, call authenticated database RPCs, and the Sell RPC re-reads the household-scoped holding `FOR UPDATE`, validates mutation capability/account ownership, checks available quantity, consumes FIFO lots or weighted-average basis, and records the operation atomically. Phase 1 must preserve those checks and treat client quantity/current-price previews as display data only.

## Ranked bottlenecks

**P1 — Operation routes fetch overlapping full-portfolio and selected-holding data.**

Evidence: shared Buy/Sell/Update Price server page starts full portfolio, accounts, and selected holding in parallel; one runtime trace saw duplicate holding/lot/market reads and three valuation reads. The full portfolio also loads all activity data, though the form consumes its holdings. The slowest server span was 1.33 s; a direct read-only Buy route reached its route marker in about 1.26 s.

Why it matters: every operation mode pays the broad portfolio/history cost before the user can reach the form or informational state.

Likely direction: scope operation-page reads to the selected holding, required peer holdings, and accounts; remove activity-derived totals that the form does not consume. Keep mutation authority in server commands/RPCs.

**P2 — App Back re-renders the full List route.**

Evidence: 1.33 s warm median, a fresh ~40 KB decoded List RSC, versus 38 ms browser-history Back. Both tested Back paths reset search; browser-history Back reset scroll. Closed-tab restoration was not testable because there were no closed positions.

Why it matters: a common Detail→List action repeats the List critical path and loses local browse state.

Likely direction: investigate history-aware Back with a safe canonical-list fallback for direct-entry Detail routes.

**P3 — Detail waits for the activity/history branch and a dependent valuation/market wave before revealing the hero.**

Evidence: activity reads run in parallel with the base holding, then related reads wait for the base row; related-read median 536 ms; hero and timeline share a blocking page render. No chart/history-price series exists.

Why it matters: secondary history and market context delay the primary asset identity/value view.

Likely direction: consider independently streaming secondary activity only after Phase 1 confirms product behavior and loading boundaries.

**P4 — Create’s first form render waits for account data.**

Evidence: the page awaits `listAccounts()` before rendering the form; account span median 1.08 s; warm first form marker median 1.34 s.

Why it matters: early name/type fields are held behind a later account dependency.

Likely direction: separate the initial create fields from account-dependent steps if the form contract permits it.

**P5 — Several visible List links trigger default RSC prefetch.**

Evidence: direct List idle window issued two Detail, two Create, and two Convert RSC responses with status 200; relevant direct links omit `prefetch={false}`.

Why it matters: eager route reads can contend with the selected navigation and add hosted requests; the fixed observation window did not prove all bodies completed.

Likely direction: measure per-link prefetch benefit and cost before changing these links.

## Recommended Phase 1

Start with **one scoped operation-page read path**: reuse one authoritative selected-holding result, fetch only the other positions needed by fee/conversion selectors, and avoid loading full activity-derived portfolio totals for Buy/Sell/Update Price. Keep account ownership, available-quantity, price/FX, lot/FIFO, and all mutation checks authoritative in server code and database RPCs. Do not add indexes or change price semantics based on this Phase 0 evidence.

## Decision

**INVESTMENTS INVESTIGATION COMPLETE — PROCEED TO INVESTMENTS PHASE 1**
