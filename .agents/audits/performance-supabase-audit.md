# ViNha Performance & Supabase Audit

| Field           | Value                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Date            | 8 Sep 2026                                                                                                                                 |
| Scope           | Read-only performance + Supabase production-performance investigation                                                                      |
| Predecessor     | Architecture & Engineering Quality Audit — READY FOR NEXT QUALITY GATE ([engineering quality audit](14b8bc78-4a4e-4a53-9372-dfa3f59c559a)) |
| Code changes    | None                                                                                                                                       |
| Linked database | Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`, `ap-southeast-2`, ACTIVE_HEALTHY)                                            |
| Local stack     | Docker daemon not running; no local Supabase; no Next.js TTFB captured                                                                     |

## 1. Executive Summary

ViNha’s **query SQL is not currently slow** on the linked production-like database. Measured `EXPLAIN ANALYZE` times for the hottest statements are **0.06–1.6 ms execution** against tiny tables (20 transactions, 12 accounts, 30 savings, 21 holdings). Inbox unread counting already uses an index.

The application is **not ready to certify realistic household scale**. The Plan hub, jar-budget read path, and real-position calculation are round-trip and payload problems, not missing-index problems at today’s cardinality.

Verified predecessors:

| Prior ID | Claim                                                         | This audit                                                                                                                                                          |
| -------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EQ-01    | Plan hub fan-out / waterfall                                  | **Confirmed.** Top-level `Promise.all` hides a sequential jar-budget chain, a calendar domain fan-out, and optional full-product goal hydration.                    |
| EQ-02    | `getCurrentJarBudgets()` sequential + snapshot writes on read | **Confirmed.** Period snapshots are inserted during GET. Insert errors are ignored. Unique `(jar_id, period_month)` prevents durable duplicates.                    |
| EQ-03    | `getPlanPulse()` uncached and duplicated                      | **Confirmed on Plan.** Hub calls it directly and again inside `getCurrentJarBudgets()`. Not wrapped in `cache()`.                                                   |
| EQ-04    | `getRealPosition()` scans full transaction history            | **Confirmed.** Selects every balance-status row for liquid accounts, then sums in Node. Same pattern in `listAccounts()`.                                           |
| EQ-11    | Duplicate inbox work Home vs chrome                           | **Confirmed.** Layout runs `countUnreadOpenInboxItems()`. Home/Plan/Health/jar-detail also run `listOpenInboxItems()` (limit 25 + enrich). Separate `cache()` keys. |
| EQ-17    | Unbounded savings/detail queries                              | **Partially confirmed.** Home/Money already use `getSavingsHomeSummary()`. `listSavings()`, savings detail, and investment **detail** still over-fetch.             |
| EQ-18    | Broad `revalidatePath()`                                      | **Confirmed for money/investment mutations.** Paths are filesystem `APP_ROUTE` patterns, never `"/"`. Most jar mutations do **not** revalidate.                     |
| EQ-22    | Unused `QueryClientProvider`                                  | **Confirmed.** `@tanstack/react-query` is mounted; **zero** `useQuery` / `useMutation` call sites.                                                                  |

**Gate implication:** current-household latency will look fine. Medium and large households will pay linear transaction scans, PostgREST row-cap risk on balances, Plan hub domain fan-out, and loan N+1. That is not a production-scale GO.

## 2. Baseline Measurements

### 2.1 What was measured vs not

| Signal                                         | Status                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| SQL `EXPLAIN ANALYZE` on `family-finances-2`   | Measured (section 10)                                                     |
| Table row counts on `family-finances-2`        | Measured                                                                  |
| Supabase performance advisors                  | Measured (102 unindexed FKs; 16 unused indexes at this volume)            |
| Slow-query CSV / `pg_stat_statements`          | **Not available** in repo; extension query did not return statement stats |
| Next.js TTFB / RSC render duration / hydration | **Not measured** — no running `next dev`/`start`, Docker down             |
| Browser Lighthouse                             | Not used (and not a substitute here)                                      |
| PostgREST `max_rows` dashboard setting         | **Not confirmed** (hosted default is commonly 1000)                       |

Do not treat the millisecond SQL times below as user-visible TTFB. They exclude auth, RLS as the authenticated role, PostgREST serialization, Vercel/Node, and sequential round-trips.

### 2.2 Linked database volume (exact counts)

| Table                                         |        Rows |
| --------------------------------------------- | ----------: |
| households                                    |           3 |
| accounts                                      |          12 |
| transactions                                  |          20 |
| jars                                          |          10 |
| jar_period_rule_snapshots                     |           9 |
| goals / goal_funding_links                    |       0 / 0 |
| savings / saving_cycles                       |     30 / 31 |
| loans / loan_payments / loan_schedule_entries |   0 / 0 / 0 |
| liabilities                                   |           0 |
| inbox_items                                   |           9 |
| recurring_rules                               |           0 |
| investment_holdings / valuations / lots       | 21 / 15 / 0 |

One household (`af7b034d-ddfe-4c3f-8990-2179e667701d`) holds the 20 transactions. This is **below the “small household” scenario** in section 15.

### 2.3 Route fetch posture (source, not TTFB)

| Route             | Parallelism                                                                                                               | Dominant cost                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `/` Home          | Session → membership, then `Promise.all` dashboard + four product summaries; layout unread count in Suspense              | `getRealPosition` history + month/quarter txs + full open inbox page |
| `/money`          | Session → membership, then `Promise.all` position + cards + savings summary + debts + loan summaries + investment summary | `getRealPosition` + `listCreditCards` (unbounded billing months)     |
| `/plan`           | Session → membership, then `Promise.all` pulse + jar budgets + inbox + goals + calendar                                   | Jar-budget waterfall **and** calendar fan-out; pulse duplicated      |
| `/plan/calendar`  | `getHouseholdCalendar`                                                                                                    | Same calendar graph as Plan hub                                      |
| `/inbox`          | Paginated open page (26) or archived (100) + `after()` workers                                                            | Bounded; workers are extra writes                                    |
| `/together`       | Members + pending invites                                                                                                 | Light (~5 RT)                                                        |
| `/health`         | `getHealthDetail` parallel position + pulse + inbox + 8 recent txs                                                        | Repeats uncached position/pulse/inbox                                |
| Savings detail    | `getSaving` **and** `listSavingCycles` in parallel (duplicate cycles)                                                     | Duplicate cycle reads                                                |
| Investment detail | `getInvestmentHoldingResult` → **all** holdings/lots/valuations                                                           | Full portfolio for one id                                            |
| Loan/debt detail  | Full payments/schedule + `listAccounts` history                                                                           | Unbounded child rows + balance scan                                  |

## 3. Plan Hub Trace

File: `app/[locale]/(product)/plan/page.tsx`

Auth is sequential then cached (`getSessionUser`, `resolveActiveMembership`). Product chrome also runs `countUnreadOpenInboxItems()` in layout Suspense.

```text
PlanHubPage
  ├── getSessionUser()                         [cache]
  ├── resolveActiveMembership()                [cache]
  └── Promise.all
       ├── getTranslations("plan"|"catalog")
       ├── getPlanPulse()                      ★ not cached; DB: households + jars(+jar_plans)
       ├── getCurrentJarBudgets()              ★ sequential waterfall; calls getPlanPulse() again
       │    ├── loadHouseholdSettings          (households; fallback select if first fails)
       │    ├── getPlanPulse()                 DUPLICATE of sibling
       │    ├── loadPeriodTransactions(current)  transactions ⋈ accounts.financial_scope
       │    │    └── loan_payments (period)      sequential after txs
       │    ├── loadRecurringIncome              recurring_rules (all active income)
       │    ├── loadSnapshots                    jar_period_rule_snapshots (2 months)
       │    ├── loadPeriodTransactions(previous) sequential second month scan
       │    ├── loadAdjustments(previous)
       │    ├── ensureSnapshots()                INSERT jar_period_rule_snapshots if missing
       │    └── loadAdjustments(current)
       ├── listOpenInboxItems()                [cache] pending, limit 25, then enrich
       ├── listGoals()                         goals + funding links; if any links:
       │    └── mapFundingLinks → Promise.all
       │         ├── listSavings()             [cache] all savings + all cycles
       │         ├── listAccounts()            [cache] liquid accounts + ALL balance txs
       │         ├── listInvestmentPortfolio() [cache] all holdings/lots/valuations + all activities
       │         ├── listLoans()               [cache] N×3 aggregates
       │         └── listDebts()               [cache] all liabilities
       └── getHouseholdCalendar()
            └── WAVE A Promise.all
                 ├── listRecurring()
                 ├── listCreditCards()         unbounded card_billing_months
                 ├── listLoans()               N×3 (deduped if goals also called it)
                 ├── listLiabilities()
                 ├── getRealPosition()         unbounded txs  ★ not cached
                 └── listUpcomingLoanScheduleEntries()  all upcoming, no date window
            └── WAVE B sequential
                 └── listPayoffInboxItems()    inbox_items EMI_COMPLETE pending
```

UI actually rendered on Plan hub:

- ≤ `PLAN_HUB_VISIBLE_JAR_LIMIT` jars (preview)
- ≤ 3 goals (`pickHomeGoals`)
- ≤ 3 upcoming events in a 7-day window
- exception/recommendation flags, emergency banner from inbox items

**The hub loads substantially more than it paints** whenever calendar, goals-with-funding, or jar-budget history run. With **zero goals and zero loans** (current DB), the expensive leftover is still the jar-budget waterfall + duplicate pulse + full calendar projection for three “upcoming” rows + a 25-row inbox enrich.

Independent queries that could start together after auth: pulse, period txs, recurring income, snapshots, adjustments, inbox, goals, calendar children. Today jar budgets **serialize** several of those.

## 4. Home Performance

File: `app/[locale]/(product)/home/page.tsx` → `getHomeDashboard()`

```text
HomePage
  ├── getSessionUser / resolveActiveMembership     [cache]
  ├── layout: countUnreadOpenInboxItems            [cache, separate key]
  └── Promise.all
       ├── getHomeDashboard
       │    └── Promise.all
       │         ├── getRealPosition()             unbounded txs, not cached
       │         ├── getPlanPulse()                not cached
       │         ├── listOpenInboxItems()          full page + enrich for count + 1 boolean
       │         └── listTransactionsForDateRange  month or quarter, no .limit
       ├── getHomeSavingsSummary → getSavingsHomeSummary     [cache] lean
       ├── getHomeInvestmentSummary → listInvestmentHomeSummary [cache] RPC + market
       ├── getHomeLoanSummary → listLoanSummaries            [cache] stored columns only
       └── getHomeDebtSummary → listDebts                    [cache] full liability rows
```

Home already uses the **lightweight money summaries** guarded by `tests/unit/home-product-summary-query-shape.test.ts`. That prior work is real.

Remaining Home issues:

1. `openInboxCount = inbox.length` after a **limit 25** list — under-counts above 25. `countOpenInboxItems()` already exists and is unused here.
2. `canReviewUncategorized` is `.some(UNMAPPED_EXPENSE)` on that same 25-row page — can miss older unmapped items.
3. Layout unread count is a second inbox round-trip (correctly a `head: true` count).
4. `getRealPosition` is uncached; Health/Money/Calendar each pay it again on their own requests (not the same RSC request as Home).

## 5. Money Performance

File: `app/[locale]/(product)/money/page.tsx`

Top-level `Promise.all` of six domain reads. **Good:** `getSavingsHomeSummary`, `listInvestmentHomeSummary`, `listLoanSummaries` instead of full product lists (`tests/unit/money-summary-query-shape.test.ts` still passes).

**Costly:**

- `getRealPosition()` — full history scan (same as Home).
- `listCreditCards()` — **not** `cache()`’d; loads all `card_billing_months` for the household.
- `listDebts()` — full `DEBT_SELECT` including archived; hub only needs active aggregates.

Money hub UI needs per-account **balances** and module **totals**. It does not need every historical transaction row in the application process.

## 6. Balance / Position Calculation

File: `modules/ledger/application/queries/get-real-position.ts`

### Current behavior

1. `assertMoneyActionAllowed()` (cached).
2. Parallel: `households.base_currency`, liquid non-archived `accounts`.
3. `listActiveMembershipIds` for owners.
4. **All** `transactions` with `account_id, type, amount` where `status IN TRANSACTION_BALANCE_STATUS_VALUES` (pending_mapping, posted, partially/fully refunded, reversed). **No date, no limit, no SQL sum.**
5. `applyTransactionDeltas()` in memory (O(accounts + txs)).

`listAccounts()` (`modules/ledger/application/queries/list-accounts.ts`) is the same scan, wrapped in `cache()`. `getRealPosition()` is **not** cached, so Plan calendar and Home/Money/Health each execute it independently.

### Measured plan (20 txs)

Hash join + sequential scans. Execution **0.184 ms**. Planner correctly ignores btree indexes at this size. Planning time **4.3 ms** dominated execution.

### Scale (estimates, not measured)

|   Tx rows | Expected shape                                               | Risk                                                        |
| --------: | ------------------------------------------------------------ | ----------------------------------------------------------- |
|     1,000 | Index or seq + full PostgREST payload                        | Still one query; Node sum cheap                             |
|    10,000 | Index on `(household_id, …)` likely; payload ~hundreds of KB | User-visible on every Home/Money/Plan calendar              |
|   100,000 | Must not ship rows to Node                                   | Multi-second or timeout; **truncation if `max_rows` binds** |
| 1,000,000 | Requires SQL aggregate or stored current balance             | App-side scan is not viable                                 |

Hosted PostgREST commonly caps rows (often 1000). This codebase **does not paginate** the balance query. If that cap applies, balances become **silently wrong** (BR-01) once history exceeds the cap. Dashboard `max_rows` was **not** read in this audit — verify before GA.

### Recommendation (do not implement in this audit)

1. Wrap `getRealPosition` in `cache()` (request-local; no financial-rule change).
2. Replace row download with a security-invoker RPC: `GROUP BY account_id` of signed amounts, or `SUM` per account. Keep opening_balance + delta semantics identical; prove with existing `tests/unit/ledger-accounts.test.ts`.
3. Do **not** introduce a materialized current-position table until an aggregate RPC is still too slow at measured 10k–100k volume.

## 7. Supabase Query Audit

### 7.1 Highest-cost application queries

| Query                                                 | Filter                                            | Bound                                       | Notes                                                    |
| ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| `getRealPosition` / `listAccounts` / `getAccount` txs | household + account_id(s) + status IN             | **None**                                    | Balance engine                                           |
| `loadPeriodTransactions`                              | household + date range + accounts.financial_scope | Period, no limit                            | Called **twice** (current + previous month) sequentially |
| `listTransactionsForDateRange`                        | household + date range                            | Date only                                   | Home month/quarter analytics                             |
| `listLoans` → `loanAggregates`                        | per loan_id                                       | Payments unbounded; schedule count + next-1 | **N+1 × 3**                                              |
| `listUpcomingLoanScheduleEntries`                     | household + status=upcoming                       | **None**                                    | Calendar; no 3-month window                              |
| `listGoals` → `mapFundingLinks`                       | any active funding link                           | Full five domains                           | Hub still calls `listGoals()`                            |
| `loadHoldings`                                        | household                                         | All valuations + all lots                   | Detail page uses this then `.find(id)`                   |
| `listInvestmentPortfolio`                             | + `listInvestmentActivities()` no holdingId       | All operations                              | Goal funding                                             |
| `listSavings`                                         | household                                         | All cycles                                  | Goal funding / savings list                              |
| `getSaving` + `listSavingCycles`                      | one saving                                        | All cycles **twice**                        | Detail page                                              |
| `listCreditCards`                                     | type=credit_card                                  | All billing months                          | Money + calendar                                         |
| `listDebts`                                           | household                                         | Includes archived                           | Home/Money filter in memory                              |
| `getPlanPulse`                                        | household jars                                    | All jars, filter active in memory           | Duplicate on Plan                                        |
| `listOpenInboxItems`                                  | pending + kind + assignee                         | **limit 25**                                | Extra vs layout count                                    |

### 7.2 N+1

Confirmed in `loadLoans`: `Promise.all(rows.map(loanAggregates))` with three queries each (`list-money-products.ts`). Calendar and goal funding both call `listLoans` (React `cache` dedupes **within one request**).

Mild: matured savings call `listProviderPackages` per saving; packages are `cache()`’d per provider.

Inbox enrichment uses batched `.in(...)` — not N+1.

### 7.3 SELECT *

Product code: `link-goal-funding.ts` single-row `.select("*")` only. Not a list hot path.

### 7.4 RPCs

Investment hub already uses `get_investment_home_summary_inputs()` (rewritten in `20260905070501_query_performance_hotpaths.sql`). Ledger mutations are RPC-gated. **Reads** for position, jars, calendar, and loans are PostgREST + Node, not aggregates.

`enqueue_savings_maturity_cascade` loops matching cycles and `produce_inbox_item` per row — acceptable for small maturity sets; not a hub read.

## 8. PostgreSQL Index Audit

Hotpath migration added `idx_transactions_household_date_created (household_id, transaction_date, created_at)`. Confirmed present on `family-finances-2`.

### 8.1 Query vs index (recommend only when volume + shape justify)

| Query                                  | Main filter                            | Join                     | Order            | Existing                                                                         | Recommend?                                                                                                                                                           | Evidence                                                    |
| -------------------------------------- | -------------------------------------- | ------------------------ | ---------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Liquid accounts                        | household_id, is_archived, type IN     | —                        | created_at       | **No household_id index** (advisor: `accounts_household_id_fkey` unindexed)      | **Yes:** `(household_id, is_archived, type)`                                                                                                                         | Advisor + every hub; seq scan today only because 12 rows    |
| Balance txs                            | household_id, account_id IN, status IN | —                        | none             | household_created, account_created, household_date                               | **Yes, after aggregate RPC decision.** If rows must be fetched: `(household_id, account_id)` or covering `(household_id, account_id, status) INCLUDE (type, amount)` | Shape is status+account not date; date index does not match |
| Period jar txs                         | household_id, transaction_date range   | accounts.financial_scope | date, created_at | **Matches** `idx_transactions_household_date_created`                            | No new index until 10k+ EXPLAIN shows seq                                                                                                                            | At 20 rows planner seq-scanned (correct)                    |
| Pulse jars                             | household_id                           | jar_plans embed          | sort_order       | Partial active `(household_id, sort_order)`                                      | Optional full `(household_id)` if archived/paused lists grow                                                                                                         | Pulse loads **all** jars then filters                       |
| Loan aggregates                        | loan_id + status=upcoming              | —                        | sequence         | `(loan_id, sequence)` only                                                       | **Yes** if N loans × schedule: `(loan_id, status, sequence)`                                                                                                         | Status not in index                                         |
| Inbox unread                           | household, pending, read_at IS NULL    | —                        | —                | `inbox_items_open_unread_idx`                                                    | No                                                                                                                                                                   | EXPLAIN used index                                          |
| Savings home                           | household, status <> closed            | cycles by saving_id      | —                | savings `(household_id, status, created_at)`; cycles `(saving_id, cycle_number)` | No                                                                                                                                                                   | 30-row seq scan; index exists                               |
| Investment valuations                  | household_id                           | —                        | date DESC        | `idx_investment_valuations_latest`                                               | No for hub; **query should filter holding_id on detail**                                                                                                             | Detail loads all valuations                                 |
| 102 unindexed FKs (`created_by`, etc.) | write/delete paths                     | —                        | —                | missing                                                                          | **No mass-add.** Only add FKs that show up in EXPLAIN on deletes/joins                                                                                               | Advisor INFO; write-path                                    |

Do **not** add indexes merely because a column is filtered. At current volume almost every btree is unused (advisor lists 16 unused indexes including some transaction partials). Unused ≠ drop; volume is too small for index-use stats to be meaningful.

## 9. Slow Query Analysis

- No slow-query CSV in the repository.
- `pg_stat_statements` was not returned as a usable statement list from the linked project in this session.
- Supabase performance advisors are **index hygiene**, not latency traces.

There is **no evidence** that any single SQL statement is currently slow in production. Prioritization must use **total round-trips × frequency × growth**, not max(EXPLAIN ms) on 20-row tables.

## 10. Duplicate Fetching

| Data                            | Surfaces                                                | Deduped?                                                                    |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| Auth gate                       | Every money/plan query                                  | **Yes** — `cache(assertMoneyActionAllowed)`                                 |
| Session / membership            | Pages + gate                                            | **Yes**                                                                     |
| Unread inbox count              | Product layout                                          | Own `cache` key                                                             |
| Open inbox items (≤25 + enrich) | Home, Plan, jar detail, Health                          | Own `cache` key — **not** shared with count                                 |
| `getPlanPulse`                  | Plan page + jar budgets; Home; Health; `listActiveJars` | **No** `cache` — Plan pays twice                                            |
| `getRealPosition`               | Home, Money, calendar, Health                           | **No** `cache` — one per request unless calendar+something else in same RSC |
| `listAccounts` (history scan)   | Goals hydration, loan/debt/savings pickers              | **Yes** `cache`                                                             |
| `listLoans`                     | Calendar + goals in same Plan request                   | **Yes** `cache`                                                             |
| `listDebts`                     | Money + Home adapters if same request; goals            | **Yes** `cache`                                                             |
| Households `base_currency`      | Many queries independently                              | Repeated; cheap PK lookup                                                   |

Layout vs Home inbox is **intentional different projections** (unread count vs items). The waste is Home using the heavy list for a count and a boolean.

## 11. Caching

| Mechanism                                                     | Present?                                                                                                                                                                                                       |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cache()` from `react`                                        | Yes — session, membership, gate, inbox list/page/counts, `listAccounts`, `listDebts`, `listLoans`/`listLoanSummaries`, `listSavings`, savings home summary, provider packages, investment home/portfolio/count |
| `unstable_cache` / `revalidateTag` / `cacheTag` / `cacheLife` | **None**                                                                                                                                                                                                       |
| Next `fetch` cache options                                    | Unused for product data (only market HTTP helper)                                                                                                                                                              |
| Module-level mutable request cache                            | Not used for user data (correct)                                                                                                                                                                               |

**Missing `cache()` (highest leverage, request-local, financial-safe if reads stay pure):**

- `getPlanPulse`
- `getRealPosition`
- `getHomeDashboard` / `getHealthDetail` (optional; would collapse inner duplicates if pages composed them)
- `getHouseholdCalendar` (optional)
- `listCreditCards`
- `listRecurring`

**Do not** put `getCurrentJarBudgets` behind cross-request `unstable_cache` while it **INSERT**s snapshots. Request-local `cache()` on `getPlanPulse` is the safe first step.

Cross-request caching of balances/pulse requires tag invalidation on every posting RPC. Financial correctness outranks that until invalidation is complete.

## 12. Revalidation

Central helper: `app/mutation-revalidation.ts`. Uses `APP_ROUTE` filesystem patterns with `revalidatePath(route, "page")`.

| Helper                       | Breadth                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `revalidateTransactionViews` | HOME, MONEY tree, PLAN, INBOX                                   |
| `revalidateInvestmentViews`  | HOME, MONEY tree, PLAN + goals                                  |
| `revalidateSavingsViews`     | HOME, MONEY, accounts, txs, savings                             |
| `revalidateJarViews`         | HOME, PLAN jars, INBOX — **only `reallocateJarCapacityAction`** |
| `revalidateGoalViews`        | PLAN + goals only (narrow, good)                                |
| `revalidateInboxViews`       | HOME, INBOX                                                     |

Cookie-backed Server Components are typically dynamic, so this is mainly **client Router Cache** invalidation. A single capture still invalidates Plan (the heaviest hub). That is coherent (jars spend from txs) but expensive.

**Freshness gaps:** `createJar` / `renameJar` / `setJarState` / `upsertJarPlan` / `updateJarConfiguration` do not call `revalidateJarViews`. `updateTransactionAction` / `deleteTransactionAction` were reported without revalidate in the mutation survey — confirm before changing; do not assume Data Cache serves stale money.

Recommend `revalidateTag` only after introducing tagged `unstable_cache`. Until then, keep path revalidation but stop invalidating PLAN on mutations that cannot change intention (e.g. tag-only already scoped).

## 13. Client / Bundle Performance

- **125** `"use client"` files under `app/` + `providers/`.
- `QueryProvider` wraps the whole tree (`providers/app-provider.tsx`) with `@tanstack/react-query` **and no hooks**. Dead weight on every page.
- Large client leaves are route-local forms (investment 1406 LOC, savings wizard 1367, capture 817). They should not load on Home if not imported there.
- `recharts` is confined to Home cash-flow (`home-cash-flow-chart.tsx`).
- `motion` is used via `shared/motion` (constitution-compliant).

EQ-22 recommendation: remove `QueryClientProvider`, `providers/query-provider.tsx`, and the `@tanstack/react-query` dependency **after** a grep-confirmed no-hook CI check. Do not remove in this audit.

No TTFB/hydration bytes were measured.

## 14. Payload Efficiency

| Screen               | Fetches                                                                                         | Renders                            | Recommendation                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| Plan hub             | Full calendar (3 months, all domains), full goal funding graph, all jar budgets, 25 inbox items | 3 events, 3 goals, few jars, flags | Upcoming-events query; goal preview (name/progress/legacy); pulse+budgets only |
| Home                 | 25 enriched inbox items                                                                         | count + unmapped boolean + CTA     | `countOpenInboxItems` + existence query for unmapped                           |
| Money                | Full card billing months; full debts                                                            | Outstanding + due + utilization    | Latest billing month / stored card fields; debt summary query like loans       |
| Goals list/hub       | Five product catalogs                                                                           | Progress numbers                   | `deriveGoalFundingSummary` from targeted ids, not `list*`                      |
| Investment detail    | Entire `loadHoldings()`                                                                         | One holding                        | `eq("id", holdingId)` + that holding’s lots/valuations                         |
| Savings detail       | Cycles twice                                                                                    | One timeline                       | One cycle query                                                                |
| Loan list (calendar) | 3N aggregates                                                                                   | Due dates / remaining              | One SQL/RPC for all loans                                                      |

Avoid micro-projections for Together/Health recent-8; those are already small.

## 15. Scale Analysis

Scenarios are **shape-based**. Linked DB is smaller than “small household”.

| Query                                            | Small (500 txs)                | Medium (10k txs)                      | Large (100k+ txs)                                       |
| ------------------------------------------------ | ------------------------------ | ------------------------------------- | ------------------------------------------------------- |
| `getRealPosition` / `listAccounts`               | Linear, likely OK              | Linear payload; likely user-visible   | **Breaks** (timeout and/or silent cap)                  |
| Period jar txs (1 month)                         | Bounded                        | Grows with month volume, not lifetime | Bounded if month stays thousands                        |
| Home date-range txs                              | Month/quarter bounded          | Quarter can be large                  | Needs pagination/aggregates for charts                  |
| Calendar `listLoans`                             | 3N; 5 loans ≈ 15 extra queries | Same N+1; RTT-bound                   | **Super-linear wall time** with N                       |
| Upcoming schedule                                | All future rows                | Grows with remaining tenor × loans    | Unbounded                                               |
| `listGoals` hydration                            | 0 links = cheap (current DB)   | Any links load full catalogs          | Worst Plan path                                         |
| Savings home summary                             | 30 savings OK                  | 50 products + cycles OK               | Prefer “current cycle” SQL                              |
| Investment hub RPC                               | 21 holdings OK                 | Fine                                  | Watch ops `GROUP BY household`                          |
| Investment detail `loadHoldings`                 | 21 × all valuations            | Linear in history of **all** holdings | **Detail should not scale with portfolio history**      |
| Inbox open                                       | Capped 25                      | Capped                                | Count queries stay O(1) with indexes                    |
| RLS `is_household_member` uses bare `auth.uid()` | Hidden at tiny seq scans       | InitPlan per row can add up           | Wrap `(select auth.uid())` before large seq/index scans |

Growth class:

- **Bounded:** inbox pages, loan **summaries**, investment **home** RPC, period jar math (per month).
- **Linear in lifetime txs:** real position, listAccounts, getAccount.
- **Linear in N loans × 3:** listLoans.
- **Fan-out / super-linear wall clock:** Plan hub composing calendar + goals + jar budgets.

## 16. Findings

### PERF-01

```text
ID: PERF-01
Area: Plan hub
Severity: P1
Evidence: plan/page.tsx Promise.all; get-household-calendar.ts; list-goals.ts mapFundingLinks; get-current-jar-budgets.ts sequential awaits
Current behavior: One Plan request starts pulse, jar budgets (which re-fetches pulse and may INSERT), 25 inbox items, full goals+funding catalogs, and a 3-month multi-domain calendar, then paints a short preview.
Performance impact: Wall clock ≈ slowest of (jar-budget waterfall, calendar+listLoans, goal hydration). Round-trips dominate over SQL ms.
Correctness risk: Low for math; Home/Plan inbox limit-25 can hide items (see PERF-08).
Root cause: Hub orchestrates detail-level read models.
Recommended fix: Dedicated Plan hub read model: pulse + current-period budgets + lightweight goals + 7-day upcoming events. Keep getHouseholdCalendar for /plan/calendar.
Expected improvement: Large drop in Plan TTFB once loans/funding exist; even today removes duplicate pulse and calendar over-fetch.
Risk: Must preserve exception/recommendation inputs (budget states, uncategorized count, legacy goals).
Files/modules: app/[locale]/(product)/plan/page.tsx; modules/plan/application/queries/*
Focused tests: Plan hub unit/integration; plan-pulse.test.ts; calendar projection tests
```

### PERF-02

```text
ID: PERF-02
Area: Jar budgets / Plan
Severity: P1
Evidence: get-current-jar-budgets.ts ensureSnapshots insert; unique jar_period_rule_snapshots_plan05_unique; insert result unchecked; loadPeriodTransactions called twice sequentially
Current behavior: GET ensures current-period snapshots, computing rollover from previous month txs. Concurrent first-of-period requests: one insert wins, the other unique-fails; failure ignored; loser keeps in-memory values that can differ from the stored snapshot until next GET.
Performance impact: Extra writes on the read path; long sequential chain (~10 waves).
Correctness risk: Medium — race on first visit of a period; silent insert failure.
Root cause: Snapshot freeze implemented as “ensure on read” instead of period-open command.
Recommended fix: READ = pure read of snapshots+txs. Create snapshots in ritual/period-open or INSERT ... ON CONFLICT DO NOTHING from a command, not from GET. Parallelize independent loads (current txs, previous txs, recurring, snapshots, adjustments).
Expected improvement: Shorter Plan TTFB; no write amplification; stable snapshot winner.
Risk: First day of month must still create snapshots exactly once — move carefully; keep PLAN-05 uniqueness.
Files: modules/plan/application/queries/get-current-jar-budgets.ts
Focused tests: jar budget / rollover tests; concurrent insert uniqueness
```

### PERF-03

```text
ID: PERF-03
Area: Plan pulse
Severity: P1
Evidence: plan/page.tsx:264 and get-current-jar-budgets.ts:354; get-plan-pulse.ts has no cache(); listActiveJars re-calls getPlanPulse
Current behavior: Plan request: getPlanPulse + getCurrentJarBudgets → getPlanPulse again. Two households+jars queries. Gate is shared.
Performance impact: Duplicate PostgREST embed of jars/jar_plans every Plan view.
Correctness risk: None if cached per request.
Root cause: No React.cache; composition calls pulse internally.
Recommended fix: cache(getPlanPulse). Optionally pass pulse into getJarBudgetsForPeriod to make the graph explicit.
Expected improvement: ~1 round-trip wave removed on Plan (and jar pages using listActiveJars still collapse).
Risk: Negligible.
Files: modules/plan/application/queries/get-plan-pulse.ts
Focused tests: tests/unit/plan-pulse.test.ts
```

### PERF-04

```text
ID: PERF-04
Area: Ledger real position
Severity: P1 (P0 if PostgREST max_rows truncates)
Evidence: get-real-position.ts unbounded select; list-accounts.ts same; EXPLAIN seq scan 20 rows / 0.184 ms; no .limit/.range
Current behavior: Opening balances ± every balance-status transaction downloaded to Node.
Performance impact: Linear in lifetime txs on Home, Money, Calendar, Health, account pickers.
Correctness risk: Silent incomplete sums if API max_rows < history length.
Root cause: Balance is a client reduction of the ledger, not a database aggregate.
Recommended fix: (1) cache(getRealPosition). (2) SQL/RPC GROUP BY account_id with the same credit/debit rules. (3) Verify max_rows. Defer materialized balances.
Expected improvement: Constant-size payload; preserves BR-01 if SQL matches applyTransactionDeltas.
Risk: High if SQL diverges — must lock with ledger-accounts tests.
Files: modules/ledger/application/queries/get-real-position.ts, list-accounts.ts, transaction-types.ts
Focused tests: tests/unit/ledger-accounts.test.ts
```

### PERF-05

```text
ID: PERF-05
Area: Loans / Calendar / Goals
Severity: P1
Evidence: list-money-products.ts loadLoans maps loanAggregates (3 queries/loan); getHouseholdCalendar always listLoans; listLoanSummaries already exists for hubs
Current behavior: Full loan list pays 1 + 1 + 3N queries. Calendar needs due projection, not payment history sums.
Performance impact: Dominant calendar cost as soon as N > 0. Current DB has 0 loans so not visible now.
Correctness risk: Low.
Root cause: List endpoint reused as calendar/goal hydration dependency.
Recommended fix: One SQL for all loans’ payment sums + upcoming counts + next due; or reuse stored remaining_principal/next_payment_date on calendar like listLoanSummaries.
Expected improvement: 3N+2 → 1–2 queries.
Risk: Aggregates must match mapLoanRow.
Files: modules/ledger/application/queries/list-money-products.ts; get-household-calendar.ts
Focused tests: loan list/calendar tests
```

### PERF-06

```text
ID: PERF-06
Area: Goals / Plan hub
Severity: P1
Evidence: list-goals.ts mapFundingLinks loads five full list* APIs whenever linkRows.length > 0; Plan hub still listGoals() for 3 cards. Current DB: 0 links so this path is idle.
Current behavior: One active funding link hydrates all savings, all liquid txs, all holdings+activities, all loans×aggregates, all debts.
Performance impact: Worst Plan/Goals payload.
Correctness risk: Low.
Root cause: Funding current-value resolved via product catalogs instead of by source id.
Recommended fix: Fetch only referenced source ids (or a funding-value RPC). Keep full hydration on goal detail if needed.
Expected improvement: Plan hub stays cheap when goals exist.
Risk: Availability/missing-source flags must remain.
Files: modules/plan/application/queries/list-goals.ts
Focused tests: goal funding unit tests
```

### PERF-07

```text
ID: PERF-07
Area: Investments
Severity: P1
Evidence: getInvestmentHoldingResult → loadHoldings() then find(id); loadHoldings selects all valuations and lots; not cached. Hub already uses listInvestmentHomeSummary + RPC.
Current behavior: Detail of one holding downloads the household portfolio history.
Performance impact: Linear in portfolio valuation history, not in one holding.
Correctness risk: Low.
Root cause: Detail reuses list hydration.
Recommended fix: Query holding by id; valuations/lots/operations eq holding_id (activities already can filter).
Expected improvement: Detail TTFB independent of other holdings.
Risk: Low if row mapping stays shared.
Files: modules/investments/application/queries/investment-queries.ts; investments/[id]/page.tsx
Focused tests: investment query tests
```

### PERF-08

```text
ID: PERF-08
Area: Inbox duplicate + capped counts
Severity: P1 (correctness at >25 open items) / P2 (extra count query)
Evidence: layout countUnreadOpenInboxItems; Home/Health openInboxCount = listOpenInboxItems().length; INBOX_OPEN_PAGE_SIZE = 25; countOpenInboxItems unused on Home
Current behavior: Chrome badge is an exact unread count. Home/Health “open” count is min(open, 25). Unmapped flag only searches those 25.
Performance impact: Extra inbox query per product page (layout) plus enrich on hubs.
Correctness risk: Dashboard under-count / missed unmapped beyond page 1.
Root cause: Reuse of the review list as a metrics API.
Recommended fix: Home/Health use countOpenInboxItems + existence query for UNMAPPED_EXPENSE. Keep listOpenInboxItems for Plan emergency banner (needs items).
Expected improvement: Smaller Home payload; correct counts.
Risk: Banner/CTA must still see emergency items — Plan may keep the list.
Files: get-home-dashboard.ts; get-health-detail.ts; review-items.ts
Focused tests: inbox query-shape / home dashboard tests
```

### PERF-09

```text
ID: PERF-09
Area: Savings detail
Severity: P2
Evidence: savings/[id]/page.tsx Promise.all getSaving + listSavingCycles; getSaving already loads all cycles. getSavingsHomeSummary is lean (Money/Home).
Current behavior: Duplicate cycle selects on detail. listSavings still unbounded for list/goal paths.
Performance impact: Extra query per detail view; 30 savings on linked DB is fine.
Correctness risk: None.
Root cause: Page composes two APIs that overlap.
Recommended fix: Detail uses getSaving only, or listSavingCycles only. Keep home summary as-is.
Expected improvement: One less round-trip.
Risk: Low.
Files: app/.../savings/[id]/page.tsx; list-savings.ts
Focused tests: savings detail tests
```

### PERF-10

```text
ID: PERF-10
Area: Indexes / RLS
Severity: P2
Evidence: Advisor unindexed accounts.household_id; is_household_member uses auth.uid() not (select auth.uid()); EXPLAIN seq scan accounts
Current behavior: Tiny tables seq-scan. At scale, accounts-by-household and RLS initplan matter.
Performance impact: Future; not today’s ms.
Correctness risk: None.
Root cause: Baseline omitted household index on accounts; helpers predates (select auth.uid()) guidance.
Recommended fix: Add accounts (household_id, is_archived, type). Wrap auth.uid() in membership helpers. Add loan_schedule (loan_id, status, sequence) only with listLoans rewrite EXPLAIN.
Expected improvement: Index use once tables leave seq-scan territory.
Risk: Write overhead on accounts; keep indexes few.
Files: supabase migrations (future); baseline functions
Focused tests: none until migration; EXPLAIN on staging
```

### PERF-11

```text
ID: PERF-11
Area: Revalidation
Severity: P2
Evidence: mutation-revalidation.ts TRANSACTION_ROUTES includes PLAN; jars/actions.ts revalidate only on reallocate
Current behavior: Capture invalidates Plan tree. Jar create/rename/plan may not invalidate Plan router cache.
Performance impact: Extra Plan refetch after every transaction.
Correctness risk: Stale Plan chrome after jar mutations if router cache holds.
Root cause: Coarse helpers; incomplete jar wiring.
Recommended fix: Call revalidateJarViews on jar commands. After pulse/position caching, consider not revalidating PLAN for tag-only edits (already scoped).
Expected improvement: Correcter jar UX; fewer needless Plan refetches later via tags.
Risk: Do not drop PLAN from transaction revalidation until jar spend is proven independent (it is not).
Files: app/mutation-revalidation.ts; plan/jars/actions.ts
Focused tests: action revalidation unit if present
```

### PERF-12

```text
ID: PERF-12
Area: Client bundle
Severity: P3
Evidence: no useQuery/useMutation in repo; QueryProvider always mounted; package.json @tanstack/react-query
Current behavior: React Query ships unused.
Performance impact: Small but global.
Correctness risk: None.
Root cause: Scaffold leftover.
Recommended fix: Remove provider + dependency after CI grep.
Expected improvement: Slightly smaller hydration.
Risk: Very low.
Files: providers/query-provider.tsx; providers/app-provider.tsx; package.json
Focused tests: grep in CI
```

## 17. Prioritized Performance Backlog

| Priority | IDs                                                                  | Why this order                                                          |
| -------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1        | PERF-03, cache `getRealPosition`                                     | Request-local, tiny, no SQL change; unblocks measuring Plan/Home fairly |
| 2        | PERF-02 read/write split + parallelize jar-budget loads              | Plan hub’s sequential core even with 0 loans                            |
| 3        | PERF-04 SQL aggregate for position                                   | Scale + correctness cliff                                               |
| 4        | PERF-01 Plan hub dedicated read; PERF-05/06 only if still on the hub | Stop loading calendar/goals catalogs for previews                       |
| 5        | PERF-08 inbox counts                                                 | Correctness at 25+ items                                                |
| 6        | PERF-07 investment detail by id                                      | Independent of Plan                                                     |
| 7        | PERF-09, PERF-10, PERF-11                                            | Smaller / later                                                         |
| 8        | PERF-12 React Query removal                                          | Cleanup                                                                 |

Do not optimize from advisor unused-index lists at 20 transactions.

## 18. Recommended Remediation Sequence

```text
measure current Plan/Home TTFB on a 10k-tx staging fixture
  → cache getPlanPulse + getRealPosition (PERF-03 / part of PERF-04)
  → measure again
  → make getCurrentJarBudgets a pure read; move snapshot ensure off GET; parallelize loads (PERF-02)
  → measure again
  → RPC/SQL account balances (PERF-04)
  → prove with ledger-accounts tests
  → slim Plan hub queries (PERF-01, PERF-05, PERF-06)
  → inbox counts (PERF-08)
  → investment/savings detail (PERF-07, PERF-09)
  → accounts household index + auth.uid wrap (PERF-10)
  → revalidation tidy (PERF-11)
  → remove React Query (PERF-12)
  → full suite only at the release gate
```

No materialized position table in this sequence unless the aggregate RPC is still slow on a **measured** 100k-tx fixture.

## 19. Risks

- **Financial correctness** if balance SQL disagrees with `applyTransactionDeltas` (credit/debit sets, reversal statuses).
- **Period snapshot races** if GET keeps inserting.
- **PostgREST max_rows** undiagnosed — verify in project API settings.
- **False confidence** from 0.1 ms EXPLAIN on 20-row tables.
- **Advisor unused indexes** must not drive drops; stats are cold.
- **Broad revalidatePath** vs missing jar revalidate — both are real; do not “optimize” freshness away.
- B01–B16, RLS, Health read-only, five-tab IA, and Design SoT were not changed.

## 20. Focused Verification

Ran (no full suite):

```text
npx vitest run \
  tests/unit/plan-pulse.test.ts \
  tests/unit/ledger-accounts.test.ts \
  tests/unit/money-summary-query-shape.test.ts \
  tests/unit/home-product-summary-query-shape.test.ts \
  tests/unit/transaction-pagination-query-shape.test.ts \
  tests/unit/get-health-detail.integration.test.ts
```

Result: **33 passed, 1 failed** (pre-existing, unrelated to this audit).

`tests/unit/transaction-pagination-query-shape.test.ts` expects `data-testid="loan-payment-breakdown"` on the transaction detail page. The page still renders `detailPage.loanBreakdown.*` facts; the testid is missing. Not a query-shape regression from this work. Do not “fix” it in a performance audit.

Not run: full `npm test`, e2e, lint/typecheck (no code changes).

No browser TTFB. No product behavior changed.

## 21. Gate Verdict

### NOT READY FOR NEXT QUALITY GATE

This is **not** a claim that the app is slow for the three households on `family-finances-2`. SQL there is fast. The gate fails because:

1. Realistic medium/large household shapes are **structurally unbounded** on the money-truth path (`getRealPosition` / `listAccounts`).
2. Plan hub composes detail read models (calendar, goal catalogs, sequential jar-budget ensure-write) for a preview UI.
3. There is **no measured TTFB** and **no medium-volume fixture**, so production scale cannot be certified.
4. P1 items PERF-01–PERF-08 should be reduced with the smallest safe fixes in section 18 before a production-operations / GA gate.

Next engineering gate should be **implement PERF-03 → PERF-02 → PERF-04 on a 10k-transaction staging dataset, then re-measure**, not another architecture or visual audit.

# Phase 1 Remediation

| Field        | Value                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------- |
| Date         | 8 Sep 2026                                                                                         |
| Scope        | PERF-03, PERF-02, Plan-hub slimming (PERF-01 / hub slice of PERF-05–06); request-local cache only  |
| Not in scope | SQL balance aggregation (PERF-04), materialized balances, speculative FK indexes, Plan UI redesign |

## Implemented

- **getPlanPulse request caching** — `loadPlanPulse` wrapped in React `cache()`. Same request (Plan page + `getCurrentJarBudgets`) shares one households+jars read. Not `unstable_cache`. Household still comes from `assertMoneyActionAllowed` on that request.
- **getRealPosition request caching** — `loadRealPosition` wrapped in React `cache()`. Calculation unchanged (opening balances ± `applyTransactionDeltas` over all balance-status rows). No arguments; one gated household per request, so account/household/user scope cannot be shared across sessions. Plan hub no longer calls it.
- **jar GET made pure** — `getCurrentJarBudgets` / `getJarBudgetsForPeriod` perform no `.insert` / `.upsert`. Missing **current-period** snapshots are computed in memory with the same rollover/income formula. Persistence moved to `ensureJarPeriodRuleSnapshots` (`upsert` + `ignoreDuplicates` on `jar_id,period_month`; unique `23505` treated as success; other errors logged and returned `UNKNOWN`). Hooked on `createJar` / `updateJarConfiguration`, `upsertJarPlan`, `setJarState`, `previewMonthRitual`, `approveMonthRitual`. Independent jar-budget loads run in `Promise.all` after pulse+settings. Period txs and `loan_payments` load in parallel.
- **Plan hub slimmed** — page `Promise.all` is translations, `getPlanPulse`, `getCurrentJarBudgets`, `listOpenInboxItems`, `listGoals`, `listPlanHubUpcomingEvents`. No `getHouseholdCalendar`. Upcoming is a 7-day preview (`PLAN_HUB_UPCOMING_DAYS` / `PLAN_HUB_UPCOMING_EVENT_LIMIT`) without cash-flow forecast, payoff-inbox scan, or `listLoans` N+1. Goal funding hydrates savings/holdings catalogs only when those link kinds exist; accounts/loans/debts load by id.

## Before / After

TTFB, RSC duration, and 10k-transaction wall clock: **Not measured**.

Docker daemon was down. `NEXT_PUBLIC_SUPABASE_URL` points at hosted `bbzffxvgocjwsdbujvgn.supabase.co`. `scripts/perf-10k-transaction-fixture.mjs` refused to seed that host. No local 10k dataset was created.

Source-level request shape (Plan hub, one authenticated RSC render):

| Area                                 |                                     Before |                                          After | Change                                 |
| ------------------------------------ | -----------------------------------------: | ---------------------------------------------: | -------------------------------------- |
| Plan query count                     |                          Not measured TTFB |                              Not measured TTFB | Not measured                           |
| Plan duplicate pulse                 |                               2 executions |                          1 execution (`cache`) | Duplicate households+jars read removed |
| `getPlanPulse` executions/request    |                                  2 on Plan |                                      1 on Plan | Deduplicated                           |
| `getRealPosition` executions/request |  1 on Plan (via calendar) + other surfaces | 0 on Plan; ≤1 per request on Home/Money/Health | Plan no longer scans balance history   |
| Jar GET writes                       | INSERT missing `jar_period_rule_snapshots` |                                              0 | Read path is side-effect free          |
| Plan DB work                         |                               Not measured |                                   Not measured | Not measured                           |

## Query Count Changes

Verified from current source, not from production traces.

**Plan hub orchestration:** still one top-level `Promise.all` after session/membership. Calendar graph removed; upcoming preview added.

**Jar budgets:** sequential wave of settings → pulse → current txs → loan_payments → recurring → snapshots → previous txs → previous adjustments → INSERT → current adjustments **replaced** by settings+pulse in parallel, then six independent reads in `Promise.all` (current txs+loan_payments, previous txs+loan_payments, recurring, snapshots, previous adjustments, current adjustments). No GET write.

**Goals:** `listLoans` / `listAccounts` / `listDebts` / full portfolio no longer run unless matching funding-link kinds exist. Linked liquid accounts still scan that account’s balance-status transactions (same formula, narrower id set).

**Upcoming:** `listRecurring` + `listCreditCards` + one active-loans select + `listLiabilities` + remaining upcoming schedule from today. Still no date window on card billing months (`listCreditCards` unchanged). Remaining loan schedule is not a 7-day slice so payoff-milestone detection matches `projectLoanEvents`.

## Database Work Changes

- Removed GET-side snapshot INSERT (write amplification and ignored unique failures on read).
- Removed Plan-hub `getRealPosition` history download and `listLoans` 3N aggregates.
- Removed 3-month calendar projection, cash-flow forecast, and pending EMI_COMPLETE inbox scan from the hub.
- Left unbounded position scans on Home/Money/Health (now request-deduplicated only).
- No new indexes. No materialized balance table. No balance RPC.

## Correctness Verification

- Jar GET unit test: no INSERT/UPSERT; 15M fixed budget still returned from live plan + in-memory current-period snapshot.
- Snapshot command: unique violation is success; non-unique insert logs and returns `UNKNOWN`.
- Write-path owners call `ensureJarPeriodRuleSnapshots()`; GET does not.
- Request-cache tests: same-request dedupe; next request / other household not reused; no `unstable_cache`.
- `ledger-accounts` / `plan-jar-budget` / `plan-goal-funding` / calendar projection tests unchanged in intent.
- Typecheck passed. Targeted ESLint on the Phase 1 touch set passed.
- Focused Vitest: 17 files, 141 tests passed.
- Browser: `/en/plan` on local `next dev` (port 3000) showed the existing Plan loading skeleton in the 440px shell, then redirected to login. Authenticated EN/VI and interaction were **not** verified (no session). UI markup/sections were not redesigned.

Accepted snapshot tradeoff: a household that never mutates jars/plan/ritual in a month will not persist frozen snapshots. Current-period GET still shows in-memory values. Historical review of a never-written month may lack rows (previously the first GET froze them). Parent mutations still succeed if snapshot persist returns `UNKNOWN` (failure is logged).

## Focused Tests

- `tests/unit/request-local-query-cache.test.ts`
- `tests/unit/jar-budget-get-pure-read.test.ts`
- `tests/unit/ensure-jar-period-snapshots.test.ts`
- `tests/unit/plan-hub-query-shape.test.ts`
- `tests/unit/plan-pulse.test.ts`
- `tests/unit/plan-jar-budget.test.ts`
- `tests/unit/plan-migration-hardening.test.ts`
- `tests/unit/month-ritual-commands.test.ts`
- `tests/unit/plan-month-ritual.test.ts`
- `tests/unit/plan-jar-configuration.test.ts`
- `tests/unit/ledger-accounts.test.ts`
- `tests/unit/plan-goals-recurring.test.ts`
- `tests/unit/plan-goal-funding.test.ts`
- `tests/unit/plan-calendar.test.ts`
- `tests/unit/plan-hub-progressive-disclosure.test.tsx`
- `tests/unit/plan-hub-loading-parity.test.tsx`
- `tests/unit/plan-home-health.test.ts`

## Remaining Findings

Unresolved from the original audit (not Phase 1):

- **PERF-04** — **Addressed in Phase 2.** `getRealPosition` / `listAccounts` / `getAccount` now call `get_account_ledger_balances`. Hosted PostgREST `max_rows` was measured at 1000.
- **PERF-05** — `/plan/calendar` still uses `getHouseholdCalendar` → `listLoans` N+1 and `getRealPosition`.
- **PERF-06** — `listSavings()` / `listInvestmentPortfolio()` still hydrate full catalogs when those funding kinds exist.
- **PERF-07** — investment detail still uses portfolio-wide hydration.
- **PERF-08** — Home/Health open-inbox count capped at 25; extra chrome unread query.
- **PERF-09** — savings detail over-fetch.
- **PERF-10** — accounts household index / `auth.uid` wrap (advisor).
- **PERF-11** — broad money/investment `revalidatePath`.
- **PERF-12** — unused React Query provider.
- **102 unindexed FKs** — not indexed in this phase.
- **View-only snapshot gap** — GET no longer freezes the period.
- **Parent mutations ignore snapshot `UNKNOWN`** — jar/ritual success does not fail closed on snapshot persist.
- **Hub upcoming still loads remaining loan schedule from today** (needed for payoff flags) and unbounded `listCreditCards`.
- **No Next.js TTFB** — still not measured as RSC render time. 10k re-measure is in Phase 2.

## Phase 1 verdict

### PHASE 1 PASS

The four requested changes are in source, authorization and formulas were not redesigned, focused tests and typecheck passed, and Plan hub/jar GET round-trips are structurally smaller.

This is **not** production-ready. PERF-04 is measured and adopted in Phase 2. Remaining P1 items (calendar N+1, inbox counts, investment/savings detail) are still open.

# Phase 2 — Balance Performance

| Field        | Value                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| Date         | 8 Sep 2026                                                                                                          |
| Scope        | 10k transaction benchmark of `getRealPosition()`; SQL aggregation prototype; production RPC if evidence required it |
| Not in scope | Materialized balances, speculative indexes, Calendar UI, Plan UI, financial-formula changes                         |

## 1. Benchmark Environment

| Item                         | Result                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Preferred local Supabase     | **Failed.** Docker started. `supabase start` applied migrations until `20260906074729_correct_ena_opening_position.sql`, which raises on an empty local dataset.                                                               |
| Hosted development project   | `family-finances-2` (`bbzffxvgocjwsdbujvgn`, `ap-southeast-2`)                                                                                                                                                                 |
| Production project           | `family-finances` (`pcvckvfgfnvqahtuuadl`) is INACTIVE; not used                                                                                                                                                               |
| Why Phase 1 fixture refused  | `scripts/perf-10k-transaction-fixture.mjs` allowed only localhost. `.env.local` points at `bbzffxvgocjwsdbujvgn.supabase.co`.                                                                                                  |
| Safety for hosted seed       | Explicit `VINHA_PERF_ALLOW_HOSTED=1` + `VINHA_PERF_ALLOWED_HOST` exact hostname match. Dedicated household `VINHA_PERF_BENCHMARK_DO_NOT_USE` only. Never attach to an existing household. Cleanup deletes that household only. |
| Product households untouched | After cleanup: `Nhà kiểm thử`, `Test family`, `Chúm ta` remain. Benchmark household removed.                                                                                                                                   |
| Measurement client           | Node script + MCP `execute_sql` from this machine to ap-southeast-2. **Not** Vercel TTFB.                                                                                                                                      |

`pgrst.db_max_rows` is not exposed in `pg_settings` (`null`). Behavior was measured: PostgREST returned **1000** rows for a 9600-row liquid query.

## 2. Dataset

Dedicated household, 9 accounts (6 liquid + credit card + savings_product + archived cash), 10,000 transactions.

Shape (deterministic modulo, domain-valid):

- Types: ~70% expense, ~15% income, transfers with `transfer_group_id`, investment/liability/debt kinds
- Statuses: 85% posted, remainder `pending_mapping` / refunded / reversed (all are `TRANSACTION_BALANCE_STATUS_VALUES`)
- Dates: 2024-01-01 + (i % 730)
- Amounts: integer VND within `Number.MAX_SAFE_INTEGER`
- Credit-card and archived-account rows exist and are excluded from real position

1k measurement used the first 1,000 rows, then the same household was filled to 10,000. 50k was not run.

Fixture: `scripts/perf-10k-transaction-fixture.mjs` (`setup` / `status` / `cleanup`).

## 3. Baseline

Before replacing production code, the current path was:

```text
accounts (liquid, not archived)
    ↓
PostgREST SELECT account_id, type, amount
    WHERE household + account_id IN + status IN  (no limit)
    ↓
Node applyTransactionDeltas (CREDIT +, DEBIT −)
    ↓
real position
```

Callers of `getRealPosition()`: Home dashboard, Money page, Health detail, `/plan/calendar` (`getHouseholdCalendar`). Plan hub no longer calls it (Phase 1). Request-local `cache()` remains.

## 4. Current `getRealPosition()` Execution

Measured with `scripts/perf-balance-benchmark.mjs` against the hosted API (service role, benchmark household only). 11 repeats after warmup. Times include this-machine RTT to ap-southeast-2 (~280 ms per HTTP call).

| Scale | Liquid rows in DB | Rows PostgREST returned | Payload | Accounts HTTP median | Tx HTTP median | Node process median | Total median |
| ----- | ----------------: | ----------------------: | ------: | -------------------: | -------------: | ------------------: | -----------: |
| 1k    |               960 |                     960 |   85 KB |               277 ms |         290 ms |             0.34 ms |       571 ms |
| 10k   |              9600 |                **1000** |   88 KB |               286 ms |         288 ms |             0.31 ms |       586 ms |

Heap ~13–16 MB; not a useful signal at this size.

Node aggregation is cheap. Wall clock is two sequential HTTP round-trips. At 10k, PostgREST **truncated** the transaction query to 1000 rows, so the 10k HTTP times are not a full-payload measurement.

## 5. EXPLAIN ANALYZE

Current row-fetch (household + account_id IN + status IN):

| Scale | Plan     | Actual rows | Execution | Planning | Buffers (hit/read) | Filter removed |
| ----- | -------- | ----------: | --------: | -------: | -----------------: | -------------: |
| 1k    | Seq Scan |         960 |  0.518 ms | 1.112 ms |             22 / 0 |             63 |
| 10k   | Seq Scan |        9600 |  4.078 ms |   1.1 ms |            206 / 0 |            423 |

SQL aggregate (`GROUP BY account_id`, same CREDIT/DEBIT/status lists):

| Scale | Plan                         | Rows out | Execution | Planning | Index used                         | Buffers |
| ----- | ---------------------------- | -------: | --------: | -------: | ---------------------------------- | ------: |
| 1k    | Nested Loop + HashAggregate  |        6 |  1.193 ms | 1.319 ms | `idx_transactions_account_created` |  87 / 0 |
| 10k   | Nested Loop + GroupAggregate |        6 |  8.794 ms | 2.598 ms | `idx_transactions_account_created` | 816 / 0 |

Database time is milliseconds, not hundreds of milliseconds. No seq-scan problem that an extra index would fix at 10k. **No index added.**

## 6. SQL Aggregation Prototype

Inline SQL (same formula as `applyTransactionDeltas`):

```text
balance = opening_balance
        + SUM(amount) for CREDIT types
        − SUM(amount) for DEBIT types
        over TRANSACTION_BALANCE_STATUS_VALUES
for non-archived liquid accounts in the household
```

A persistent prototype function was **not** left on the database. Production adopted `get_account_ledger_balances(p_account_ids uuid[])` after correctness and the `max_rows` cliff were proven.

## 7. Correctness Comparison

| Scale |                                                                Node (PostgREST path) | SQL aggregate                            | Match                   |
| ----- | -----------------------------------------------------------------------------------: | ---------------------------------------- | ----------------------- |
| 1k    | 2,156,080,000 total; 6 accounts including negative Cash/Checking and positive others | Identical per account and total          | **Exact**               |
| 10k   |                                                     2,154,220,000 from **1000** rows | 20,543,800,000 from **9600** liquid rows | **Differ — truncation** |

At 1k the formula matches, including negative balances, mixed types/statuses, and excluded card/archived rows.

At 10k the results differ because PostgREST returned 1000 of 9600 liquid rows, not because SQL used a different formula. That is a **BR-01 correctness failure**, not a rounding disagreement.

## 8. Benchmark Results

10k (mandatory):

| Metric             |         Current Node aggregation |                                           SQL aggregation | Difference                                          |
| ------------------ | -------------------------------: | --------------------------------------------------------: | --------------------------------------------------- |
| DB execution       |                         4.078 ms |                                                  8.794 ms | SQL slightly slower in Postgres                     |
| Rows transferred   |        1000 (capped; 9600 exist) |                                                         6 | ~1600× fewer rows if uncapped; today silently wrong |
| Node processing    |                          0.31 ms |                                           merge of 6 rows | Node CPU is not the cost                            |
| Total execution    | ~586 ms (2 HTTP RTTs, truncated) | 1 HTTP RTT + 6-row payload (not re-timed as user JWT RPC) | Payload/correctness win                             |
| Memory             |                      ~15 MB heap |                                      n/a (6 numeric rows) | Immaterial                                          |
| Result correctness |          **Wrong at >1000 rows** |                                   Matches 1k Node formula | SQL required for BR-01                              |

1k: both correct; DB < 2 ms; HTTP dominated by RTT.

50k: not run (optional). 10k already crosses the PostgREST cap.

## 9. Scaling Analysis

Observed DB execution, 1k → 10k liquid rows:

- Row fetch: 0.518 ms → 4.078 ms (~7.9× for 10× rows)
- SQL aggregate: 1.193 ms → 8.794 ms (~7.4×)

That is approximately linear in transaction count **inside Postgres**. It is **not** the user-visible cost. User-visible cost is PostgREST serialization + transfer of every balance-status row, and at 1000 rows the API **stops returning data**.

PostgREST wall clock 1k → 10k looked flat (~570–586 ms) because the 10k run never downloaded 9600 rows.

## 10. Decision

**OPTION B — Move aggregation into SQL/RPC.**

Not because Node `applyTransactionDeltas` is expensive (0.3 ms). Not because EXPLAIN is slow (4–9 ms). Because:

1. Hosted PostgREST caps at 1000 rows; `getRealPosition` has no pagination; balances become silently wrong above that.
2. The SQL formula matched Node exactly at 1k, including negatives and mixed statuses.
3. The RPC returns one row per requested account (bounded).
4. Implementation stays one security-invoker function behind the existing application API.

OPTION A is unsafe at 10k on this API. OPTION C is unnecessary: the 10k fixture ran on the linked development project with a dedicated household.

## 11. Implemented Changes

- Migration `supabase/migrations/20260908114845_get_account_ledger_balances.sql`
  - `get_account_ledger_balances(p_account_ids uuid[])`
  - `SECURITY INVOKER`, `search_path = public`
  - Household from `investment_active_household()` (requires `auth.uid()`)
  - Extra account IDs from other households are not returned
  - `REVOKE ALL FROM PUBLIC`; `GRANT EXECUTE TO authenticated` (anon: no)
- Applied to `family-finances-2`
- Application: `loadAccountLedgerBalances` used by `getRealPosition`, `listAccounts`, `getAccount`, and `list-goals` linked liquid accounts
- UI unchanged; no materialized table; no new index
- Fixture repaired for fail-closed hosted + local; benchmark script added
- Benchmark household cleaned up after measurement

Verified on hosted: `prosecdef = false`, `authenticated_execute = true`, `anon_execute = false`.

## 12. Remaining Performance Findings

- **PERF-05** — `/plan/calendar` still calls `getHouseholdCalendar` → `listLoans()`: 1 list query + **3N** (`loan_payments` unbounded, upcoming count, next schedule row) per loan, on **every** calendar request. `listLoans` is request-`cache()`’d, so calendar + other same-RSC callers share it, but N is not batched. Linked DB still has 0 loans, so this was not re-timed. Follow-up; Calendar UI not changed.
- **PERF-06** — Goal funding can still hydrate `listSavings()` / full investment catalog when those link kinds exist. Linked liquid accounts now use `get_account_ledger_balances` instead of downloading history.
- **PERF-07** — investment detail still uses portfolio-wide hydration.
- **PERF-08** — Home/Health open-inbox count capped at 25.
- **PERF-09** — savings detail over-fetch.
- **PERF-10** — unindexed `accounts.household_id`; `auth.uid()` wrap. Not indexed: 10k EXPLAIN did not show an accounts-by-household problem that needed a new btree.
- **PERF-11** — broad money/investment `revalidatePath`.
- **PERF-12** — unused React Query provider.
- **102 unindexed FKs** — still not indexed.
- **list-goals** — savings/investment catalog hydration when those funding kinds exist; liquid account balances now use the same RPC.
- **No Next.js TTFB** on Home/Money after the RPC.

## 13. Focused Tests

```text
npx vitest run \
  tests/unit/account-ledger-balance-rpc.test.ts \
  tests/unit/ledger-accounts.test.ts \
  tests/unit/request-local-query-cache.test.ts \
  tests/unit/ledger-capture.test.ts \
  tests/unit/ledger-transfer.test.ts \
  tests/unit/transaction-contracts.test.ts \
  tests/unit/transaction-policy-contracts.test.ts \
  tests/unit/plan-hub-query-shape.test.ts \
  tests/unit/plan-goal-funding.test.ts
```

**73 passed** (9 files). Typecheck passed. Targeted ESLint on the Phase 2 touch set passed.

React `cache()`: still wraps `loadRealPosition` with no arguments; same-request dedupe and cross-household isolation tests still pass. Account-scope sharing is not a `getRealPosition` parameter; RPC account IDs come from the gated household query.

## 14. Phase 2 Verdict

### PHASE 2 PASS — SQL AGGREGATION ADOPTED

This is **not** a production-readiness declaration. It is the Phase 2 gate: 10k evidence showed the current row-download path is incorrect under hosted PostgREST, SQL matched the existing formula at 1k, and the smallest safe production change is the invoker RPC behind the existing ledger queries.
