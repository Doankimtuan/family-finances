# API Performance Investigation

| Field       | Value                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Date        | 8 Sep 2026                                                                                     |
| Scope       | Full request lifecycle: browser → Next.js proxy → RSC/Server Actions → Supabase → Postgres     |
| Predecessor | [performance-supabase-audit.md](./performance-supabase-audit.md) (SQL is fast at current size) |
| App phase   | Experimental / testing. Production migration is out of scope.                                  |
| Linked DB   | `family-finances-2` (`ap-southeast-2`). Tiny cardinality (20 txs, 12 accounts).                |

## Executive Summary

The 2–10s Network-tab rows are **not a slow PostgreSQL problem**. Prior `EXPLAIN ANALYZE` on the linked database is **0.06–1.6 ms**. There is **no public Next.js API gateway** for product screens. Home, Money, Plan, Savings, Investments, and Transactions are **authenticated React Server Component renders**. Chrome “API” names (`/vi/money`, `/vi/money/transactions`, `/rsc`, `/vi/home`) are **document/RSC navigations**, not REST handlers.

Measured from this machine to hosted Supabase (`*.supabase.co`):

| Signal                          | Result                                    |
| ------------------------------- | ----------------------------------------- |
| TLS handshake                   | **145–220 ms**                            |
| Unauthenticated `/rest/v1/` RTT | **202–309 ms**                            |
| SQL execution (prior audit)     | **0.06–1.6 ms**                           |
| Authenticated RSC TTFB          | **UNVERIFIED** (no signed-in browser run) |

Each sequential PostgREST/Auth round-trip costs **~200–300 ms of network**, even when SQL is instantaneous. A product navigation pays:

1. **Proxy** `getClaims()` (Auth HTTP)
2. **Layout** `getUser()` (Auth HTTP, **not** request-deduplicated with proxy)
3. **Layout** membership lookup (PostgREST)
4. **Page** domain queries (many PostgREST/RPC calls, some still in waves)

Next.js then **prefetches every in-viewport `<Link>`** as a **full RSC render**. Bottom navigation (5 tabs) plus Money/Home module rows (savings, investments, loans, debts, accounts, Plan) fire **in parallel**. That matches the screenshot: many 1–8s rows for money / transactions / savings / investments / income / home at once. Connection contention against one Supabase host multiplies the 200–300 ms RTT into seconds.

High-confidence fixes in this pass:

- Disable prefetch on viewport product links (`PRODUCT_LINK_PREFETCH = false`).
- Batch `listLoans` N+1 (3 queries × N loans → 2 household-scoped queries).
- Exclude settled `card_billing_months` from the hub list.
- Request-local `createSupabaseServerClient` via React `cache()`.
- `cache()` `listCreditCards`.
- Opt-in `VINHA_PERF_TRACE=1` fetch/auth timing (path + duration only).

## Architecture

```text
Browser (next-intl Link / App Router navigation)
  → proxy.ts (next-intl rewrite + updateSession → supabase.auth.getClaims)
  → app/[locale]/(product)/layout.tsx
       requireProductSession → getSessionUser (getUser) → resolveActiveMembership
       Suspense: countUnreadOpenInboxItems
  → page.tsx (RSC)
       getSessionUser / membership (React cache hit after layout)
       Promise.all(module queries)
         → createSupabaseServerClient (React cache, user JWT, RLS)
         → PostgREST / RPC
         → map + serialize RSC payload
  → Client leaves (HeroUI). QueryClientProvider is mounted; zero useQuery call sites.

Server Actions: app/**/actions + modules/*/application/commands
  (no layout; each action re-runs getUser + assertMoneyActionAllowed)

Route Handlers: only admin market sync. Not on the product path.

There is no internal Server Component → /api → Supabase hop.
```

**Entry points that hit the backend**

| Kind             | Where                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| Proxy            | `proxy.ts` → `updateSession`                                           |
| Product layout   | `requireProductSession`, inbox unread count                            |
| RSC pages        | `app/[locale]/(product)/**/page.tsx`                                   |
| Server Actions   | `"use server"` in `app/` + module commands                             |
| Browser Supabase | `modules/platform/supabase/browser.ts` (auth/onboard; not Money reads) |
| Admin API        | `app/api/admin/market-*-sync`                                          |

## Request Flow Map

```text
Typical product GET (e.g. /vi/money)
────────────────────────────────────
Wave A  proxy getClaims()                         ~200–300 ms  (measured RTT class)
Wave B  layout getUser()                          ~200–300 ms  UNVERIFIED Auth API
Wave C  layout membership                         ~200–300 ms
Wave D  page queries in Promise.all
        (each remaining sequential inner wave
         adds another ~200–300 ms)
        + optional sibling prefetches of other
          routes competing for the same host
```

React `cache()` deduplicates `getSessionUser`, `resolveActiveMembership`, `assertMoneyActionAllowed`, `getPlanPulse`, `getRealPosition`, inbox open/count helpers, `listAccounts`, `listLoans`, `listLoanSummaries`, `listSavings`, `listDebts`, investment summaries, `getSavingsHomeSummary`, and now `listCreditCards` **within one RSC request only**. Prefetch is a **new request**; cache does not help across those rows.

## Slow Request Inventory

Typical times are **structural estimates** using 250 ms median REST RTT. They are not browser TTFB.

| Screen       | Request (browser)     | Entry Point             | Server Function                                                                       | DB Query/RPC                                                                                     | Sequential/Parallel                                  | Cache                       | Payload                 | Typical Time              |
| ------------ | --------------------- | ----------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | --------------------------- | ----------------------- | ------------------------- |
| Home         | `/[locale]/home` RSC  | `home/page.tsx`         | `getHomeDashboard` + 4 product summaries                                              | position RPC, pulse, inbox, period txs, savings cycles, investments, loan summaries, debts       | Auth 3 waves, then parallel; inner position 2 waves  | request-local on hot reads  | dashboard + 4 summaries | 1.0–2.5 s est.            |
| Money        | `/[locale]/money` RSC | `money/page.tsx`        | `getRealPosition`, `listCreditCards`, savings/invest/loan/debt summaries              | accounts + `get_account_ledger_balances`, unsettled billing months, light loan select            | Auth 3 waves, then parallel; cards 2 waves           | same                        | hub view-model          | 1.0–2.5 s est.            |
| Transactions | `/money/transactions` | `transactions/page.tsx` | `listTransactionEvents` + tags                                                        | paged txs (page size constant)                                                                   | Auth then 2 queries                                  | none extra                  | one page of activities  | 0.8–1.5 s est.            |
| Savings      | `/money/savings`      | `savings/page.tsx`      | `listSavings`                                                                         | all savings + all cycles; per-provider package lookup                                            | Auth then 2–3 waves                                  | `listSavings`, packages     | full savings + cycles   | 1.0–2.0 s est.            |
| Investments  | `/money/investments`  | `investments/page.tsx`  | `listInvestmentPortfolio`                                                             | holdings + lots + valuations + activities                                                        | Auth then portfolio graph                            | portfolio cache             | full portfolio          | 1.0–2.5 s est.            |
| Plan         | `/[locale]/plan` RSC  | `plan/page.tsx`         | pulse, jar budgets, inbox, goals, 7-day upcoming                                      | jars, period txs ×2, snapshots, adjustments, recurring income; upcoming: cards/loans/liabilities | Auth; budgets: settings+pulse then 6-way Promise.all | pulse cached inside budgets | hub preview             | 1.2–3.0 s est.            |
| Goals        | `/plan/goals`         | `listGoals`             | goals + funding links; **if links exist** `listSavings` / portfolio / linked accounts | fan-out only when funding links exist                                                            | Parallel by source kind                              | savings/portfolio if reused | goals list              | 0.8–3 s                   |
| Inbox        | `/inbox`              | `listOpenInboxPage`     | open page (26) + enrich                                                               | bounded + transaction enrich                                                                     | Auth then page + enrich                              | open-page cache             | 25 items                | 0.8–1.5 s est.            |
| Together     | `/together`           | members + invites       | light                                                                                 | members, invites                                                                                 | Parallel after auth                                  | membership                  | small                   | 0.6–1.2 s est.            |
| Health       | `/health`             | `getHealthDetail`       | position + pulse + inbox + recent txs                                                 | repeats uncached-by-page helpers (cache helps if same request)                                   | Parallel after auth                                  | position/pulse/inbox        | detail                  | 1.0–2.0 s est.            |
| Loans        | `/money/loans`        | `listLoans`             | loans + aggregates                                                                    | **was** 1 + 3N; **now** 1 + 2 batched                                                            | Auth then loans then 2 parallel                      | `listLoans`                 | full loan rows          | was 3N RTT                |
| Prefetch set | 5–10 RSC in parallel  | viewport Links          | **each is a full row above**                                                          | multiplied                                                                                       | **contended**                                        | none across requests        | N × payloads            | **2–10 s observed class** |

Income in the screenshot is consistent with Money capture (`/money/transactions/new`) or investment income, plus prefetch of Money children — not a separate REST API.

## Performance Baseline

| Request                        | Before (evidence)                                                     | DB SQL (prior) | Server     | Payload         | Queries (structural)     |
| ------------------------------ | --------------------------------------------------------------------- | -------------- | ---------- | --------------- | ------------------------ |
| Hosted PostgREST RTT           | **202–309 ms** measured                                               | n/a            | n/a        | n/a             | 1 HTTP                   |
| `/home` RSC                    | UNVERIFIED TTFB; 3 auth waves + ~8–12 REST                            | <2 ms/query    | UNVERIFIED | small household | ~12–20 HTTP              |
| `/money` RSC                   | UNVERIFIED; plus **viewport prefetch of 4–8 sibling routes**          | <2 ms          | UNVERIFIED | hub             | ~10–15 + N prefetches    |
| `/plan` RSC                    | UNVERIFIED; jar-budget 2 waves after auth                             | <2 ms          | UNVERIFIED | hub             | ~12–18                   |
| `listLoans` (N loans)          | **3N+1** HTTP before this pass                                        | <2 ms          | n/a        | N rows          | **3N+1 → 3**             |
| Screenshot 1–8 s multi-request | **prefetch storm + RTT contention** (architecture + network), not SQL | fast           | UNVERIFIED | RSC             | tens of HTTP overlapping |

Do not treat millisecond SQL as user-visible TTFB.

## Next.js Analysis

- Product routes are correctly **dynamic** (cookies + auth). Do not static-cache household money.
- Layout **blocks children** until `requireProductSession` finishes (`getUser` then membership). That is two RTTs before page `Promise.all`. Keeping the layout gate preserves onboard/login redirects for every product route.
- RSC serialization is not the dominant cost at 20 transactions. Large households would feel `listSavings` cycles and investment portfolio props.
- `QueryClientProvider` is mounted with `staleTime: 30_000` and **zero `useQuery`**. Client cache does not participate in these slow rows.
- Bottom nav Links were default-prefetching **four other full dashboards** on every product page.

## API Gateway Analysis

There is no product API gateway. Admin `/api/admin/*` is cron/sync only. Server Components call module queries, not `fetch('/api/...')`. No internal HTTP hop to remove.

## Authentication Analysis

| Step              | Call                       | Deduped?        | Network                       |
| ----------------- | -------------------------- | --------------- | ----------------------------- |
| Every matched GET | proxy `getClaims()`        | per request     | Auth HTTP + cookie refresh    |
| Product layout    | `getUser()`                | React `cache()` | **Second** Auth HTTP          |
| Product layout    | `household_members`        | React `cache()` | PostgREST                     |
| Every money query | `assertMoneyActionAllowed` | React `cache()` | hits cached user + membership |

Authorization is not weakened. Client-provided household IDs are still unused. RLS still applies on the user-scoped server client.

`getUser()` on every RSC is the correct fail-closed check (revoked sessions). Replacing it with `getClaims()`-only would skip Auth server revocation until JWT expiry — **not done**.

## Supabase/Postgres Analysis

Prior audit: hottest SQL **0.06–1.6 ms**, 20 transactions. Advisors reported unused indexes at this volume; not the 2–10 s symptom.

Balances no longer download full transaction history in Node (`get_account_ledger_balances` RPC — already in the working tree).

This pass does not add indexes: there is no slow query plan to justify them.

PostgREST 1000-row cap: still a **scale** risk for batched `loan_payments` / `loan_schedule_entries` and unbounded savings cycles. Not the current 20-row household.

## N+1 Analysis

| Path                        | Before                                   | After                         | Notes                                        |
| --------------------------- | ---------------------------------------- | ----------------------------- | -------------------------------------------- |
| `listLoans`                 | 3 queries per loan (parallel N+1)        | 2 queries for all loan IDs    | `getLoan` still uses the 3-query single path |
| `listSavings` cycles        | batched `.in(saving_id)` with N fallback | unchanged                     | fallback is error path                       |
| `setMaturityActionRequired` | per saving `listProviderPackages`        | already `cache()` by provider | OK                                           |
| Inbox enrich                | batched transaction details              | unchanged                     |                                              |

## Duplicate Request Analysis

| Duplicate                           | Verdict                                                             |
| ----------------------------------- | ------------------------------------------------------------------- |
| Layout auth + page auth             | **Expected**; React `cache()` makes page a hit                      |
| `getPlanPulse` on Plan hub          | **Fixed earlier** with `cache()`; jar budgets reuse it              |
| Inbox count vs `listOpenInboxItems` | **Expected**; different shapes (badge vs 25-row enrich)             |
| Viewport Link prefetch              | **Unnecessary** full RSC clones; **disabled** on nav/hub/home links |
| Home vs Money `getRealPosition`     | Separate navigations; not the same request                          |
| React Query vs RSC                  | Provider unused; not a duplicate fetch layer                        |

## Waterfall Analysis

| Location               | Waves                                    | Theoretical extra latency @ 250 ms   |
| ---------------------- | ---------------------------------------- | ------------------------------------ |
| proxy → layout getUser | cannot merge (different runtimes)        | +250 ms                              |
| getUser → membership   | membership needs `user.id`               | +250 ms                              |
| layout → page data     | layout await blocks children             | +0 after membership (cache)          |
| `getRealPosition`      | accounts then RPC                        | +250 ms                              |
| `listCreditCards`      | accounts then settings+months            | +250 ms                              |
| `getCurrentJarBudgets` | settings+pulse, then 6-way `Promise.all` | +250 ms (necessary for jar ids / TZ) |
| Prefetch N routes      | N × (auth waves + data) contended        | **seconds**                          |

Independent page queries (Money hub `Promise.all` of 6 domains, Home dashboard inner `Promise.all`) are already parallel.

## Payload Analysis

At current cardinality, JSON size is not the 2–10 s cause. Remaining over-fetch:

- Savings list: all cycles for all products (Home already uses `getSavingsHomeSummary`).
- Investment **detail** historically loaded the full portfolio for one id (prior audit).
- Credit card **hub** previously downloaded **settled** billing months; hub outstanding ignores settled — **filtered this pass**.
- Plan hub upcoming already dropped full calendar + `getRealPosition`.

## Caching Analysis

| Layer              | Used?                  | Safety                                      |
| ------------------ | ---------------------- | ------------------------------------------- |
| React `cache()`    | Yes, request-local     | Safe; one household per gated request       |
| `unstable_cache`   | Not used for money     | Must not introduce for financial data       |
| Next `fetch` cache | Not used for PostgREST | supabase-js uses fetch; no-store by cookies |
| React Query        | Mounted, unused        | Do not add globally                         |
| Cross-request LRU  | None                   | Must never leak across users/households     |

`createSupabaseServerClient` is now request-local `cache()` (cookie parse once per RSC).

## Root Causes

### P0 — Viewport prefetch of full authenticated RSC trees

- **Evidence:** Next.js Link default prefetch; 5-tab nav always in viewport; Money/Home module rows in viewport; screenshot of simultaneous money/transactions/savings/investments/home rows; 200–300 ms RTT × many contended requests.
- **Affected:** every product page with those links.
- **Impact:** turns one navigation into 5–10 full dashboards. Estimated **multi-second** contention.
- **Confidence:** high (architecture + network measurement). Exact screenshot TTFB UNVERIFIED.
- **Complexity:** low. **Risk:** first click after landing has no warm RSC cache (acceptable vs starving the current page).

### P1 — Sequential Auth HTTP (`getClaims` + `getUser` + membership) before data

- **Evidence:** `proxy.ts`, `get-session-user.ts`, `require-product-session.ts`. Two Auth round-trips plus one PostgREST before page `Promise.all`.
- **Impact:** ~0.6–0.9 s floor on every product GET at measured RTT.
- **Confidence:** high on structure; UNVERIFIED on Auth API duration.
- **Risk:** do not drop `getUser()` (revocation).

### P1 — `listLoans` N+1 (3 queries × N)

- **Evidence:** source `Promise.all(loans.map(loanAggregates))`.
- **Impact:** 10 loans ≈ 30 extra RTTs (~7.5 s if serialized; less if parallel but still connection-heavy). Current DB has 0 loans — not today’s screenshot, **is** the loans page at scale.
- **Confidence:** high. **Risk:** batched payments/schedule still PostgREST-capped at 1000 rows.

### P2 — Inner two-wave queries (position RPC, cards, jar budgets)

- Necessary data dependencies. ~250 ms each. Worth a later combined RPC, not a rewrite now.

### P2 — Duplicate `households` selects per page

- Pulse, position, cards, goals each load `base_currency`. Request-local household row helper would save 1–3 RTTs if those stay sequential; many already run in parallel so wall-clock win is small.

### P3 — Unused React Query; extra `createSupabaseServerClient` construction (now cached)

## Remediation Implemented

1. **`PRODUCT_LINK_PREFETCH = false`** on bottom nav, Money module rows, Money account/card rows, Home product rows, Home Plan CTA.
2. **`listLoans`**: `loadLoanAggregatesByIds` + `foldLoanListAggregates` (2 queries, in-memory fold). `getLoan` unchanged.
3. **`listCreditCards`**: `.neq(status, SETTLED)` on hub months; React `cache()`.
4. **`createSupabaseServerClient`**: React `cache()` + optional traced `fetch`.
5. **`VINHA_PERF_TRACE=1`**: `console.error` logs `{ op, method, path, status, ms }` for PostgREST/Auth fetches and `auth.getUser` / `auth.getClaims` spans. No tokens, bodies, or financial rows.

Jar-budget GET remains a pure read (snapshots persist on commands) — already in the working tree; not re-opened.

## Before / After Measurements

| API / Flow                   | Before                    | After                     | Improvement                       | Root Cause                  |
| ---------------------------- | ------------------------- | ------------------------- | --------------------------------- | --------------------------- |
| Viewport prefetch (5–10 RSC) | Default on (N full trees) | Off on hub/nav/home links | **Removes N−1 contended RSC**     | Duplicate request storm     |
| `listLoans` query count      | 1 + 3N HTTP               | 1 + 2 HTTP                | **3N → 2** aggregate round-trips  | N+1                         |
| Credit card hub months       | All months                | Unsettled only            | Smaller payload; same outstanding | Over-fetch                  |
| Supabase server client       | New client per query      | One per RSC               | Cookie/`cookies()` once           | Setup overhead              |
| Hosted REST RTT              | 202–309 ms (measured)     | unchanged                 | n/a                               | Network to `ap-southeast-2` |
| Authenticated `/money` TTFB  | UNVERIFIED                | UNVERIFIED                | Enable `VINHA_PERF_TRACE=1`       | Need signed-in run          |

Never fabricated RSC millisecond before/after. SQL remains sub-2 ms at current size.

## Remaining Bottlenecks

1. **`getUser()` + `getClaims()` double Auth HTTP** on every navigation (~2 RTTs). Keep for security; optional later: session-only layout if pages always re-gate (still need `getUser` once).
2. **Layout blocks children** on membership (~1 RTT). Moving onboard redirect to pages would overlap membership with data; slightly weaker layout guarantee.
3. **Vietnam → Sydney RTT (~200–300 ms)**. Local Supabase for day-to-day testing would collapse this. Hosting closer to users is an infra choice, not an app bug.
4. **Plan hub jar-budget wave** (settings/pulse then period loads).
5. **`listSavings` / investment portfolio** still heavy for those screens.
6. **PostgREST 1000-row cap** on batched loan aggregates and cycle lists — needs SQL `GROUP BY` RPC when N grows.
7. **Plan/calendar/inbox Links** still default-prefetch (less viewport-dense than bottom nav).
8. **Next.js `next dev` compile** can add seconds; screenshot may mix compile + RTT. Production `next start` will be lower compile cost, **same** PostgREST RTT and prefetch (now reduced).

## Recommended Next Steps

1. Run the app with `VINHA_PERF_TRACE=1`, sign in, load Home then Money, and capture `[vinha.perf]` spans (path + ms only).
2. If Auth `getUser` is >200 ms, keep it but ensure it runs **once** per request (already cached) and consider not prefetching remaining Plan/Inbox links.
3. When loans/payments exceed hundreds of rows, replace batched PostgREST with `get_loan_list_aggregates` RPC (`SUM` / `COUNT` / first upcoming).
4. Optional: request-local `getHouseholdSettings` to collapse duplicate `households` selects.
5. Do not introduce cross-request caching of balances, jars, or inbox.

API PERFORMANCE INVESTIGATION PASS
