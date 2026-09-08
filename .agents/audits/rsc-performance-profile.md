# Authenticated RSC Performance Profile

| Field        | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| Date         | 8 Sep 2026                                                             |
| Predecessor  | [api-performance-investigation.md](./api-performance-investigation.md) |
| Runtime      | `next start` (production build) on `127.0.0.1:3010`                    |
| Trace        | `VINHA_PERF_TRACE=1` (path + duration only)                            |
| Locale       | `/vi`                                                                  |
| Viewport     | 390×844, headless Chromium                                             |
| Dataset      | Existing signed-in household (production-like hosted Supabase)         |
| Code changes | None                                                                   |

## 1. Executive summary

Authenticated pages are slow because **every product document pays two sequential hosted round-trips before the layout can stream**, then **another PostgREST wave (often two) for page data**. PostgreSQL execution is not the bottleneck.

Ranked causes of user-visible delay:

1. **Sequential Auth HTTP `getUser()` (~340–610 ms) then membership PostgREST (~270–340 ms).** This pair **is** TTFB. Measured TTFB matches `getUser + membership` within ~20 ms on every route.
2. **Hosted Supabase RTT of ~260–350 ms per HTTP call** (Auth or PostgREST). SQL remains sub-2 ms from the prior audit; traces show the same 200–300 ms class, sometimes 450–700 ms under contention.
3. **Inner two-wave domain queries after TTFB** (accounts → ledger RPC; savings → cycles; holdings → market/FX; jar settings/pulse → snapshots/period txs). These lengthen DCL/load by ~300–1100 ms, not TTFB.
4. **Remaining default Link prefetch** on Plan hub rows, TopAppBar back links, and some Money/Plan CTAs. Bottom nav / Home products / Money modules with `PRODUCT_LINK_PREFETCH = false` **no longer** stampede. Prefetch of `/vi/money` from Savings still caused a **second `getUser()`** in that request window.
5. **HTML payload size** (~64–79 KB compressed, 290–486 KB decoded). Transfer on localhost is cheap; it is not the 2–10 s screenshot class. Login’s first Home RSC was ~307 KB and took 2.4 s to finish streaming.
6. **Visiting Savings in a real browser runs write RPCs** (`SavingsLifecycleSync`). That is a product behavior, not a profiler action. See safety notes.

`getClaims()` is **not** expensive after JWKS warmup (1–11 ms). The previous “three auth waves” model overstated proxy cost on a warm Node process. The live floor is **two waves: `getUser` then membership**.

## 2. Measured baseline

Production `next start`, warm process, document `page.goto` after login. TTFB = Navigation Timing `responseStart - requestStart`. Total = `loadEventEnd`. RSC = extra `_rsc` / `RSC: 1` requests during that navigation. Requests = traced Supabase HTTP fetches in the same window (not static JS).

| Route       |   TTFB |   Total |            RSC (browser) | Supabase HTTP | Largest latency                                                              |
| ----------- | -----: | ------: | -----------------------: | ------------: | ---------------------------------------------------------------------------- |
| Home        | 780 ms | 2746 ms |      1 prefetch (1.9 KB) |            25 | `getUser` 470 ms; then `inbox_items` 647 ms / `savings` 654 ms               |
| Money       | 647 ms | 1640 ms |                        0 |            20 | `getUser` 347 ms; then `accounts` 686 ms (card wave)                         |
| Plan        | 707 ms | 1871 ms |               2 prefetch |            30 | `getUser` 356 ms; then `jar_period_rule_snapshots` 703 ms                    |
| Savings     | 782 ms | 1755 ms | 2 prefetch (`/vi/money`) |             8 | `getUser` 477 ms (+ second `getUser` 337 ms from Money prefetch)             |
| Investments | 726 ms | 2050 ms |               1 prefetch |            17 | `getUser` 427 ms; `market_currency_rates` 435 ms; sequential activities wave |
| Loans       | 901 ms | 1195 ms |               2 prefetch |             4 | `getUser` 612 ms (empty loan list; no payment/schedule queries)              |

Client navigation Home → Money (bottom nav, no document reload): **1473 ms** wall to `money-hub` visible. Server still ran a full Money query set (`getUser` 341 ms + membership 344 ms + domain ~270–300 ms). Browser RSC bodies for that click were tiny (cache/partial), so **server work ≠ visible RSC bytes**.

Home idle (4 s after load): **one** 11 ms prefetch of `/vi/home` (1.9 KB). **No** 5-tab Money/Plan/Inbox/Together stampede.

Pass-1 document gotos (same server, extra 1.5 s settle wait included in wall) were 2.8–3.9 s walls and agree on route ranking: Investments slowest among product lists, Loans fastest to DCL, Home slowest to load.

## 3. Authentication waterfall

Warm product document:

```text
proxy updateSession
└── getClaims                    1–11 ms     JWKS cached; often no Auth HTTP

layout requireProductSession
├── getUser / GET /auth/v1/user  340–612 ms  network, every RSC/document
└── membership
    GET /rest/v1/household_members
                                 267–344 ms  waits for user.id

page getSessionUser + resolveActiveMembership
└── React cache() hit            ~0 ms extra Auth/membership HTTP
```

| Step        | Sequential?                | Deduped within one RSC?              | Measured                                          |
| ----------- | -------------------------- | ------------------------------------ | ------------------------------------------------- |
| `getClaims` | Before RSC (proxy)         | Per request; cheap when JWKS is warm | 1–11 ms warm; 575–1008 ms when JWKS fetched       |
| `getUser`   | **Yes**, blocks membership | `cache()` — **one HTTP per request** | 340–612 ms                                        |
| membership  | **Yes**, needs `user.id`   | `cache()` — one HTTP per request     | 267–344 ms                                        |
| Page auth   | After layout               | Cache hit                            | no extra `/auth/v1/user` on Home/Money/Plan/Loans |

Login (one-time): `POST /auth/v1/token` **1571 ms**, then overlapping Home render (`getUser` 574–735 ms, many PostgREST 300–900 ms). JWKS fetched three times (567, 582, 697, 1003 ms). After that, `getClaims` stops calling JWKS.

**Layout vs page:** both call `getSessionUser` / `resolveActiveMembership`. Request-local `cache()` **is working** for the document itself (single `getUser` + single membership on Home/Money/Plan/Loans). A **prefetch is a new request** and repeats Auth.

**Membership blocks children.** `app/[locale]/(product)/layout.tsx` awaits `requireProductSession` before rendering `ChromeShell`. Inbox badge is behind `Suspense` and overlaps **page** data, not Auth. Measured TTFB ≈ `getUser + membership` on every route — the layout gate is the first-byte path.

`assertMoneyActionAllowed` is also `cache()`’d and reuses the same user + membership; it does not add HTTP after the layout gate.

## 4. Route waterfalls

Classification key: **S** sequential dependency, **P** parallel, **D** duplicate across requests, **U** unavoidable for current security/RLS, **N** unnecessary for the screen.

### `/vi/home`

```text
Request
│
├── getClaims                 2 ms          P/U (proxy)
├── getUser                 470 ms          S/U
├── membership              284 ms          S/U
│   TTFB 780 ms
│
├── Wave D (parallel after gate)
│   ├── households, accounts, jars, loans, holdings,
│   │   liabilities, savings, transactions, inbox HEAD/GET
│   └── ~260–310 ms each                     P
│
└── Wave E (depends on wave D ids)
    ├── get_account_ledger_balances  276 ms  S (needs account ids)
    ├── saving_cycles                302 ms  S (needs saving ids)
    ├── market_* + investment RPC    278–308 ms
    ├── inbox_items GET              647 ms  P but contended
    └── savings                      654 ms  D vs home summary
```

| File                               | Function                                     | Queries                                         | Dependency          | Sequential cost     | Parallel-safe?                                  |
| ---------------------------------- | -------------------------------------------- | ----------------------------------------------- | ------------------- | ------------------- | ----------------------------------------------- |
| `require-product-session.ts`       | `requireProductSession`                      | getUser → membership                            | user.id             | ~750 ms             | getUser \|\| membership if claims provide `sub` |
| `get-home-dashboard.ts`            | `getHomeDashboard`                           | position, pulse, inbox, txs                     | after gate          | 0 extra vs siblings | already `Promise.all`                           |
| `get-real-position.ts`             | `loadRealPosition`                           | accounts \|\| households → RPC + membership ids | account ids for RPC | +276 ms             | RPC cannot start before ids                     |
| `savings-home-summary.ts`          | `loadSavingsHomeSummary`                     | savings → cycles                                | saving ids          | +302 ms             | no                                              |
| `home-product-summary-adapters.ts` | four summaries                               | overlap dashboard                               | none                | contended HTTP      | already parallel with dashboard                 |
| `review-items.ts`                  | `listOpenInboxItems` + layout `countUnread…` | GET items + HEAD count                          | none                | extra ~300–650 ms   | count could be derived from the GET             |

### `/vi/money`

```text
getUser 347 ms → membership 280 ms → TTFB 647 ms
then Promise.all(position, cards, savings summary, debts, loan summaries, investment summary)
  wave 1: accounts, households×2, loans, liabilities, savings, holdings, inbox HEAD (~280–293 ms)
  wave 2: ledger RPC, cycles, market/FX, card settings+months
          accounts 686 ms (second accounts select from cards path)
```

`listCreditCards` waits for card account ids then loads settings + unsettled months (**S**, +~287 ms). `getRealPosition` waits for account ids then RPC (**S**, +284 ms). Two `households` selects in the same window (**D**, wall-clock overlap so small).

### `/vi/plan`

```text
getUser 356 ms → membership 327 ms → TTFB 707 ms
then Promise.all(pulse, jar budgets, inbox, goals, upcoming)
  wave 1: jars, households×5, accounts, recurring, liabilities, schedule, goals+links (~327–522 ms)
  wave 2: period transactions×2, loan_payments×2, snapshots 703 ms, adjustments, card months
```

`getCurrentJarBudgets` / `loadJarBudgetContext`: settings \|\| pulse, **then** six-way `Promise.all` (**S**, necessary for timezone/jar ids). Snapshots were the slowest domain fetch (703 ms). `listGoals` fan-out loaded `savings` because funding links exist (**S** after links, expected). Plan hub Links **do not** set `PRODUCT_LINK_PREFETCH` (see §5).

### `/vi/money/savings`

```text
getUser 477 ms → membership 287 ms → TTFB 782 ms
then savings 382 ms → cycles 282 ms
plus second getUser 337 ms + membership (Money back-link prefetch)
```

`listSavings` is two waves plus optional per-provider `listProviderPackages` for matured rows. Layout `SavingsLifecycleSync` then POSTs write RPCs after hydrate (see safety).

### `/vi/money/investments`

```text
getUser 427 ms → membership 279 ms → TTFB 726 ms
holdings || valuations || lots   ~293–296 ms
then market instruments/prices/FX (FX 435 ms)
then listInvestmentActivities: operations 299 ms + valuations again 274 ms
```

`loadInvestmentPortfolio` **awaits holdings before activities** (`investment-queries.ts`). Activities do not need the holdings array. Estimated extra sequential cost **~300 ms** after the market wave. Duplicate `investment_valuations` (**D**).

### `/vi/money/loans`

```text
getUser 612 ms → membership 272 ms → TTFB 901 ms
loans 282 ms
(no loan_payments / loan_schedule_entries — list empty)
DCL 1195 ms
```

Batched aggregates (`loadLoanAggregatesByIds`) were **not exercised**; this household had no loans. Structural cost remains 1 list + 2 aggregate queries when rows exist, not 3N.

## 5. Prefetch analysis

### Before current optimization

Next.js default `prefetch={true}` on in-viewport Links. Bottom nav (5 tabs) + Home product rows + Money module rows each triggered a **full authenticated RSC** (auth + membership + domain). That matches the 1–8 s multi-row Network screenshot in the predecessor audit.

### Current behavior (`PRODUCT_LINK_PREFETCH = false`)

Applied on: bottom nav, Home product rows, Home Plan CTA, Money module rows, Money account/card rows.

Measured after Home load (4 s idle): **1** prefetch, `/vi/home`, 11 ms, 1.9 KB. **Not** Money/Plan/Inbox/Together full trees.

Document navigations did not sprout 5–10 competing dashboards.

### Remaining unnecessary requests

| Surface                                                                 | Behavior         | Evidence                                                                                                                |
| ----------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Plan hub `Link`s (jars, goals, calendar, recurring, ritual, exceptions) | default prefetch | Plan document: 2 RSC prefetches including `/vi/money/transactions`; hover on Recurring also prefetched a jar detail RSC |
| `TopAppBar` back `href={APP_PATH.MONEY}`                                | default prefetch | Savings window: **second `getUser` 337 ms** + extra membership while listing savings                                    |
| Login/register/forgot/welcome                                           | default prefetch | Login: 14 prefetch RSCs; one forgot-password payload **241 KB** (twice)                                                 |
| Home idle self-prefetch                                                 | tiny `/vi/home`  | 1.9 KB, negligible                                                                                                      |

Hover on Plan Recurring: 1 RSC prefetch (555 B) plus static chunks. Viewport Plan jar cards still use default prefetch.

`PRODUCT_LINK_PREFETCH = false` **does** cut competing RSC renders where it is wired. It is **not** global.

## 6. Supabase network analysis

| Layer                                     | This run                                                                    | Prior audit         |
| ----------------------------------------- | --------------------------------------------------------------------------- | ------------------- |
| SQL execution                             | not re-`EXPLAIN`’d; no plan that would explain 250 ms+                      | 0.06–1.6 ms         |
| PostgREST/Auth HTTP                       | **267–703 ms** typical; Auth user **340–612 ms**; token **1571 ms** (login) | REST RTT 202–309 ms |
| App mapping / RSC render after last fetch | remainder of DCL − last wave                                                | UNVERIFIED then     |

Traces support the same conclusion: **HTTP RTT + contention**, not Postgres CPU.

Examples (warm):

| Supabase request                                | HTTP ms | Role             |
| ----------------------------------------------- | ------: | ---------------- |
| `GET /auth/v1/user`                             | 342–607 | session          |
| `GET /rest/v1/household_members`                | 267–344 | membership       |
| `GET /rest/v1/accounts`                         | 269–686 | position / cards |
| `POST /rest/v1/rpc/get_account_ledger_balances` | 268–284 | balances         |
| `GET /rest/v1/jar_period_rule_snapshots`        |     703 | plan wave 2      |
| `GET /rest/v1/inbox_items`                      | 294–647 | home/plan        |
| `GET /rest/v1/saving_cycles`                    | 282–302 | savings wave 2   |

A route with 8–30 HTTP calls **in two or three waves** at ~300 ms RTT is 0.6–1.8 s of backend time after (or overlapping) TTFB. That fully explains 1.2–2.8 s loads without a slow query plan.

## 7. Top 10 bottlenecks

| Rank | Location                                                          | Observed latency                                     | Root cause                                   | Confidence | Potential improvement                                                                                                                  | Risk                                                                   |
| ---: | ----------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
|    1 | `getSessionUser` → `GET /auth/v1/user`                            | 340–612 ms **on every document/RSC**                 | Auth HTTP; sequential with membership        | High       | Read `sub` from warm `getClaims`; overlap `getUser` with membership (keep `getUser` for revocation)                                    | Medium: must not skip revocation; claims vs user must stay fail-closed |
|    2 | Layout `requireProductSession` membership                         | 267–344 ms **after** getUser                         | PostgREST; blocks children / TTFB            | High       | Start membership as soon as claims have `sub`; or stream layout after claims and overlap membership with page (weaker layout redirect) | Medium: onboard/login redirects must stay correct                      |
|    3 | Hosted RTT `ap-southeast-2` from VN                               | ~270–350 ms per HTTP                                 | Geography + TLS                              | High       | Closer region or local Supabase for daily work                                                                                         | Infra / ops                                                            |
|    4 | Remaining default prefetch (Plan, back links)                     | extra `getUser` 337 ms on Savings; extra RSC on Plan | Full RSC clones                              | High       | `prefetch={PRODUCT_LINK_PREFETCH}` on those Links                                                                                      | Low: first click slightly colder                                       |
|    5 | `listSavings` / home savings summary two waves                    | +280–300 ms                                          | cycles need saving ids                       | High       | One RPC `savings + current cycle`                                                                                                      | Low–med                                                                |
|    6 | `getRealPosition` / `listCreditCards` two waves                   | +270–686 ms                                          | ids then RPC/settings                        | High       | Combined RPC or embed settings on accounts                                                                                             | Med                                                                    |
|    7 | `getCurrentJarBudgets` wave 2                                     | snapshots 703 ms                                     | settings/pulse then period loads             | High       | Single period RPC                                                                                                                      | Med                                                                    |
|    8 | `listInvestmentPortfolio` holdings then activities                | +~300 ms                                             | unnecessary `await` chain                    | High       | `Promise.all(loadHoldings, listInvestmentActivities)`                                                                                  | Low                                                                    |
|    9 | Duplicate `households` / `investment_valuations` / inbox GET+HEAD | extra RTT under contention                           | parallel duplicates                          | High       | request-local `getHouseholdSettings`; reuse inbox page for badge                                                                       | Low                                                                    |
|   10 | First Home RSC after login                                        | 2426 ms / ~307 KB                                    | cold JWKS + contended queries + large flight | High       | JWKS reuse already helps later navs; reduce Home query fan-out                                                                         | Low                                                                    |

## 8. Optimization candidates

### P0 — high impact / low–moderate risk

- Overlap **`getUser` with membership** by taking `user.id` from `getClaims()` (already 1–11 ms warm). Keep `getUser()` in the same request for revocation; do not drop it.
- Set `prefetch={PRODUCT_LINK_PREFETCH}` on Plan hub Links, TopAppBar back links, and other authenticated in-viewport Links still on the default.
- Parallelize `loadHoldings` and `listInvestmentActivities`.

### P1 — high impact / moderate risk

- Combined RPCs for: real position (accounts + balances), savings list + current cycles, jar budget period bundle, credit cards + settings + unsettled months.
- Request-local `getHouseholdSettings` to collapse repeated `households` selects.
- Layout: do not block the entire child tree on membership if pages already redirect; overlap membership with page `Promise.all` **after** a claims check. Slightly weaker “layout always has membership” invariant.

### P2 — scale

- `get_loan_list_aggregates` SQL when payments/schedules approach PostgREST 1000-row cap (not hit here; **0 loans**).
- Region / local Supabase for engineering.
- Home inbox: one query shape for badge + dashboard count.

### Not worth optimizing now

- `getClaims` after JWKS warmup (1–11 ms).
- React `cache()` for `createSupabaseServerClient` / `listCreditCards` / `getPlanPulse` (already in place; traces show one client worth of auth per document).
- Cross-request LRU of balances/jars/inbox (household leak risk).
- Micro-optimizing RSC JSON at 20 transactions / empty loans (Home decoded HTML 369 KB is hydration/JS, not PostgREST).
- SQL indexes for these reads at current cardinality.

## 9. Recommended implementation order

```text
1. Prefetch=false on remaining authenticated in-viewport Links (Plan, back bar).
2. Overlap getUser with membership using getClaims().sub; keep getUser in-request.
3. Benchmark Home + Money TTFB (expect ~300 ms drop if membership overlaps getUser).
4. Promise.all holdings + activities on Investments.
5. Benchmark Investments DCL.
6. Only then: combined RPCs for position / savings cycles / jar period
   (more design, more RLS surface).
7. Stop if Home/Money TTFB is ≤ 450 ms and DCL ≤ 1.2 s on this dataset.
8. Do not add cross-request financial caches.
```

## 10. Performance target

Reasoning: warm `getUser` median ~400 ms and membership ~300 ms **in series** set a ~700 ms TTFB floor. Overlapping them sets a floor of **~max(400, 300) ≈ 400 ms** plus a few ms of claims. Page data is another **~300 ms** wave (empty Loans) to **~700 ms** (Plan snapshots / contended Home). Localhost HTML download is <100 ms after first byte.

| Route         | TTFB target  | DCL / load target | Why                                                       |
| ------------- | ------------ | ----------------- | --------------------------------------------------------- |
| Home          | **≤ 450 ms** | **≤ 1.4 s**       | Heaviest fan-out; two inner waves                         |
| Money         | **≤ 450 ms** | **≤ 1.2 s**       | Same auth floor; slightly fewer waves than Home           |
| Plan          | **≤ 450 ms** | **≤ 1.5 s**       | Snapshot wave 2 is 700 ms today; RPC would pull this down |
| Savings       | **≤ 450 ms** | **≤ 1.2 s**       | Two domain waves; avoid extra Money prefetch              |
| Investments   | **≤ 450 ms** | **≤ 1.3 s**       | Parallel activities; FX still one RTT                     |
| Loans (empty) | **≤ 450 ms** | **≤ 0.9 s**       | Already 1.2 s; auth-dominated                             |
| Loans (N>0)   | **≤ 450 ms** | **≤ 1.3 s**       | Batched aggregates; re-measure when data exists           |

Targets assume the same VN → `ap-southeast-2` path and production `next start`. They are **not** sub-100 ms; that would require a closer Auth/PostgREST region or skipping `getUser`.

`next dev` compile can still add seconds; do not mix those rows into this baseline.

## Safety / mutations

Allowed: login (`signInWithPassword` — Auth `last_sign_in_at` / session cookies) and read navigations.

**Unintended product write path:** `app/[locale]/(product)/money/savings/layout.tsx` mounts `SavingsLifecycleSync`, which after hydrate calls `syncSavingsLifecycleAction` → `backfill_legacy_savings_accounts`, `detect_matured_savings`, `enqueue_savings_maturity_cascade`. Traces recorded those RPCs immediately after the Savings visit (they landed in the next navigation’s log window).

Those functions **can `UPDATE` `saving_cycles` / `savings` and enqueue inbox work** if any cycle is past `end_date`. This profiler did not click create/save. It **did** load Savings in a real browser, which is the documented trigger. Whether any row actually changed is **unknown** (no `INSERT/UPDATE` SQL was run to inspect). **Do not undo.**

No other routes showed write RPCs. Login did not write household/ledger rows.

## Instrumentation notes

- `VINHA_PERF_TRACE=1` logs `{ op, method, path, status, ms }` only. Working on `next start`.
- `getClaims` spans of 0 ms at process start are local no-session checks.
- Browser `response` listeners must be drained (`requestfinished` + `Promise.all`); an earlier pass lost Network rows to a race. Pass 2 + server log offsets are the numbers in this file.
- Do not commit `/tmp` profiles or `output/vinha-rsc-profile*.mjs`.

## Verification

```text
Code changes: NONE
Data mutations: POSSIBLE (Savings lifecycle sync RPCs executed; net row change unknown)
Focused tests: tests/unit/perf-trace.test.ts, tests/unit/product-link-prefetch.test.ts (4 passed)
Typecheck: not required
Lint: not required
```

## P1 — Authenticated Link Prefetch Reduction

| Field          | Value                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | 8 Sep 2026                                                                                                                                    |
| Scope          | Disable eager Next.js Link prefetch on remaining authenticated product surfaces                                                               |
| Runtime        | Source + focused tests. Live `next start` / `VINHA_PERF_TRACE=1` recapture was not run (no authenticated non-production session in this pass) |
| Code changes   | `prefetch={PRODUCT_LINK_PREFETCH}` on Plan hub, TopAppBar back, HeroPillLink, Recurring rows                                                  |
| Data mutations | None                                                                                                                                          |

### Links identified

Remaining default-prefetch candidates from §5, plus the in-viewport Plan/Money CTAs they pull in:

| Surface                                           | Destination                                | Why it was expensive                                                    |
| ------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| Plan hub jar cards / see-all / empty CTA          | `/plan/jars`, `planJarPath(id)`            | Full authenticated jar list/detail RSC                                  |
| Plan hub goal cards / see-all / empty CTA         | `/plan/goals`, `planGoalPath(id)`          | Full authenticated goal list/detail RSC                                 |
| Plan hub calendar CTA                             | `/plan/calendar`                           | Authenticated calendar RSC                                              |
| Plan workspace rows (`PlanDestinationRow`)        | `/plan/recurring`, `/plan/ritual`          | Authenticated child dashboards                                          |
| Plan teaching links                               | `/money`, `/plan/goals`, `/plan/recurring` | Extra Money/Plan RSCs from the hub footer                               |
| Plan exceptions (`PlanHubExceptions`)             | jar/goal detail, view-all                  | Authenticated detail RSC                                                |
| Plan recommendations                              | jar/goal/transactions/recurring            | Observed `/vi/money/transactions` prefetch from the Plan document       |
| Plan emergency banner                             | Inbox item / Inbox                         | Authenticated Inbox RSC                                                 |
| Recurring list rows                               | `planRecurringPath(id)`                    | Hover prefetch of a child RSC (and previously jar detail from hub rows) |
| `TopAppBar` `backHref`                            | often `/money` or `/plan`                  | Savings window: **second `getUser` 337 ms** + extra membership          |
| `HeroPillLink` (Money/Savings/Investments heroes) | transactions / providers / convert         | In-viewport authenticated CTAs                                          |

### Links changed

All of the above now pass `prefetch={PRODUCT_LINK_PREFETCH}` (`false`):

- `app/[locale]/(product)/plan/page.tsx` — every Plan hub `<Link>`
- `app/[locale]/(product)/plan/plan-destination-row.tsx`
- `app/[locale]/(product)/plan/plan-hub-exceptions.tsx`
- `app/[locale]/(product)/plan/recommendation-list.tsx`
- `app/[locale]/(product)/plan/emergency-inbox-banner.tsx`
- `app/[locale]/(product)/plan/recurring/plan-recurring-row.tsx`
- `shared/patterns/top-app-bar.tsx` — back navigation
- `shared/patterns/hero-pill-link.tsx` — Money/Plan hero CTAs

No href, route, loading, or accessibility contract changed. Click still navigates; viewport/hover no longer starts a sibling authenticated RSC.

### Links intentionally left on default prefetch

| Surface                                                                                  | Why left                                                                                                      |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Login / register / forgot / welcome                                                      | Public auth routes. Large, but **not** authenticated product `getUser` + membership + domain work. Out of P1. |
| Bottom nav, Home product rows, Home Plan CTA, Money module rows, Money account/card rows | Already `PRODUCT_LINK_PREFETCH = false` from the earlier pass.                                                |
| Home idle self-prefetch of `/vi/home`                                                    | Next.js current-route hint; 1.9 KB; negligible.                                                               |
| Plan jars/goals **list** pages                                                           | Child lists, not loaded by `/vi/plan`. Same class of jar/goal detail Links; left for a later sweep.           |
| Calendar month prev/next, calendar event rows, payoff CTAs                               | Calendar document, not the Plan hub remaining stampede.                                                       |
| Ritual review, jar-detail ritual CTA, `PlanUnavailable` recovery                         | Not in-viewport on Plan hub load.                                                                             |
| Savings/loan/debt/investment **product rows**                                            | Money child lists; Savings remaining cost was the TopAppBar `/money` back prefetch, now disabled.             |
| Inbox queue / Together management rows                                                   | Not in the remaining §5 table.                                                                                |
| Form cancel Links                                                                        | Ephemeral leaves, not hub stampede.                                                                           |

No global Link monkey-patch. No Next.js config change.

### Before / after network observations

**Before (historical, §2 / §5):**

- Plan document: **2 RSC prefetches**, including `/vi/money/transactions`.
- Hover on Plan Recurring: extra RSC (jar detail observed).
- Savings document: **2 prefetch** of `/vi/money` → second `getUser` **337 ms** + extra membership while listing savings.

**After (code contract):**

```text
Link enters viewport/hover
        ↓
prefetch={false}  →  no authenticated RSC clone

user clicks
        ↓
normal navigation (getUser + membership + domain, once)
```

Live `next start` + `VINHA_PERF_TRACE=1` recapture was **not** repeated here: no authenticated non-production browser session was available, and this pass must not use production credentials or mutate household data. Framework behavior for `prefetch={false}` is that viewport and hover prefetch are skipped. TTFB of the clicked route is unchanged; competing RSC/`getUser` clones from idle Plan/Savings chrome should drop to **0**.

### Focused tests

```text
tests/unit/product-link-prefetch.test.ts              3 passed
tests/unit/hero-pill-link.test.tsx                     5 passed
tests/unit/plan-ui-polish.test.tsx                     6 passed
tests/unit/plan-hub-progressive-disclosure.test.tsx    6 passed
```

`product-link-prefetch.test.ts` now asserts `prefetch={PRODUCT_LINK_PREFETCH}` on the new files and that **every** `<Link>` on the Plan hub page carries the flag.

Typecheck: `npx tsc --noEmit` — **passed**.

Targeted ESLint on changed TS/TSX files — **passed**.

Full repository test suite: not run.

### Remaining prefetch sources

See the intentionally-unchanged table. Highest leftover authenticated viewport prefetch, if a later pass wants it: Plan jars/goals list cards, calendar event rows, and Money child product rows.

### Next performance phase (not this task)

```text
P2 — overlap getUser() with membership resolution using getClaims().sub
```

Keep `getUser()` in-request for revocation. Do not skip it.

## P2 — getUser / Membership Overlap

| Field          | Value                                                                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | 8 Sep 2026                                                                                                                                                                                                              |
| Scope          | Overlap `getUser()` with membership lookup using verified `getClaims().sub`                                                                                                                                             |
| Runtime        | Source + focused tests. Live `next start` / `VINHA_PERF_TRACE=1` recapture was not run (no authenticated non-production session; local env points at hosted Supabase and this pass must not use production credentials) |
| Code changes   | Shared session helper starts membership from verified JWT `sub` in parallel with `getUser()`                                                                                                                            |
| Data mutations | None                                                                                                                                                                                                                    |

### Old waterfall

```text
proxy
└── getClaims()                 ~1–11ms warm
        ↓
layout requireProductSession
└── getUser()                   ~340–612ms
        ↓
membership lookup               ~267–344ms
        ↓
page/domain queries
```

Membership waited for `user.id` from `getUser()` even though the verified JWT subject was already available from `getClaims()`.

### New dependency graph

```text
getClaims()
   |
   +--------------------+
   |                    |
   v                    v
getUser()           membership(sub)
   |                    |
   +---------+----------+
             |
             v
      authenticated page
```

`getSessionMembership()` starts `getUser()` immediately, awaits verified `claims.sub`, then `Promise.all`s the in-flight user lookup with `resolveActiveMembership(subject)`. The product session is valid only when all of these succeed and `user.id === claims.sub`.

### Files changed

| File                                                         | Why                                                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `modules/tenancy/application/get-verified-auth-subject.ts`   | Request-local `getClaims()` → verified `sub`. Fail-closed.                                    |
| `modules/tenancy/application/get-session-membership.ts`      | Overlap composition. Does not authenticate on claims alone.                                   |
| `modules/tenancy/application/require-product-session.ts`     | Layout/Together gate uses the shared helper. Public `{ locale, user, membership }` unchanged. |
| `modules/tenancy/application/assert-money-action-allowed.ts` | Server-action / query gate uses the same helper so it also overlaps.                          |
| `modules/tenancy/application/resolve-active-membership.ts`   | Named perf span; still keyed by user id; request-local `cache()`.                             |
| `modules/platform/application/perf-trace.ts`                 | `membership.resolve` span; `at` timestamp so later traces can prove overlap.                  |
| `tests/unit/session-membership.test.ts`                      | Tests A–E for overlap, fail-closed, and request-local dedup.                                  |
| `tests/unit/require-product-session.test.ts`                 | Existing login/onboard/ready redirects against the new helper.                                |
| `tests/unit/auth-session.test.ts`                            | Allowance mocks now include `getClaims()`.                                                    |

Product pages (Home, Money, Plan, Savings, Investments, Loans) still call `getSessionUser()` then `resolveActiveMembership(user.id)`. After the layout gate those are React `cache()` hits on the same request, so they do not add a second `getUser` or membership HTTP call.

### Security reasoning

- `getClaims()` remains required. No subject → no membership query, session fails closed.
- `getUser()` remains required. Claims + membership without a current user do not authenticate.
- Membership authorization remains required. `getUser()` without an active household still goes to onboard / `NO_MEMBERSHIP`.
- Fail-closed on missing claims, missing `sub`, `getUser` failure, membership failure, and `user.id !== claims.sub`.
- Uses Supabase `getClaims()` (JWKS-verified). No manual JWT parse, no `getSession()` as authorization, no client-side identity, no service-role, no RLS or schema changes.
- No cross-request user cache. React `cache()` only.

### Request-local caching behavior

```text
1 × getClaims   (RSC; proxy still has its own getClaims)
1 × getUser
1 × membership lookup
```

`getVerifiedAuthSubject`, `getSessionUser`, `resolveActiveMembership`, and `getSessionMembership` are all React `cache()` wrappers. Multiple layout/page/action callers in one RSC share those promises. A prefetch remains a new request.

### Focused tests

```text
tests/unit/session-membership.test.ts       10 passed
tests/unit/require-product-session.test.ts   6 passed
tests/unit/auth-session.test.ts              9 passed
tests/unit/product-layout-auth.test.ts       2 passed
tests/unit/perf-trace.test.ts                2 passed
tests/unit/request-local-query-cache.test.ts 5 passed
tests/unit/resolve-auth-entry.test.ts        6 passed
```

Result: **40 passed**.

Proved:

- Membership starts from verified `claims.sub` before `getUser()` resolves.
- Claims alone do not authenticate.
- No membership query without a valid subject.
- Duplicate callers in one request: 1 × `getUser`, 1 × membership, 1 × `getClaims`.
- Existing unauthenticated / no-membership / ready redirects and money-action denial reasons are unchanged.

Typecheck: `npx tsc --noEmit` — **passed**.

Targeted ESLint on changed TS files — **passed**.

Full repository test suite: not run.

### Benchmark results

Live `next start` + `VINHA_PERF_TRACE=1` recapture was **not** run. There is no local Supabase. `.env.local` points at hosted Auth/PostgREST, and this pass must not use production credentials or write household data. Unit tests prove the overlap contract (membership query starts while `getUser()` is still pending). Expected TTFB floor if overlap holds on the §2 dataset is `max(getUser, membership)` instead of `getUser + membership` (~300 ms less). That is not a measured result.

| Route       | Baseline TTFB |     New TTFB | Delta |
| ----------- | ------------: | -----------: | ----: |
| Home        |        780 ms | not measured |     — |
| Money       |        647 ms | not measured |     — |
| Plan        |        707 ms | not measured |     — |
| Savings     |        782 ms | not measured |     — |
| Investments |        726 ms | not measured |     — |
| Loans       |        901 ms | not measured |     — |

Traces: not recaptured. Instrumentation now logs `at` plus `membership.resolve` so a later safe session can show `auth.getUser` and `membership.resolve` starting together rather than in series.

### Remaining bottlenecks (not this task)

Hosted RTT (~270–350 ms per HTTP) still dominates after this overlap. Inner two-wave domain queries (accounts → ledger RPC, savings → cycles, holdings → market/FX, jar snapshots) still lengthen DCL after TTFB. Combined RPCs, `getRealPosition`, savings cycles, jar budget snapshots, investment valuation queries, SQL indexes, schema, and cross-request caching were not touched.

## P3 — Investments Parallelization

| Field          | Value                                                                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | 8 Sep 2026                                                                                                                                                                                                              |
| Scope          | Remove the unnecessary `holdings → activities` wait inside `loadInvestmentPortfolio`                                                                                                                                    |
| Runtime        | Source + focused tests. Live `next start` / `VINHA_PERF_TRACE=1` recapture was not run (no authenticated non-production session; local env points at hosted Supabase and this pass must not use production credentials) |
| Code changes   | `Promise.all(loadHoldings(), listInvestmentActivities())` in portfolio orchestration                                                                                                                                    |
| Data mutations | None                                                                                                                                                                                                                    |

### Previous dependency

```text
loadInvestmentPortfolio
        |
        +--> loadHoldings
        |      holdings || valuations || lots
        |      then market instruments / prices / FX (needs instrument ids)
        |
        +--> await holdings
                 |
                 v
             listInvestmentActivities
                 |
                 +--> operations
                 |
                 +--> investment valuations
```

`listInvestmentActivities()` started only after `loadHoldings()` resolved. Historical Investments document: holdings/valuations/lots ~293–296 ms, then market/FX (FX 435 ms), then activities operations 299 ms + valuations again 274 ms. Estimated extra sequential cost **~300 ms** after the market wave.

### Verified dependency analysis

Inspected `modules/investments/application/queries/investment-queries.ts` (not assumed from the earlier diagram).

| Question                                          | Answer                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| What `listInvestmentActivities` requires          | `assertMoneyActionAllowed()` household id; optional `holdingId` filter                                |
| Depends on loaded holdings array?                 | **No.** Portfolio calls it with no argument. It queries `investment_operations` by household.         |
| Depends on holdings valuation/lot/market results? | **No.** It runs its own operations + valuations `Promise.all`.                                        |
| Can activities and holdings start concurrently?   | **Yes.** Shared inputs are the cached allowance + server client.                                      |
| What genuinely needs both results                 | Portfolio aggregates only: realized/income/fees from activities; value/basis/allocation from holdings |

`loadHoldings` still has a real inner waterfall: holdings/valuations/lots in parallel, then `listActiveMembershipIds` (owner ids), then market instruments/prices/FX keyed by instrument ids. That sequence was not changed.

### New orchestration

```text
loadInvestmentPortfolio
        |
        +----------------------+
        |                      |
        v                      v
loadHoldings               listInvestmentActivities
holdings / valuations       operations
/ lots / market / FX       / investment valuations
        |                      |
        +----------+-----------+
                   |
                   v
              final portfolio
```

```ts
const [holdings, activities] = await Promise.all([
  loadHoldings(),
  listInvestmentActivities(),
]);
if (!holdings || !activities) return null;
```

Signatures, return shape, sorting, pagination, filtering, FX, valuation math, activity mapping, authorization (`assertMoneyActionAllowed`), and `cache(loadInvestmentPortfolio)` are unchanged. If either read returns `null`, the function still returns `null` (no partial portfolio). On the failure path the sibling read may now also start; the observable result remains `null`.

### Duplicate valuation findings

```text
portfolio
  ├── loadHoldings → investment_valuations (latest-per-holding)
  └── listInvestmentActivities → investment_valuations (all rows as timeline)
```

This is **required duplication with different semantics**, not an accidental identical query.

| Caller                     | Select extras                     | Order                                    | Use                                                             |
| -------------------------- | --------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `loadHoldings`             | `created_at`, `source`            | `valuation_date` desc, `created_at` desc | Latest row per holding → `resolveInvestmentValuation`           |
| `listInvestmentActivities` | `id` (no `created_at` / `source`) | `valuation_date` desc                    | Every row mapped to `InvestmentActivityType.VALUATION` timeline |

Unifying them would mean combining queries or widening one select and sharing it. P3 does not combine queries or add an RPC. Request-local `cache()` would not collapse these two shapes, and both now start in the same wave so a shared helper would still need one of them to wait. Left for a later phase.

### Files changed

| File                                                            | Why                                                             |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| `modules/investments/application/queries/investment-queries.ts` | Parallel holdings + activities in `loadInvestmentPortfolio`     |
| `tests/unit/investment-portfolio-orchestration.test.ts`         | Tests A–C: overlap timing, result equivalence, failure → `null` |

Auth/membership (`getClaims`, `getUser`, `requireProductSession`, `assertMoneyActionAllowed`) was not modified.

### Focused tests

```text
tests/unit/investment-portfolio-orchestration.test.ts   4 passed
tests/unit/investment-portfolio-view-model.test.ts      3 passed
tests/unit/investment-accounting.test.ts                 11 passed
tests/unit/investment-commands.test.ts                  11 passed
tests/unit/investment-money.test.ts                      2 passed
tests/unit/investment-historical-import.test.ts          9 passed
tests/unit/investment-domain-foundation.test.ts            7 passed
tests/unit/investment-ui-polish.test.tsx                 9 passed
tests/unit/investment-opening-ui.test.tsx               2 passed
tests/unit/investment-asset-picker.test.ts               3 passed
tests/unit/investment-operation-form.test.tsx           6 passed
tests/unit/investment-operation-view-model.test.ts     8 passed
tests/unit/investment-ux.test.ts                        3 passed
tests/unit/investment-lifecycle.test.ts                 6 passed
tests/unit/investment-market-valuation.test.tsx        5 passed
tests/unit/market-valuation-query.test.ts               1 passed
tests/unit/list-market-instruments.test.ts                 2 passed
```

Result: **92 passed**.

Proved:

- Holdings table query and operations table query both start while the other is still pending (controllable delayed promises; not a source-text `Promise.all` assertion).
- Same mocked holdings + activities → identical ordering, totals, realized/income/fees, and valuation fields.
- Holdings error or activities error → `null`, never a partial portfolio.

Typecheck: `npx tsc --noEmit` — **passed**.

Targeted ESLint on changed TS files — **passed**.

Full repository test suite: not run.

### Benchmark results

Live `next start` + `VINHA_PERF_TRACE=1` recapture was **not** run. `.env.local` points at hosted Auth/PostgREST (`*.supabase.co`), and this pass must not use production credentials or write household data. Unit timing proves the overlap contract. Expected Investments DCL improvement if overlap holds on the §2 dataset is **one hosted RTT (~270–350 ms)** on the activities wave that previously waited for holdings. That is **not** a measured result.

| Route       | Baseline TTFB |     New TTFB | Baseline load | New load     | Delta |
| ----------- | ------------: | -----------: | ------------: | ------------ | ----: |
| Investments |        726 ms | not measured |       2050 ms | not measured |     — |

Expected (structural, not live-measured):

```text
BEFORE

holdings / valuations / lots
   ↓
market / FX
   ↓
activities / operations / valuations

AFTER

holdings / valuations / lots ──── market / FX ──┐
                                                   ├── portfolio
activities / operations / valuations ─────────────┘
```

Activities can overlap the holdings **and** the market/FX wave. Market/FX still waits on instrument ids from holdings.

### Remaining Investment bottlenecks (not this task)

- `loadHoldings` market wave still needs instrument ids (~270–435 ms after holdings/valuations/lots).
- Duplicate `investment_valuations` reads (different semantics; left unchanged).
- Hosted RTT (~270–350 ms per HTTP) and auth TTFB (P2 overlap not live-measured).
- Combined RPCs, `getRealPosition`, savings cycles, jar budget snapshots, SQL indexes, schema, and cross-request caching were not touched.

## P4 — Post-Optimization Benchmark

| Field          | Value                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | 8 Sep 2026                                                                                                                                                                                    |
| Scope          | Measurement only after P0–P3. No application code, query, RPC, auth, prefetch, cache, schema, or lifecycle changes                                                                            |
| Runtime        | `next start` (production build of the current working tree) on `127.0.0.1:3010` with `VINHA_PERF_TRACE=1`                                                                                     |
| Viewport       | 390×844, headless Chromium (same as §2)                                                                                                                                                       |
| Locale         | `/vi`                                                                                                                                                                                         |
| Authentication | **No valid session.** Existing Playwright storageState refresh token was rejected. Production/personal credentials were not typed. Live authenticated product timings were **not collected**  |
| Supabase       | Hosted `*.supabase.co` (`ap-southeast-2`). DNS/network from this machine works when the Node process is not sandboxed                                                                         |
| Data mutations | None. Savings was not rendered authenticated. Write-RPC scan of the traced server log: no `backfill_legacy_savings_accounts`, `detect_matured_savings`, or `enqueue_savings_maturity_cascade` |
| Code changes   | None (application). This section is audit text only                                                                                                                                           |

### Environment

- Next.js **16.3.1** production `next build` then `next start` (not `next dev`). Build compiled successfully.
- Traced server: `VINHA_PERF_TRACE=1 npx next start -p 3010 -H 127.0.0.1`.
- First traced process was started without outbound DNS; Auth to hosted Supabase failed (`ENOTFOUND`). That process was stopped. A second process with full network was used for all numbers below.
- A leftover `next dev` on port 3000 was not used and was not stopped.
- Session check: `output/playwright/.auth/user.json` exists (one `sb-*-auth-token` cookie). Probe `GET /vi/home` with that cookie returned **307** `Location: /vi/login`. Server log: `POST /auth/v1/token` **400** `refresh_token_not_found` (**1538 ms**), then fail-closed. No `membership.resolve`. No PostgREST product queries.
- `.env.local` `E2E_USER_EMAIL` is a personal-domain mailbox, not a dedicated non-production fixture. This pass did **not** fill the login form.

### Results

Authenticated product documents were not measured. Deltas are therefore not computed. Status is **NOT MEASURED**, not PASS/CLOSE/MISS.

| Route       | Baseline TTFB | Current TTFB | Delta | Baseline Total | Current Total | Status       |
| ----------- | ------------: | -----------: | ----: | -------------: | ------------: | ------------ |
| Home        |        780 ms |          n/a |     — |        2746 ms |           n/a | NOT MEASURED |
| Money       |        647 ms |          n/a |     — |        1640 ms |           n/a | NOT MEASURED |
| Plan        |        707 ms |          n/a |     — |        1871 ms |           n/a | NOT MEASURED |
| Savings     |        782 ms |          n/a |     — |        1755 ms |           n/a | NOT MEASURED |
| Investments |        726 ms |          n/a |     — |        2050 ms |           n/a | NOT MEASURED |
| Loans       |        901 ms |          n/a |     — |        1195 ms |           n/a | NOT MEASURED |

Safe unauthenticated instrumentation (warm production server, 390×844 for Playwright; curl has no viewport):

| Surface                        | n   | TTFB min / med / max | DCL / load (Playwright) | Notes                                                                                        |
| ------------------------------ | --- | -------------------: | ----------------------: | -------------------------------------------------------------------------------------------- |
| `/vi/login` Playwright         | 3   |      17 / 19 / 31 ms |           41–68 ms load | Decoded HTML **235 074 B**, encoded **55 053 B**. 0 product RSC during the document itself   |
| `/vi/login` curl (last 3 of 5) | 3   |      12 / 13 / 13 ms |                     n/a | Same 235 074 B body                                                                          |
| Six product routes, no cookie  | 1   |             16–20 ms |                     n/a | **307** to `/vi/login`. No membership, no PostgREST. Not comparable to §2 authenticated TTFB |
| `/vi/home` stale cookie        | 1   |              1798 ms |                     n/a | Refresh-token 400, then 307 login. **Not** a product TTFB                                    |

Playwright followed the 307 and landed on `/vi/login` for all six product paths (`redirectedToLogin: true`). Those navigations are login documents, not Home/Money/Plan/Savings/Investments/Loans RSC trees.

### Authentication (P2)

**Not verified on an authenticated product document.**

Invalid-session probe (stale cookie, full network):

```text
proxy getClaims
  POST /auth/v1/token   at=34000  ms=1538  status=400
  auth.getClaims        at=33998  ms=1553
        ↓ (claims failed; no sub)
RSC
  auth.getUser          at=35633  ms=27
  auth.getClaims        at=35633  ms=27
  membership.resolve    not present
  page queries          not present
  → 307 /vi/login
```

This shows fail-closed behavior and a sequential refresh-then-user pair on a **dead** token. It does **not** prove the intended graph:

```text
getClaims
     |
     +---- getUser ----------------+
     |                             |
     +---- membership -------------+
                                   v
                             page queries
```

No `membership.resolve` span was logged in this entire P4 server process. Do not infer overlap from `Promise.all` in `get-session-membership.ts`.

### Prefetch (P1)

**Authenticated Plan / Money / Savings / TopAppBar / HeroPillLink / recurring-row prefetch was not observed**, because those trees never rendered.

What was observed on public login (intentionally left on default prefetch in P1):

- After `/vi/login` load, 4 s idle: repeated RSC prefetches of `/vi/register` and `/vi/forgot-password` (`next-router-prefetch: 1`).
- Those are public auth routes, not authenticated product `getUser` + membership clones.

P1’s product-surface claim remains a **code contract** (`prefetch={PRODUCT_LINK_PREFETCH}` / `false`) until a signed-in recapture.

### Investments (P3)

**Not verified.** Holdings, activities, market/FX, and portfolio completion timestamps were not recorded. No `/rest/v1/investment_holdings` or `/rest/v1/investment_operations` fetches appeared in the P4 log.

Do not treat the P3 `Promise.all(loadHoldings, listInvestmentActivities)` source change as a measured waterfall removal.

### Remaining bottlenecks

Ranked from **this run’s evidence**, then from the still-unverified historical map. Live authenticated costs are unknown.

1. **No safe authenticated session for recapture** — blocks every product TTFB/DCL/P1/P2/P3 claim. Measured: stale cookie refresh **1538 ms** + 307.
2. **Hosted Auth RTT still real** — even a failed `POST /auth/v1/token` was **1538 ms** on this path (VN → `ap-southeast-2`). Same class as §6, not SQL.
3. **Historical inner waves (unverified vs current tree)** — accounts → ledger RPC; savings → cycles; holdings → market/FX; jar settings → snapshots. Still the §7 candidates after auth overlap, if P2 actually lands.
4. **Historical duplicate reads** — `households`, inbox GET+HEAD; investment valuations remain different semantics unless implementation evidence changes.
5. **Rendering / RSC** — login decoded **235 KB** / encoded **55 KB**. Product HTML sizes from §2 were not recaptured.
6. **Prefetch** — public login still prefetches register/forgot. Authenticated remaining prefetch: **unknown**.

### Performance targets

| Route       | TTFB target | Total/load target | Status       |
| ----------- | ----------: | ----------------: | ------------ |
| Home        |     ≤450 ms |            ≤1.4 s | NOT MEASURED |
| Money       |     ≤450 ms |            ≤1.2 s | NOT MEASURED |
| Plan        |     ≤450 ms |            ≤1.5 s | NOT MEASURED |
| Savings     |     ≤450 ms |            ≤1.2 s | NOT MEASURED |
| Investments |     ≤450 ms |            ≤1.3 s | NOT MEASURED |
| Loans       |     ≤450 ms |            ≤0.9 s | NOT MEASURED |

Home/Money **cannot** be declared inside or outside the “stop optimizing” band (`TTFB ≤450 ms`, DCL/load ≤1.2–1.4 s).

### Recommendation

**Do not implement another query, RPC, or auth optimization now.**

The single next candidate is **a safe authenticated recapture of this same P4 protocol** (warm `next start`, `VINHA_PERF_TRACE=1`, 390×844, `/vi`, three document loads per route, no Savings writes). Until that exists, P2 overlap, P1 product prefetch, P3 holdings/activities concurrency, deltas vs §2, and target PASS/CLOSE/MISS are all unknown.

If that recapture shows Home/Money still missing TTFB, inspect `auth.getUser` vs `membership.resolve` `at` timestamps first. If TTFB meets the floor and DCL still misses, the historically strongest remaining inner wave on Home **and** Money is `getRealPosition` (account ids → `get_account_ledger_balances`). That is a hypothesis from §4, not a measurement from this pass.

### Measurement limitations

- No valid non-production authenticated session. Stale Playwright cookie is not a session.
- Production/personal E2E mailbox was not used.
- No local Supabase.
- First traced server lacked DNS; those `ENOTFOUND` spans are discarded.
- Unauthenticated 307 timings are layout/proxy fail-closed, ~16–20 ms, and must not be compared to §2.
- Savings read-only behavior was confirmed only as “authenticated Savings never rendered, and no lifecycle RPCs in the log,” plus the P0 code contract.
- Focused tests were not re-run; this pass is runtime measurement. Application code was not modified.

### Verification

```text
Code changes: NONE (application). Audit append only
Data mutations: NONE
Live authenticated product traces: NONE
Focused tests: not run
Typecheck / lint / full suite: not run (measurement-only; no application edits)
```

## P4.1 — Safe Authenticated Recapture

| Field          | Value                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | 8 Sep 2026                                                                                                                                                  |
| Scope          | Measurement-only recapture after P4. No application, query, RPC, auth, prefetch, cache, schema, or lifecycle changes                                        |
| Runtime        | `next start` (fresh production build) on `127.0.0.1:3010`, `VINHA_PERF_TRACE=1`                                                                             |
| Viewport       | 390×844, headless Chromium                                                                                                                                  |
| Locale         | `/vi`                                                                                                                                                       |
| Authentication | Dedicated `@example.com` ownership-test A from env. Personal-domain `E2E_USER_EMAIL` was **not** used. Login succeeded; user had **no household** (onboard) |
| Supabase       | Hosted `*.supabase.co`                                                                                                                                      |
| Data mutations | None. No household created. Savings was not opened. Full-log write-RPC scan: none of the three lifecycle RPCs                                               |
| Code changes   | None (application). This section is audit text only                                                                                                         |

### Environment

- Next.js 16.3.1 production `next build` then `VINHA_PERF_TRACE=1 next start -p 3010 -H 127.0.0.1`.
- Credentials loaded from env only. Not printed. Not copied into this audit.
- `E2E_USER_EMAIL` is a personal-domain mailbox → skipped (task rule: do not use a real/personal account).
- `OWNERSHIP_TEST_A_*` is the documented dedicated fixture identity (`@example.com`). Login filled the login form and submitted once.
- After password grant, the app landed on `/vi/together/onboard`. Recapture **stopped**. No product navigation, no forms, no fixture setup, no household create.

### Results

Product documents were not reached. Status is **NOT MEASURED**.

| Route       | Baseline TTFB | Current TTFB | Delta | Baseline Total | Current Total | Status       |
| ----------- | ------------: | -----------: | ----: | -------------: | ------------: | ------------ |
| Home        |        780 ms |          n/a |     — |        2746 ms |           n/a | NOT MEASURED |
| Money       |        647 ms |          n/a |     — |        1640 ms |           n/a | NOT MEASURED |
| Plan        |        707 ms |          n/a |     — |        1871 ms |           n/a | NOT MEASURED |
| Savings     |        782 ms |          n/a |     — |        1755 ms |           n/a | NOT MEASURED |
| Investments |        726 ms |          n/a |     — |        2050 ms |           n/a | NOT MEASURED |
| Loans       |        901 ms |          n/a |     — |        1195 ms |           n/a | NOT MEASURED |

### Authentication (P2)

**Not verified on a product document** (Home/Money/Plan/Savings/Investments/Loans).

The onboard layout still ran `getClaims` / `getUser` / `membership.resolve`. Cold JWKS. Representative pairing after `POST /auth/v1/token` 200 (**1295 ms**):

```text
GET /auth/v1/user              at=15171  ms=787   end=15958
auth.getClaims (JWKS)          at=15191  ms=776   end=15967
GET /rest/v1/household_members at=15965  ms=300
membership.resolve             at=15965  ms=301   end=16266
```

`membership.start (15965) < getUser.end (15958)` is **false**. Membership HTTP started ~7 ms after `getUser` HTTP finished.

A later pair on the same onboard burst:

```text
auth.getUser                   at=15977  ms=349   end=16326
membership.resolve             at=16326  ms=654
```

`membership.start == getUser.end`. Still not in-flight overlap of the two HTTP calls.

Interpretation (onboard, cold JWKS, no household): membership waits for verified `claims.sub`; cold JWKS made `getClaims` ~780 ms, so `getUser` finished first and membership ran next. That does **not** disprove warm-JWKS overlap on a household session. It also does **not** confirm P2 on product TTFB. Do not treat this as a product-route result.

### Prefetch (P1)

**Not verified.** Plan hub, Savings TopAppBar `/money` back link, HeroPillLink, and recurring rows never rendered.

### Investments (P3)

**Not verified.** `/vi/money/investments` was not opened. No holdings/operations fetches.

### Savings mutation check

**Not executed as a Savings document.** Stopped at onboard before `/vi/money/savings`.

Full traced-server scan for this process: **no** `backfill_legacy_savings_accounts`, `detect_matured_savings`, or `enqueue_savings_maturity_cascade`.

### Performance targets

All six routes: **NOT MEASURED**.

### Remaining bottlenecks

1. **No household on the only safe dedicated account** — blocks every product metric. Ownership-test A authenticates and is sent to onboard.
2. **Personal-domain E2E mailbox** — cannot be used under this task’s rule, even though that is the historical §2 dataset.
3. **Cold JWKS / Auth RTT** — onboard traces: token **1295 ms**, JWKS **~760–830 ms**, `getUser` **349–787 ms**, membership **300–654 ms**. Same hosted RTT class as §6.
4. Historical inner domain waves — still unmeasured on this tree.

### Recommendation

**Do not implement another optimization.**

The single next step is a **dedicated test user that already has an active household** (not a personal mailbox, and not created during this measurement task). Then repeat this P4.1 protocol. Until that exists, do not start Combined RPC, `getRealPosition` merging, or further auth changes.

Onboard P2 traces are not a substitute for warm product-document `at` timestamps.

### Measurement limitations

- Dedicated ownership-test A has no membership; recapture stopped by design.
- Personal `E2E_USER_EMAIL` skipped.
- Fixture `setup` was not run (would create a household).
- Product TTFB/DCL/RSC/prefetch/P3 were not collected.
- Onboard P2 pairs are cold-JWKS and may include overlapping RSC requests from the login redirect; they are not a single Home document.
- Application code was not modified.

### Verification

```text
Code changes: NONE (application). Audit append only
Data mutations: NONE (login Auth token only; no household/ledger writes from this pass)
Live authenticated product traces: NONE
Focused tests: not run
```

## P4.1a — E2E Credential Resolution Diagnosis

| Field          | Value                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Date           | 9 Sep 2026                                                                                       |
| Scope          | Diagnose why P4.1 logged in as `@example.com` instead of `.env.local` `E2E_USER_EMAIL`           |
| Code changes   | Profiler credential selection only (`output/vinha-rsc-profile-p41.mjs`, gitignored). No app code |
| Data mutations | None                                                                                             |

### What source supplied the credential previously

P4.1 did **not** lose `.env.local`. It loaded it, then **ignored** `E2E_USER_EMAIL`.

| Item                    | Value                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| Command                 | `node output/vinha-rsc-profile-p41.mjs`                                                |
| Env loader              | `@next/env` `loadEnvConfig(process.cwd())` — loads `.env.local`                        |
| Shell override          | None. `E2E_USER_*` and `OWNERSHIP_TEST_A_*` were unset in the process before file load |
| `.env` / `.env.test`    | Absent                                                                                 |
| Playwright / CI         | Not used for P4.1 login                                                                |
| Selected keys           | `OWNERSHIP_TEST_A_EMAIL` / `OWNERSHIP_TEST_A_PASSWORD`                                 |
| Selected domain         | `example.com`                                                                          |
| `.env.local` E2E domain | `gmail.com` (present; not selected)                                                    |

Hard-coded selection in the P4.1 script (before the P4.1a fix):

```text
EMAIL    = process.env.OWNERSHIP_TEST_A_EMAIL
PASSWORD = process.env.OWNERSHIP_TEST_A_PASSWORD
if E2E domain is not example.com → skip E2E (comment only; still uses ownership)
```

`.env.local` was loaded. `E2E_USER_EMAIL` was present. The script refused it because the domain was not `example.com`, then used the ownership-test fallback. That was an agent policy choice in the profiler, **not** Next.js/Playwright env precedence.

### Minimal fix

Profiler now resolves **only** `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` after `loadEnvConfig`. Explicit switch: `VINHA_PROFILE_CREDENTIAL_SOURCE=e2e` (default). No `OWNERSHIP_TEST_A_*` fallback. Safe stderr: source, domain, presence — never email or password.

### Safe validation

```text
node output/vinha-profile-credential-diagnose.mjs
  credentialSource = e2e
  loadedBy = loadEnvConfig(process.cwd())
  domain = gmail.com
  emailPresent = true
  passwordPresent = true
  ownershipUsedAsFallback = false

tests/unit/e2e-env.test.ts  4 passed
```

No login, no household, no product pages in P4.1a.

### Ready for recapture?

Configuration now points at `.env.local` `E2E_*`. Using that mailbox for product timings requires explicit authorization (personal-domain mailbox). Application code unchanged.

## P4.1b — Authorized E2E Recapture

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Date           | 9 Sep 2026                                                                                     |
| Scope          | Measurement only. Same protocol as P4.1, credentials from `.env.local` `E2E_*` after P4.1a fix |
| Runtime        | `next start` production build, `127.0.0.1:3010`, `VINHA_PERF_TRACE=1`                          |
| Viewport       | 390×844, headless Chromium                                                                     |
| Locale         | `/vi`                                                                                          |
| Authentication | `.env.local` `E2E_USER_EMAIL` (domain `gmail.com`), explicitly authorized for this recapture   |
| Samples        | Warm-up discarded; **3** document loads per route. Numbers below are **median** unless noted   |
| Data mutations | None observed. Savings mutation scan: no lifecycle RPCs                                        |
| Code changes   | None (application)                                                                             |

Credentials were read via `loadEnvConfig`. They are not recorded here.

### Results

| Route       | Baseline TTFB | Current TTFB | Delta | Baseline Total | Current Total | Status                                       |
| ----------- | ------------: | -----------: | ----: | -------------: | ------------: | -------------------------------------------- |
| Home        |        780 ms |       392 ms |  −388 |        2746 ms |       1803 ms | TTFB **PASS** / load **MISS** (target ≤1.4s) |
| Money       |        647 ms |       332 ms |  −315 |        1640 ms |        929 ms | **PASS** / **PASS**                          |
| Plan        |        707 ms |       298 ms |  −409 |        1871 ms |       1431 ms | **PASS** / **PASS**                          |
| Savings     |        782 ms |       295 ms |  −487 |        1755 ms |       1415 ms | TTFB **PASS** / load **MISS** (target ≤1.2s) |
| Investments |        726 ms |       309 ms |  −417 |        2050 ms |       1361 ms | TTFB **PASS** / load **CLOSE** (≤1.3s)       |
| Loans       |        901 ms |       471 ms |  −430 |        1195 ms |        786 ms | TTFB **CLOSE** (≤450ms) / load **PASS**      |

Min / median / max (navigation timing):

| Route       | TTFB (min/med/max) | Load (min/med/max) | Encoded | Decoded |
| ----------- | ------------------ | ------------------ | ------: | ------: |
| Home        | 322 / 392 / 560    | 1521 / 1803 / 1935 |  78 563 | 369 413 |
| Money       | 301 / 332 / 341    | 891 / 929 / 1278   |  77 176 | 373 865 |
| Plan        | 294 / 298 / 335    | 1407 / 1431 / 1477 |  70 037 | 343 401 |
| Savings     | 287 / 295 / 330    | 1366 / 1415 / 1434 |  74 091 | 484 909 |
| Investments | 292 / 309 / 432    | 1282 / 1361 / 1513 |  71 337 | 372 075 |
| Loans       | 296 / 471 / 516    | 656 / 786 / 808    |  ~63.5k | ~290.6k |

### Authentication (P2) — runtime confirmed

Warm product documents (example **home-r2**):

```text
auth.getClaims        at=33192  ms=16    end=33208
auth.getUser          at=33192  ms=292   end=33484
membership.resolve    at=33208  ms=270   end=33478
GET /auth/v1/user     at=33196  ms=288
GET household_members at=33208  ms=269
```

`membership.start (33208) < getUser.end (33484)` → **true**. Overlap **270 ms**.

Same pattern on Money, Plan, Savings, Investments, Loans (overlap 269–312 ms). `getClaims` warm 6–16 ms. TTFB now tracks **max(getUser, membership)** (~280–440 ms), not the historical sum (~700–900 ms).

### Prefetch (P1)

| Surface                           | Authenticated RSC prefetch                                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan document + 4 s idle          | **0**. No jars/goals/calendar/recurring/ritual/exceptions/inbox clones                                                                        |
| Plan recurring hover              | **0**                                                                                                                                         |
| Money document + 4 s idle         | **0**                                                                                                                                         |
| Savings idle (TopAppBar `/money`) | **0**. Historical second `getUser` from Money back-prefetch is gone                                                                           |
| Home document                     | 1 self-prefetch of `/vi/home` (same class as §5; tiny)                                                                                        |
| Savings document                  | 2 of 3 loads prefetched an in-viewport **savings detail** child row. Not `/vi/money`. List-row Links were intentionally left on default in P1 |

Do not count later `page.goto` navigations as prefetch.

### Investments (P3) — runtime confirmed

**investments-r2:**

```text
holdings  GET investment_holdings     at=51059  end=51338  (279 ms)
activities GET investment_operations  at=51063  end=51352  (289 ms)
valuations (both shapes)              at=51063  ~283–286 ms
lots                                  at=51063  end=51340
market / FX                           at=51622  ~268–285 ms  (still waits on instrument ids)
```

`activities.start (51063) < holdings.end (51338)` → **true**. The old holdings→activities wait is gone. Market/FX still follows holdings ids (~270 ms). Duplicate `investment_valuations` (different semantics) still both start in the same wave.

r1 and r3: `ops.start < holdings.end` also true.

### Savings mutation check

First authenticated `/vi/money/savings` after login, then every later Savings load:

```text
backfill_legacy_savings_accounts     not present
detect_matured_savings               not present
enqueue_savings_maturity_cascade     not present
```

Observed reads only: `savings` then `saving_cycles` (plus auth/membership/inbox HEAD). P0 holds on a real browser visit.

### Remaining bottlenecks (measured)

1. **Home post-TTFB waves** — TTFB **PASS**; load **1803 ms** vs ≤1400. After auth: parallel module reads ~270–300 ms; `inbox_items` GET **641 ms**; then a **second `transactions` starts when inbox GET ends**, then `savings`, then another `household_members`. Sequential tail ~270–570 ms.
2. **Savings `savings` → `saving_cycles`** — 289 ms then **489 ms**. Load **1415 ms** vs ≤1200. Two hosted RTTs. No Money back-prefetch.
3. **Investments market/FX after holdings ids** — ~270 ms. Load **CLOSE** (1361 vs 1300).
4. **Hosted RTT** — typical PostgREST **260–320 ms**; some 440–650 ms under fan-out (Home inbox, Plan `transactions` 649 ms, Loans membership 441 ms).
5. **Duplicate `households` / inbox HEAD+GET** — parallel, so they rarely add a full extra wave when the slow GET already dominates.
6. **Prefetch** — leftover savings **detail row** default prefetch only; not Plan hub / TopAppBar `/money`.

Money **meets** the stop band (TTFB 332, load 929). Home load does **not**. Further work is justified on Home, not a general auth rewrite.

### Recommendation (exactly one)

**Do not implement Combined RPC first.**

Next candidate: **Home — start the trailing `transactions` / `savings` reads with the first domain wave instead of waiting for `inbox_items` GET to finish.**

| Field                | Evidence (home-r2)                                                                 |
| -------------------- | ---------------------------------------------------------------------------------- |
| Route                | `/vi/home`                                                                         |
| Cost                 | Second `transactions` 274 ms starting at inbox GET end; following `savings` 298 ms |
| Calls                | Extra sequential 2 HTTP after a 641 ms inbox GET                                   |
| Dependency           | Observed ordering only; confirm whether those queries actually need inbox rows     |
| Expected improvement | ~270–570 ms Home DCL if they can overlap wave 1                                    |
| Risk                 | Medium if a real id dependency exists; low if they are independent household reads |
| Frequency            | Every Home document                                                                |

Leave savings-cycles and market/FX until Home load is inside 1.4 s or this tail is proven required.

### Verification

```text
Code changes: NONE (application)
Data mutations: NONE (login + read navigations)
Lifecycle RPCs: NONE
Focused tests: tests/unit/e2e-env.test.ts 4 passed (P4.1a)
Benchmark: 6 routes × 3 warm document loads
```

## P5 — Home Domain Query Parallelization

| Field          | Value                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Date           | 9 Sep 2026                                                                                                  |
| Scope          | Home RSC domain-query orchestration only. No auth, schema, RPC, cache, Money, Plan, or Savings page changes |
| Runtime        | `next start` production build, `127.0.0.1:3010`, `VINHA_PERF_TRACE=1`                                       |
| Viewport       | 390×844, headless Chromium                                                                                  |
| Locale         | `/vi`                                                                                                       |
| Authentication | `.env.local` `E2E_USER_EMAIL` (same dedicated account as P4.1b). Login + Home reads only                    |
| Samples        | Warm-up discarded; **3** Home document loads. Numbers below are **median** unless noted                     |
| Data mutations | None. Savings was not opened. Write-RPC scan: none of the three lifecycle RPCs                              |

### Original dependency graph (as coded, before P5)

Inspected `app/[locale]/(product)/home/page.tsx`, `getHomeDashboard`, `listOpenInboxItems` / `enrichWithTransactionDetails`, `listTransactionsForDateRange`, and `loadSavingsHomeSummary`. Timing from P4.1b was not treated as proof of a data dependency.

```text
requireProductSession
  getClaims → getUser ∥ membership(sub)
        ↓
Home page Promise.all
  ├── getHomeDashboard
  │     assertMoneyActionAllowed (cache hit)
  │     Promise.all
  │       ├── getRealPosition
  │       │     households ∥ accounts
  │       │           ↓ account ids
  │       │     ledger RPC ∥ membership ids
  │       ├── getPlanPulse
  │       │     households ∥ jars
  │       ├── listOpenInboxItems
  │       │     inbox_items GET
  │       │           ↓ source / context ids from rows
  │       │     transactions (enrichment)
  │       │           ↓
  │       │     savings (enrichment)
  │       │           ↓ loans → liabilities → membership
  │       └── listTransactionsForDateRange   (householdId + period only)
  ├── getHomeSavingsSummary → savings → cycles (saving ids)
  ├── getHomeInvestmentSummary → holdings → market/FX
  ├── getHomeLoanSummary → loans
  └── getHomeDebtSummary → liabilities → membership ids

layout (Suspense, overlaps page)
  └── countUnreadOpenInboxItems  (inbox_items HEAD)
```

P4.1b observed:

```text
inbox_items GET ~641 ms
        ↓
transactions starts after inbox_items completes
        ↓
savings
```

That trailing pair was **not** `listTransactionsForDateRange` or `getSavingsHomeSummary`. Those already started in the first domain wave (`Promise.all` in `getHomeDashboard` and the Home page). The trailing HTTP was `listOpenInboxItems` → `enrichWithTransactionDetails`.

### Confirmed dependencies

| Query                                       | Inputs                                                      | Needs inbox rows? | Needs inbox IDs? |
| ------------------------------------------- | ----------------------------------------------------------- | ----------------- | ---------------- |
| `listTransactionsForDateRange`              | `householdId`, period start/end                             | **No**            | **No**           |
| `getSavingsHomeSummary`                     | `householdId`; cycles need saving ids from the savings list | **No**            | **No**           |
| Inbox enrichment `transactions`             | inbox `source_id`s where `source_type = transaction`        | **Yes**           | **Yes**          |
| Inbox enrichment `savings`                  | saving ids from inbox context / `source_id`                 | **Yes**           | **Yes**          |
| Inbox enrichment loans / debts / membership | inbox context ids, then owner membership ids                | **Yes**           | **Yes**          |

Hidden transformation: `enrichWithTransactionDetails` also ran enrichment queries **sequentially** after each other even though savings/loans/debts IDs come from inbox rows, not from the enrichment `transactions` result. That is a real second-wave dependency on inbox rows, not a reason to start those reads before `inbox_items`.

Home dashboard **does not use** enriched inbox details. It only uses:

- `openInboxCount` = mapped open-row count
- `canReviewUncategorized` = any open row with kind `UNMAPPED_EXPENSE`

Both come from `inbox_items.kind` / `status` after the same pending-queue filters. Transaction notes, savings ownership, loans, and debts are unused on Home.

Therefore:

- Do **not** start enrichment `transactions` / `savings` before `inbox_items` (they need row IDs).
- Do **not** keep running that second wave on Home (Home does not consume it).
- Keep Home date-range `transactions` and savings summary in the first domain wave (already independent; now unblocked from the enrichment tail).

### Orchestration change

```text
BEFORE (Home)

Promise.all(position, pulse, listOpenInboxItems, date-range transactions)
                              │
                              inbox_items GET
                                    ↓
                              enrichment transactions
                                    ↓
                              enrichment savings / loans / debts / membership

AFTER (Home)

Promise.all(position, pulse, getOpenInboxAttention, date-range transactions)
                              │
                              inbox_items GET (id, kind, status only)
                              no enrichment wave

page Promise.all still starts getHomeSavingsSummary with the dashboard.
```

`listOpenInboxItems` is unchanged for Plan, Health, Inbox, and jar detail.

### Files changed

| File                                                  | Why                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `modules/inbox/application/queries/review-items.ts`   | `getOpenInboxAttention` — same open-queue filters, no enrichment                           |
| `modules/inbox/application/inbox-constants.ts`        | `INBOX_OPERATION.GET_OPEN_ATTENTION`                                                       |
| `modules/inbox/application/index.ts`                  | Export the Home attention query                                                            |
| `modules/home/application/get-home-dashboard.ts`      | Use attention instead of the enriched queue                                                |
| `tests/unit/home-dashboard-orchestration.test.ts`     | Barrier test: transactions + savings start while inbox is pending; no enrichment `.in(id)` |
| `tests/unit/home-product-summary-query-shape.test.ts` | Source contract: no `listOpenInboxItems` on Home dashboard                                 |

Auth/session, membership, Supabase client, RLS, schema, indexes, combined RPCs, Money, Plan, Savings page, Investments, Loans, navigation, and financial math were not modified.

### Focused tests

```text
tests/unit/home-dashboard-orchestration.test.ts        3 passed
tests/unit/home-product-summary-query-shape.test.ts    5 passed
tests/unit/home-dashboard-metrics.test.ts             10 passed
tests/unit/home-header.test.ts                         1 passed
tests/unit/home-screen-v2-polish.test.tsx              4 passed
tests/unit/home-cash-flow-semantics.test.tsx           4 passed
tests/unit/home-ia-ux.test.tsx                        11 passed
tests/unit/inbox-integration.test.ts                  12 passed
tests/unit/inbox-error-handling.test.ts               14 passed
```

Result: **64 passed**.

Proved:

- Date-range `transactions` and Home `savings` table reads start while `inbox_items` is still pending (deferred promises, not wall-clock).
- After inbox resolves, Home does not issue a second `transactions` (no `.in("id")`) or enrichment `savings` / `loans` / `liabilities`.
- Open count and unmapped-expense flag still come from pending canonical kinds.

Typecheck: `npx tsc --noEmit` — **passed**.

Targeted ESLint on changed TS files — **passed**.

Full repository test suite: not run.

### Benchmark results

Same methodology as P4.1b: production `next start`, `VINHA_PERF_TRACE=1`, 390×844, `/vi`, dedicated E2E account, 3 warm Home document loads. Savings was not opened.

| Metric              |       P4.1b |                                   P5 |   Delta |
| ------------------- | ----------: | -----------------------------------: | ------: |
| TTFB (median)       |      392 ms |                               324 ms |  −68 ms |
| Total/load (median) |     1803 ms |                              1119 ms | −684 ms |
| inbox_items GET     |     ~641 ms |                               380 ms | −261 ms |
| transactions start  | after inbox | first domain wave (`at` = inbox GET) | overlap |
| savings start       | after inbox | first domain wave (`at` = inbox GET) | overlap |

Min / median / max (Home navigation timing):

| Metric | min / med / max    |
| ------ | ------------------ |
| TTFB   | 303 / 324 / 467    |
| Load   | 1017 / 1119 / 2077 |

Trace (all three warm loads): **one** `transactions` GET and **one** `savings` GET, both with `start ≈ first domain-wave start`. `transactions.start < inbox_items.end` and `savings.start < inbox_items.end` are **true**. The old `inbox_items.end → transactions.start → savings.start` tail is gone.

home-r3 (representative, not the contended sample):

```text
auth.getUser / membership     ~270–295 ms   (overlap; TTFB)
then first domain wave at≈51935
  accounts, jars, loans, holdings, liabilities,
  savings, transactions, inbox_items GET, inbox HEAD
  ~282–347 ms typical; HEAD 507 ms
then id-dependent wave at≈52218
  saving_cycles, ledger RPC, market/FX, household_members
  ~265–479 ms
```

home-r2 was a contended outlier (many first-wave PostgREST calls 898–1018 ms, load 2077 ms). Median still used, matching P4.1b.

Write RPCs: **none**.

### Home target

| Gate            | Target   | P5 median | Status   |
| --------------- | -------- | --------: | -------- |
| Home TTFB       | ≤450 ms  |    324 ms | **PASS** |
| Home total/load | ≤1400 ms |   1119 ms | **PASS** |

Home TTFB did not regress (392 → 324). Load moved inside the stop band. **Stop further Home optimization.**

### Remaining bottleneck (not implemented)

Home still has a **legitimate second domain wave** after first-wave IDs:

- `getRealPosition`: accounts → `get_account_ledger_balances`
- `getSavingsHomeSummary`: savings → `saving_cycles`
- investment summary: holdings → market/FX
- duplicate `households` and inbox GET+HEAD (parallel; HEAD is the layout unread badge)

That wave is ~270–480 ms after TTFB on a quiet run. It is **not** an unnecessary `inbox_items → transactions` wait. Combined RPCs for position / savings cycles remain the historically strongest follow-up **if** a later pass needs more, but P5’s Home stop rule is met.

### Verification

```text
Code changes: Home inbox attention + getHomeDashboard orchestration + focused tests
Data mutations: NONE (login Auth token only; Home read navigations)
Lifecycle RPCs: NONE
Focused tests: 64 passed
Typecheck: passed
Targeted lint: passed
Benchmark: Home × 3 warm document loads
```

## P6 — Savings Query Waterfall Reduction

| Field          | Value                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Date           | 9 Sep 2026                                                                                            |
| Scope          | Savings list read path only (`listSavings`). No auth, Home, Money, Plan, lifecycle, or schema changes |
| Runtime        | `next start` production build, `127.0.0.1:3010`, `VINHA_PERF_TRACE=1`                                 |
| Viewport       | 390×844, headless Chromium                                                                            |
| Locale         | `/vi`                                                                                                 |
| Authentication | `.env.local` `E2E_USER_EMAIL` (same dedicated account as P4.1b/P5). Login + Savings reads only        |
| Samples        | Warm-up discarded; **3** Savings document loads. Numbers below are **median** unless noted            |
| Data mutations | None. Write-RPC scan: none of the three lifecycle RPCs                                                |

### Current dependency graph (verified from code)

Inspected `app/[locale]/(product)/money/savings/page.tsx`, `layout.tsx`, and `modules/savings/application/queries/list-savings.ts`. Timing from P4.1b was not treated as proof of the data dependency.

```text
requireProductSession
  getClaims → getUser ∥ membership(sub)
        ↓
Savings page
  getSessionUser / resolveActiveMembership   (cache hits)
  listSavings = cache(loadSavings)
        ↓
  assertMoneyActionAllowed                   (cache hit)
        ↓
  GET savings
    household_id
    embeds: funding_accounts, settlement_accounts, saving_providers
        ↓ saving ids
  GET saving_cycles .in(saving_id)           ← P4.1b waterfall
        ↓
  listActiveMembershipIds                    (owner ids from savings rows)
        ↓
  map rows + selectCurrentSavingCycle
        ↓
  setMaturityActionRequired → listProviderPackages (matured rows only)
        ↓
  buildSavingsOverviewModel (in-process)
```

`listSavingCycles` / `getSaving` (detail) and `getSavingsHomeSummary` (Home) are separate callers. P6 does not change them. Home still has its own `savings → saving_cycles` pair; those requests appeared during login Home, not on the Savings document.

### Why the dependency is legitimate

`selectCurrentSavingCycle` needs cycle rows for each listed saving (ACTIVE, else newest MATURED, else newest of any status). PostgREST cannot start that child filter without knowing which `saving_id`s belong to the household. The old two-request shape was therefore a real id dependency, not an accidental `await`.

The list page does **not** need a date range. It uses all cycles only to pick the current one, then computes accrued interest in process. Household isolation is `.eq("household_id", gate.householdId)` plus RLS on both tables.

### Approaches investigated

| Option                          | Result                                                                                                                                                                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — existing query/RPC**      | No list RPC returns savings + cycles. `get_investment_home_summary_inputs` is investments-only. Write RPCs (`detect_matured_savings`, etc.) are out of bounds.                                                                                                   |
| **B — PostgREST embed**         | **Chosen.** FK `saving_cycles_saving_id_fkey` already exists. Nested JSON, not a cartesian product. Same RLS on parent and child. Same cycle columns. Same `selectCurrentSavingCycle` semantics. Matches `listProviderCatalog`'s `saving_packages!…_fkey` embed. |
| **C — dedicated read-only RPC** | Not needed. Embed returns the exact list model without a migration, GRANT, or extra SECURITY DEFINER surface.                                                                                                                                                    |
| **D — keep two waves**          | Rejected: embed is safe and removes one hosted RTT (~489 ms in P4.1b).                                                                                                                                                                                           |
| Application narrowing           | Cycle select was already the mapper contract. Status/date filters would change `selectCurrentSavingCycle` fallbacks (EARLY_CLOSED / ROLLED). Narrowing columns would not remove the RTT.                                                                         |

### Chosen approach

Embed `saving_cycles` on the household `savings` select via the existing FK. Combine in application code exactly as before.

```text
BEFORE

GET savings
     ↓ saving ids
GET saving_cycles
     ↓
listActiveMembershipIds
     ↓
selectCurrentSavingCycle

AFTER

GET savings  (saving_cycles nested)
     ↓
listActiveMembershipIds
     ↓
selectCurrentSavingCycle
```

No database/RPC/migration/RLS change. `getSaving` and `listSavingCycles` (detail) stay two-request. Lifecycle commands stay explicit and off the GET tree.

### Files changed

| File                                                  | Why                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `modules/savings/application/queries/list-savings.ts` | One combined list select; removed the batch + N+1 cycle loaders from `loadSavings` |
| `tests/unit/savings-list-orchestration.test.ts`       | Read-contract + one-request orchestration                                          |
| `tests/unit/savings-page-no-write-on-render.test.ts`  | Extra GET-tree mutation markers (P0 strengthened, not weakened)                    |

### Database / RPC changes

None.

### Focused tests

```text
tests/unit/savings-list-orchestration.test.ts       13 passed
tests/unit/savings-page-no-write-on-render.test.ts    2 passed
tests/unit/savings-lifecycle-sync.test.ts             6 passed
tests/unit/savings-commands.test.ts                  11 passed
tests/unit/savings-row-mapper.test.ts                 4 passed
tests/unit/savings-inbox-workflow.test.ts             5 passed
tests/unit/savings-renewal-policy.test.ts            13 passed
```

Result: **54 passed**.

Proved:

- Empty list, no cycles, cycles present, multiple accounts, ACTIVE/MATURED/ROLLED/EARLY_CLOSED.
- Current-cycle preference and accrued-interest recompute.
- Error → `null`; denied money action → no query.
- Household `.eq("household_id", gated id)` only.
- `.from("saving_cycles")` is not called from `loadSavings`; lifecycle RPCs are not called.
- GET tree still has no `SavingsLifecycleSync` / lifecycle actions (P0).

Typecheck: `npx tsc --noEmit` — **passed**.

Targeted ESLint on changed TS files — **passed**.

Full repository test suite: not run.

### Before / after benchmark

Same methodology as P4.1b: production `next start`, `VINHA_PERF_TRACE=1`, 390×844, `/vi`, dedicated E2E account, 3 warm `/vi/money/savings` document loads. No household creation. No financial writes.

| Metric                |   P4.1b |      P6 |   Delta |
| --------------------- | ------: | ------: | ------: |
| TTFB                  |  295 ms |  425 ms | +130 ms |
| Total/load            | 1415 ms | 1062 ms | −353 ms |
| savings request       | ~289 ms | ~310 ms |  +21 ms |
| saving_cycles request | ~489 ms |    none | −489 ms |
| Number of read waves  |       2 |       1 |      −1 |

Min / median / max (Savings navigation timing):

| Metric      | min / med / max   |
| ----------- | ----------------- |
| TTFB        | 367 / 425 / 451   |
| Load        | 969 / 1062 / 1503 |
| savings GET | 303 / 310 / 406   |

TTFB is still `max(getUser, membership)`. P6 does not add work before first byte. This run’s membership HTTP was 336–425 ms (P4.1b Savings membership was ~270–287 ms). That is hosted RTT variance, not the embed. Median TTFB **425 ≤ 450** (PASS). One sample was 451 ms on a 425 ms membership call.

Trace (all three warm Savings loads): **one** `GET /rest/v1/savings`, **zero** `GET /rest/v1/saving_cycles`. `combinedRead = true`. Inbox HEAD overlaps the combined savings GET. After savings returns, `listActiveMembershipIds` still issues a second `household_members` GET (~272–646 ms). That is not the P4.1b `savings → cycles` waterfall.

Decoded Savings HTML **484 909 B** — same as P4.1b.

`saving_cycles` still appears on **Home** during login (`getSavingsHomeSummary`). Out of P6 scope. P5 already stopped further Home work.

### Read-only verification

First authenticated `/vi/money/savings` (warmup) and all three measured loads:

```text
backfill_legacy_savings_accounts     not present
detect_matured_savings               not present
enqueue_savings_maturity_cascade     not present
```

Full-process scan: **no** lifecycle RPCs. Layout remains a read-only pass-through.

### Savings target

| Gate               | Target   | P6 median | Status   |
| ------------------ | -------- | --------: | -------- |
| Savings TTFB       | ≤450 ms  |    425 ms | **PASS** |
| Savings total/load | ≤1200 ms |   1062 ms | **PASS** |

Load moved inside the stop band. **Stop further Savings optimization.**

### Remaining observation (not implemented)

After the combined savings GET, `listActiveMembershipIds` still waits on owner membership ids (~270–650 ms). r3 load 1503 ms was that query at 646 ms. Median still ≤1200, so P6 does not take a follow-up.

### Verification

```text
Code changes: listSavings PostgREST embed + focused tests; P0 markers strengthened
Data mutations: NONE (login Auth token only; Savings read navigations)
Lifecycle RPCs: NONE
Focused tests: 54 passed
Typecheck: passed
Targeted lint: passed
Benchmark: Savings × 3 warm document loads
```

## P7 — Investments Market/FX Waterfall Reduction

| Field          | Value                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | 9 Sep 2026                                                                                                                                                                       |
| Scope          | Investments server-side read orchestration only (`loadHoldings` / `listInvestmentPortfolio`). No auth, Home, Money, Plan, Savings, Loans, schema, RLS, or valuation-math changes |
| Runtime        | `next start` production build, `127.0.0.1:3010`, `VINHA_PERF_TRACE=1`                                                                                                            |
| Viewport       | 390×844, headless Chromium                                                                                                                                                       |
| Locale         | `/vi`                                                                                                                                                                            |
| Authentication | `.env.local` `E2E_USER_EMAIL` (same dedicated account as P4.1b/P5/P6). Login + Investments reads only                                                                            |
| Samples        | Warm-up discarded; **3** Investments document loads. Numbers below are **median** unless noted                                                                                   |
| Data mutations | None. Write-RPC scan: none of the three lifecycle RPCs                                                                                                                           |

Credentials were read via `loadEnvConfig`. They are not recorded here.

### Dependency graph (verified from code after P3)

Inspected `app/[locale]/(product)/money/investments/page.tsx` and `modules/investments/application/queries/investment-queries.ts`. P4.1b timestamps were not treated as proof of a data dependency.

```text
requireProductSession
  getClaims → getUser ∥ membership(sub)
        ↓
Investments page
  getSessionUser / resolveActiveMembership   (cache hits)
  listInvestmentPortfolio
        ├── loadHoldings
        │     assertMoneyActionAllowed (cache hit)
        │     Promise.all
        │       ├── GET investment_holdings          (household id)
        │       ├── GET investment_valuations          (household id; latest-per-holding)
        │       └── GET investment_lots                (household id)
        │             ↓ holding rows
        │     instrument ids from holdings.instrument_id
        │     owner ids from holdings.owner_membership_id
        │             ├── listActiveMembershipIds      (owner ids)     ← was awaited first
        │             └── Promise.all                                  ← waited on membership
        │                   ├── GET market_instruments  (.in instrument ids)
        │                   ├── GET market_instrument_prices (.in instrument ids)
        │                   └── GET market_currency_rates  (quote = reporting currency)
        └── listInvestmentActivities                    (P3; household id; no holdings array)
              GET investment_operations ∥ GET investment_valuations (timeline shape)
```

| Function                          | Requires              | Does **not** need                      |
| --------------------------------- | --------------------- | -------------------------------------- |
| Holdings query                    | household id          | instrument ids, FX, prices             |
| Activities query                  | household id          | holdings array, instrument ids         |
| `listMarketInstruments` (catalog) | search input          | holding ids. **Not used** on this page |
| Market instruments (portfolio)    | instrument ids        | holding ids, membership ids, FX        |
| Market prices                     | instrument ids        | FX, instrument metadata rows           |
| FX / `market_currency_rates`      | quote currency (VND)  | holding ids, instrument ids, prices    |
| Valuation/lots                    | household id          | market rows                            |
| `listActiveMembershipIds`         | household + owner ids | instrument ids, market rows            |

Answers:

- `listMarketInstruments` (catalog search) does **not** require holding ids. The portfolio page does not call it.
- Portfolio market-instrument and price reads **do** require instrument ids from holdings.
- Instrument ids cannot be obtained independently of the holdings row set without a duplicate holdings query.
- FX **can** be loaded from household/base (reporting) currency alone. It does not need instrument ids.
- Market prices do **not** need FX to start. After ids exist, instruments / prices / FX are independent of one another.
- The page **does** need prices (and FX when the price currency is not VND) before rendering portfolio totals. Skipping them would change valuation semantics.

### Root cause of the ~270 ms wait

P4.1b **investments-r2**: holdings ended `51338`; market/FX started `51622` (**+284 ms**). That gap was **not** “instrument ids still in flight”. Ids are on the holdings payload the moment that GET returns.

The extra await was `listActiveMembershipIds` **before** the market `Promise.all`. Market instruments, prices, and FX already started together; none waited on the others. The avoidable wait was membership blocking market/FX.

FX was **not** started with holdings, so it also sat behind that membership await. Starting FX in wave 1 would not have shortened the P4.1b critical path once membership and market overlap (FX duration ≈ instruments/prices). An extra FX GET on the no-instrument path was rejected.

### Optimization considered vs implemented

| Option                                       | Result                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **A — start market as soon as ids exist**    | **Chosen.** `Promise.all(listActiveMembershipIds, market instruments ∥ prices ∥ FX)` after holdings/valuations/lots |
| **B — FX independent of instruments/prices** | Already true inside the market `Promise.all`. No extra change                                                       |
| **B2 — start FX with holdings**              | Safe but unused FX GET when no instrument ids. Same critical path after A on the P4.1b dataset. Not taken           |
| **C — reuse an already-loaded id list**      | No earlier source of instrument ids than holdings                                                                   |
| **D — narrower market/FX select**            | Would not remove the hosted RTT                                                                                     |
| **E — new RPC**                              | Not needed. Application-level overlap is enough                                                                     |

Implemented:

```ts
const [activeOwnerMembershipIds, marketRows] = await Promise.all([
  listActiveMembershipIds(...),
  instrumentIds.length ? Promise.all([instruments, prices, fx]) : empty,
]);
```

Same selects, filters, skip-when-no-instrument-ids, error→`null`, and `resolveInvestmentValuation` math. P3 `Promise.all(loadHoldings, listInvestmentActivities)` is unchanged.

### Files changed

| File                                                            | Why                                                                                            |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `modules/investments/application/queries/investment-queries.ts` | Overlap membership with market/FX after holdings ids                                           |
| `tests/unit/investment-portfolio-orchestration.test.ts`         | Deferred-promise tests for P3, membership/market overlap, id dependency, errors, no duplicates |

Auth/membership (`getClaims`, `getUser`, `requireProductSession`, `assertMoneyActionAllowed`) was not modified. `loadInvestmentHomeSummary` (Home) was not modified.

### Focused tests

```text
tests/unit/investment-portfolio-orchestration.test.ts   9 passed
tests/unit/investment-portfolio-view-model.test.ts      3 passed
tests/unit/investment-accounting.test.ts                 11 passed
tests/unit/investment-commands.test.ts                  11 passed
tests/unit/investment-money.test.ts                      2 passed
tests/unit/investment-historical-import.test.ts          9 passed
tests/unit/investment-domain-foundation.test.ts            7 passed
tests/unit/investment-ui-polish.test.tsx                 9 passed
tests/unit/investment-opening-ui.test.tsx               2 passed
tests/unit/investment-asset-picker.test.ts               3 passed
tests/unit/investment-operation-form.test.tsx           6 passed
tests/unit/investment-operation-view-model.test.ts     8 passed
tests/unit/investment-ux.test.ts                        3 passed
tests/unit/investment-lifecycle.test.ts                 6 passed
tests/unit/investment-market-valuation.test.tsx        5 passed
tests/unit/market-valuation-query.test.ts               1 passed
tests/unit/list-market-instruments.test.ts                 2 passed
```

Result: **97 passed**.

Proved:

- P3: holdings and operations queries both start while the other is pending.
- Market instruments / prices / FX start while `listActiveMembershipIds` is still pending.
- Market / FX do not start until holdings resolve (instrument-id dependency preserved).
- Instruments, prices, and FX all start before any of those three resolve.
- Market instruments error → `null`, never a partial portfolio; activities still start.
- One GET each for holdings, operations, instruments, prices, FX; two valuation shapes; membership once. No new duplicate query.
- Unlinked holdings still skip market/FX entirely.

Typecheck: `npx tsc --noEmit` — **passed**.

Targeted ESLint on changed TS files — **passed**.

Full repository test suite: not run.

### Before / after benchmark

Same methodology as P4.1b/P5/P6: production `next start`, `VINHA_PERF_TRACE=1`, 390×844, `/vi`, dedicated E2E account, 3 warm `/vi/money/investments` document loads. No household creation. No financial writes.

| Metric             |   P4.1b |      P7 |
| ------------------ | ------: | ------: |
| TTFB               |  309 ms |  452 ms |
| Total/load         | 1361 ms | 1094 ms |
| Holdings           |    ~279 |  278 ms |
| Activities         |    ~289 |  285 ms |
| Market instruments |    ~270 |  281 ms |
| Prices             |    ~270 |  263 ms |
| FX                 |    ~270 |  265 ms |

Min / median / max (Investments navigation timing):

| Metric | min / med / max    |
| ------ | ------------------ |
| TTFB   | 307 / 452 / 737    |
| Load   | 1010 / 1094 / 1801 |

r1 TTFB **737 ms** / load **1801 ms** was a slow layout `household_members` GET (**704 ms**) plus a second membership GET **698 ms**. That is hosted RTT variance, not a new pre-byte wave. r3 TTFB **307 ms** matches P4.1b. P7 does not add work before first byte.

### Timing relationship (investments-r2)

```text
holdings.start              38299
holdings.end                38647  (348 ms)
instrument ids available    holdings.end (in-process)
market.start                38650  (+3 ms after holdings.end)
prices.start                38650
FX.start                    38650
listActiveMembershipIds     38649  (overlaps market/FX)
activities.start            38300  < holdings.end 38647  (P3 intact)
```

P4.1b market/FX started **~284 ms** after holdings.end. P7: **+3 / +69 / +72 ms**. The remaining 69–72 ms is waiting for the slowest of holdings/valuations/**lots** (the first `Promise.all`), not membership. r3: lots ended `39708`, market started `39709`.

All three warm loads: `activities.start < holdings.end` → **true**. Market instruments, prices, and FX share one start timestamp.

### Investments target

| Gate                   | Target   | P7 median | Status                                          |
| ---------------------- | -------- | --------: | ----------------------------------------------- |
| Investments TTFB       | ≤450 ms  |    452 ms | **CLOSE** (r3 307; r1 737 on 704 ms membership) |
| Investments total/load | ≤1300 ms |   1094 ms | **PASS**                                        |

Load moved inside the stop band. **Stop further Investments optimization.**

### Remaining observation (not implemented)

After holdings/valuations/lots, market still waits for that first `Promise.all` even though instrument ids come only from holdings. Lots was the slowest first-wave GET on r1/r3 (~70 ms extra). Starting market as soon as holdings resolve (overlapping remaining lots/valuations) would be the next application-level candidate. **Not implemented** — load already ≤1300 ms.

### Verification

```text
Code changes: loadHoldings membership ∥ market/FX + focused tests
Data mutations: NONE (login Auth token only; Investments read navigations)
Lifecycle RPCs: NONE
Focused tests: 97 passed
Typecheck: passed
Targeted lint: passed
Benchmark: Investments × 3 warm document loads
```

## P8 — Final Authenticated Performance Regression

| Field          | Value                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Date           | 9 Sep 2026                                                                                                                   |
| Scope          | Measurement-only final recapture after P1–P7. No application, query, RPC, schema, RLS, auth, navigation, UI, or test changes |
| Runtime        | `next start` (fresh production build of the current working tree) on `127.0.0.1:3010`, `VINHA_PERF_TRACE=1`                  |
| Viewport       | 390×844, headless Chromium                                                                                                   |
| Locale         | `/vi`                                                                                                                        |
| Authentication | `.env.local` `E2E_USER_EMAIL` (same dedicated account as P4.1b/P5/P6/P7). Login succeeded; landed on `/vi/home`              |
| Supabase       | Hosted `*.supabase.co`                                                                                                       |
| Samples        | Warm-up discarded; **3** document loads per route. Numbers below are **median** unless noted                                 |
| Data mutations | None. Savings mutation scan: no lifecycle RPCs or `syncSavingsLifecycleAction`                                               |
| Code changes   | None (application). Gitignored profiler only (`output/vinha-rsc-profile-p8.mjs`)                                             |

Credentials were read via `loadEnvConfig`. They are not recorded here. No ownership-test fallback. No household created.

### Runtime / protocol

- Next.js **16.3.1** production `next build` then `VINHA_PERF_TRACE=1 npx next start -p 3010 -H 127.0.0.1`.
- Same methodology as P4.1b/P5/P6/P7: document `page.goto`, TTFB = Navigation Timing `responseStart - requestStart`, total = `loadEventEnd`.
- Six product routes only. Public login/register not scored.
- Profiler credential source: `VINHA_PROFILE_CREDENTIAL_SOURCE=e2e`. Safe stderr: source, domain, presence — never email or password.

### Authenticated session

Login filled the login form once. Redirect: `/vi/home` (not onboard). `hasHousehold = true`. Recapture continued. No fixture setup, no household create, no product CTAs that write data.

### Six-route final benchmark

| Route       | TTFB (min/med/max)  | Load (min/med/max)     | Encoded | Decoded | Status                                               |
| ----------- | ------------------- | ---------------------- | ------: | ------: | ---------------------------------------------------- |
| Home        | 309 / **437** / 481 | 1247 / **1576** / 1830 |  78 590 | 369 698 | TTFB **PASS** / load **CLOSE** (≤1400; r3 1247 PASS) |
| Money       | 284 / **286** / 300 | 1079 / **1284** / 1617 |  77 177 | 373 865 | TTFB **PASS** / load **CLOSE** (≤1200; r3 1079 PASS) |
| Plan        | 291 / **293** / 295 | 1468 / **1629** / 1778 |  70 039 | 343 401 | TTFB **PASS** / load **CLOSE** (≤1500; r1 1468 PASS) |
| Savings     | 352 / **437** / 441 | 1023 / **1168** / 1292 |  74 094 | 484 909 | **PASS** / **PASS**                                  |
| Investments | 290 / **342** / 456 | 1073 / **1457** / 1630 |  71 314 | 372 055 | TTFB **PASS** / load **CLOSE** (≤1300; r3 1073 PASS) |
| Loans       | 299 / **455** / 465 | 573 / **727** / 742    |  63 745 | 290 613 | TTFB **CLOSE** (≤450) / load **PASS**                |

Load overshoots on Home / Money / Plan / Investments are hosted PostgREST RTT spikes (400–800 ms class), not a new application waterfall. Each of those routes has at least one warm sample inside the load band. Loans TTFB 455 is 5 ms over on a 429–433 ms membership GET.

### Baseline comparison

Historical §2 baselines are **not** replaced.

| Route       | Baseline TTFB | Final TTFB |    Δ | Baseline Load | Final Load |     Δ | Status                         |
| ----------- | ------------: | ---------: | ---: | ------------: | ---------: | ----: | ------------------------------ |
| Home        |           780 |        437 | −343 |          2746 |       1576 | −1170 | TTFB **PASS** / load **CLOSE** |
| Money       |           647 |        286 | −361 |          1640 |       1284 |  −356 | TTFB **PASS** / load **CLOSE** |
| Plan        |           707 |        293 | −414 |          1871 |       1629 |  −242 | TTFB **PASS** / load **CLOSE** |
| Savings     |           782 |        437 | −345 |          1755 |       1168 |  −587 | **PASS**                       |
| Investments |           726 |        342 | −384 |          2050 |       1457 |  −593 | TTFB **PASS** / load **CLOSE** |
| Loans       |           901 |        455 | −446 |          1195 |        727 |  −468 | TTFB **CLOSE** / load **PASS** |

Post-optimization medians from earlier passes (not a new baseline): Home P5 load 1119; Savings P6 load 1062; Investments P7 load 1094. P8 medians are noisier under the same hosted path. Min samples still meet those later bands when RTT is quiet (Home r3 1247, Savings r2 1023, Investments r3 1073).

### P1 — Authenticated Link Prefetch

| Surface                           | Authenticated RSC prefetch                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Plan document + 4 s idle          | **0**. No jars/goals/calendar/recurring/ritual/exceptions clones                                                           |
| Plan recurring hover              | **0**                                                                                                                      |
| Money document + 4 s idle         | **0**                                                                                                                      |
| Home document + 4 s idle          | 1 self-prefetch of `/vi/home` (1.9 KB, 4 ms). Known intentional exception                                                  |
| Savings idle (TopAppBar `/money`) | **0** Money back-prefetch. One in-viewport **savings detail** child-row prefetch (same leftover as P4.1b; not `/vi/money`) |

Warm Home documents also self-prefetch `/vi/home` during navigation. Public auth links were not scored. **No unexpected authenticated viewport/hover RSC prefetch regression.**

### P2 — Auth / Membership overlap

Warm **home-r3** (quiet sample):

```text
auth.getClaims        at=50599  ms=1     end=50600
auth.getUser          at=50602  ms=290   end=50892
membership.resolve    at=50608  ms=284   end=50892
GET /auth/v1/user     at=50605  ms=284
GET household_members at=50609  ms=282
```

`membership.start (50608) < getUser.end (50892)` → **true**. Overlap **284 ms**.

Same pattern on all 18 warm product documents (overlap true; `getUserCount = 1`, layout `membershipCount = 1`). `getClaims` warm **1–2 ms**. TTFB still tracks **max(getUser, membership)**. Claims is not a new bottleneck.

Home r1 membership HTTP **441 ms** and Loans r2/r3 membership **429–432 ms** are hosted RTT, not a restored `getUser → membership` sum.

### P3 — Investments holdings/activities

All three warm Investments loads: `activities.start < holdings.end` → **true**.

**investments-r3:**

```text
holdings   GET investment_holdings     at=68191  end=68464  (273 ms)
activities GET investment_operations   at=68192  end=68472  (280 ms)
```

Not:

```text
holdings
   ↓
activities
```

### P5 — Home orchestration

All three warm Home loads:

```text
transactions.start = first domain-wave start
savings.start      = first domain-wave start
transactionCount   = 1
secondTransactionAfterInbox = false
```

**home-r3:**

```text
first domain wave at≈50895
  accounts, jars, loans, holdings, liabilities,
  savings, transactions, inbox_items GET, households
  ~263–299 ms
inbox HEAD overlaps (425 ms)
then id-dependent wave at≈51168
  saving_cycles, ledger RPC, market/FX, household_members
```

`transactions.start < inbox_items.end` and `savings.start < inbox_items.end` are **true**. The old `inbox_items.end → transactions.start` tail is **not** reintroduced. Inbox GET+HEAD remains two requests (layout unread badge); that is not Home enrichment.

### P6 — Savings read path

All three warm Savings loads:

```text
GET savings            count = 1
GET saving_cycles      count = 0
combinedRead           true
POST                   0
```

Expected shape holds:

```text
GET savings
   └── embedded saving_cycles
```

Not `GET savings → GET saving_cycles`. After the combined GET, `listActiveMembershipIds` still issues a second `household_members` GET (historical; not the P4.1b cycles waterfall).

### P7 — Investments market/FX

**investments-r3** (quiet):

```text
holdings.end                 68464
market instruments.start     68469  (+5 ms)
prices.start                 68469
FX.start                     68470
listActiveMembershipIds      68469  (overlaps market/FX)
activities.start             68192  < holdings.end  (P3 intact)
valuationCount               2
```

`market.start ≈ membership.start ≈ prices.start ≈ FX.start`. Instruments / prices / FX share one start timestamp (`marketStartsTogether = true`).

**investments-r2** market started **+417 ms** after `holdings.end`. That gap is **not** membership. First `Promise.all` waited on a slow `investment_valuations` GET (**687 ms**); market and owner-membership both started at `67141` when that GET returned. Same remaining observation as P7 (market waits for holdings **and** valuations/lots). Hosted RTT, not a restored ~270 ms membership-induced delay.

### Loans

Empty list on this household: **one** `GET loans`, **zero** `loan_payments` / `loan_schedule_entries`. TTFB 455 / load 727. No unexpected waterfall. Non-empty loan aggregate path (`loadLoanAggregatesByIds`) remains **unmeasured**. No loan was created.

### Read-only safety

First authenticated `/vi/money/savings` after login, every later Savings load, and the full process log:

```text
backfill_legacy_savings_accounts     not present
detect_matured_savings               not present
enqueue_savings_maturity_cascade     not present
syncSavingsLifecycleAction           not present
```

Observed POSTs are login `POST /auth/v1/token` and read RPCs (`get_account_ledger_balances`, `get_investment_home_summary_inputs`) only. No lifecycle writes during GET/RSC.

### Payload / request observations

| Route       | Encoded vs P4.1b | Decoded vs P4.1b | Notes                                      |
| ----------- | ---------------: | ---------------: | ------------------------------------------ |
| Home        |      78 590 (~0) |     369 698 (~0) | 1 self-prefetch RSC during document        |
| Money       |      77 177 (~0) |      373 865 (0) | 0 RSC prefetch                             |
| Plan        |      70 039 (~0) |      343 401 (0) | 0 RSC prefetch                             |
| Savings     |      74 094 (~0) |      484 909 (0) | optional detail-row prefetch (P1 leftover) |
| Investments |      71 314 (~0) |     372 055 (~0) | 0 RSC prefetch                             |
| Loans       |      63 745 (~0) |     290 613 (~0) | 0 RSC prefetch                             |

No significant payload growth. No duplicate layout `getUser`. Second `household_members` after owner ids remains the historical membership-ids read, not a new auth wave.

### Hosted RTT vs application sequencing

Spikes that pulled some load medians above target, with **no new dependency**:

| Sample         | Slow fetch                                               | Class                       |
| -------------- | -------------------------------------------------------- | --------------------------- |
| home-r1        | inbox HEAD 811 ms; FX 791 ms; transactions 540           | hosted contention           |
| home-r2        | accounts 722; saving_cycles 664; instruments 622         | hosted contention           |
| money-r1       | holdings 641; prices 651                                 | hosted contention           |
| plan-r2        | savings 637; credit_card_settings 663                    | hosted contention           |
| investments-r2 | valuations 687 (blocks market until first `Promise.all`) | hosted + known P7 remainder |
| loans-r2 / r3  | membership 429–432                                       | hosted RTT; TTFB CLOSE      |

Quiet samples (home-r3, money-r3, plan-r1, investments-r3, loans-r1) sit inside or at the load band.

### Final PASS / CLOSE / MISS

```text
Home: CLOSE
Money: CLOSE
Plan: CLOSE
Savings: PASS
Investments: CLOSE
Loans: CLOSE
```

P1 / P2 / P3 / P5 / P6 / P7 contracts: **held**. Savings GET tree: **read-only**. Prefetch: **no unexpected authenticated stampede**.

### Overall recommendation

**READY TO CLOSE**

No further optimization recommended in this workstream. Load CLOSE rows are hosted RTT variance on already-documented second waves, not a restored application waterfall.

The unused application-level candidate remains P7’s remainder (start market as soon as holdings resolve, overlapping valuations/lots) or Home’s legitimate id-dependent wave (accounts → ledger RPC, savings → cycles). **Not implemented.** Do not start Combined RPC, region moves, or another auth rewrite from this pass.

### Measurement limitations

- Same Vietnam → hosted `ap-southeast-2` path as §2 / P4.1b.
- Loans N>0 aggregates unmeasured.
- Savings detail-row default prefetch still present (P1 leftover; not `/vi/money`).
- Home may self-prefetch `/vi/home`.
- Application code was not modified.

### Verification

```text
Code changes: NONE (application). Audit append + gitignored profiler only
Data mutations: NONE (login Auth token only; read navigations)
Household creation: NONE
Lifecycle RPCs: NONE
Focused tests: not run (measurement-only)
Typecheck / lint / full suite: not run
Benchmark: 6 routes × 3 warm document loads + idle/hover prefetch checks
```
