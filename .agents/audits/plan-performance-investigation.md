# Plan Performance Investigation

Date: 2026-09-11  
Scope: authenticated Plan hub (`/en/plan`) plus the Plan route/query surface  
Environment: Next.js 16.3.1 production build, local `next start` on port 3101, hosted Supabase project `family-finances-2` in `ap-southeast-2`  
Mode: diagnostic only; no production code, schema, configuration, Auth/RLS policy, or financial data changed  
Status: **COMPLETE**

## 1. Executive Summary

The representative authenticated Plan hub is a page-wide server render with a broad first data fan-out, an ID-dependent jar-budget wave, and a conditional sequential inbox-enrichment tail.

| Measure                                             |                                                    Result |
| --------------------------------------------------- | --------------------------------------------------------: |
| Plan content-complete median, 10 warm browser loads |                                                  1,607 ms |
| Plan content-complete range, same sample            |                                            1,120–1,667 ms |
| Browser document response-start median              |                                                    242 ms |
| Browser document response-start range               |                                                222–307 ms |
| Warm Supabase/Auth HTTP fetches per Plan hub load   |                                                        27 |
| Cold first-run extra                                | one JWKS request; 28 HTTP fetches in the first traced run |
| Dependency waves                                    |                   4, including the conditional inbox tail |
| PostgreSQL execution verdict                        |                 FAST; not a material wall-time bottleneck |

Primary bottleneck: the page waits for all Plan data before returning useful Plan content. The request graph is dominated by hosted Supabase request latency and dependency waves, not PostgreSQL execution. Most direct authenticated endpoint samples had a 190–220 ms median even when PostgreSQL execution was below 1 ms.

Recommended first implementation target, not implemented here: replace only the `getCurrentJarBudgets()` read boundary with one narrow authenticated, read-only jar-budget raw-input read model covering current/previous period inputs. Keep the existing TypeScript financial formulas, carry-forward logic, and RLS/tenancy checks unchanged.

## 2. Route Architecture

The Plan surface is under `app/[locale]/(product)/plan`.

| Route                           | Read responsibility                                                       |
| ------------------------------- | ------------------------------------------------------------------------- |
| `/[locale]/plan`                | Plan pulse, current jar budgets, inbox decisions, goals, upcoming preview |
| `/[locale]/plan/jars`           | Jar list, current budgets, categories                                     |
| `/[locale]/plan/jars/[id]`      | Jar detail, current budgets, policies, inbox, categories                  |
| `/[locale]/plan/goals`          | Goals and funding options                                                 |
| `/[locale]/plan/goals/[id]`     | Goal detail, linked funding, funding options, goal list                   |
| `/[locale]/plan/recurring`      | Recurring income/expense rules                                            |
| `/[locale]/plan/recurring/[id]` | Recurring-rule detail                                                     |
| `/[locale]/plan/calendar`       | Household calendar projection                                             |
| `/[locale]/plan/ritual`         | Monthly review, month-close state, historical review                      |

The parent authenticated product layout is [`app/[locale]/(product)/layout.tsx`](<../../app/[locale]/(product)/layout.tsx>). It calls `requireProductSession()` and renders the bottom navigation inside a Suspense boundary. The Plan hub is [`app/[locale]/(product)/plan/page.tsx`](<../../app/[locale]/(product)/plan/page.tsx>). There is no route-local `layout.tsx`, `error.tsx`, or route handler under the Plan tree. Form mutations are implemented as route-local Server Actions in the goals, jars, recurring, and ritual folders; none was called by this GET path.

Route graph for the measured hub:

```text
browser navigation: /en/plan
  -> locale middleware/proxy and verified Supabase claims
  -> product layout: requireProductSession()
       -> getSessionUser()              -> GET /auth/v1/user
       -> getVerifiedAuthSubject()      -> local JWT verification; JWKS only when cold
       -> resolveActiveMembership()     -> GET /rest/v1/household_members
       -> ProductNavigation             -> HEAD /rest/v1/inbox_items
  -> PlanHubPage guards                 -> request-local cache reuses auth/membership
  -> Promise.all
       -> getPlanPulse()
       -> getCurrentJarBudgets()
       -> listOpenInboxItems()
       -> listGoals()
       -> listPlanHubUpcomingEvents()
       -> translations
  -> server-side mapping and financial derivation
  -> Plan sections: pulse, exceptions, recommendations, upcoming, jars, goals, tools
```

## 3. Server Component / Suspense Structure

`PlanHubPage` performs the user/membership guard and then awaits translations plus five domain loaders in one `Promise.all` at [`app/[locale]/(product)/plan/page.tsx:301-322`](<../../app/[locale]/(product)/plan/page.tsx:301>). No child Plan section is an independent async Server Component and no page-local Suspense boundary wraps the data sections.

The page fallback at [`app/[locale]/(product)/plan/loading.tsx:47-93`](<../../app/[locale]/(product)/plan/loading.tsx:47>) is a page-wide skeleton. `plan-child-loading.tsx` exists as a reusable-looking artifact but is not wired into the hub composition.

Browser-visible timings from the clean 10-run sample show the consequence:

| Marker                       |   Median |          Range |
| ---------------------------- | -------: | -------------: |
| Document response-start      |   242 ms |     222–307 ms |
| Primary pulse visible        | 1,595 ms | 1,105–1,657 ms |
| Jars section visible         | 1,607 ms | 1,117–1,662 ms |
| Upcoming section visible     | 1,609 ms | 1,119–1,665 ms |
| Goals section visible        | 1,610 ms | 1,120–1,667 ms |
| Full content-complete marker | 1,607 ms | 1,120–1,667 ms |

The sections become visible within roughly 5–12 ms of one another. That is not useful progressive section streaming.

An authenticated raw HTML stream check confirmed a partial stream only: the first HTTP chunk arrived at 240–365 ms on warm samples, but `plan-hub` and `plan-period-pulse` markers arrived at approximately 1,215–1,242 ms, in the final content segment. One cold sample delivered its first chunk at 516 ms and Plan markers at 2,436–2,439 ms. Verdict: **PARTIAL** — generic response bytes stream, but useful Plan sections remain blocked behind the page-wide await.

## 4. Remote Request Inventory

The following is the logical inventory for one normal authenticated hub load. The numbers describe graph order; HTTP completion order inside a parallel wave is nondeterministic. The server trace recorded path, method, status, start offset, and duration, but intentionally not query strings, bodies, tokens, or row data.

|   # | Class         | HTTP request                                         | Source                                | Selected data / role                                                                |                         Rows / bytes observed |
| --: | ------------- | ---------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------: |
|   1 | AUTH          | `GET /auth/v1/user`                                  | `get-session-user.ts:21-35`           | Current Auth user                                                                   |             1 / 2,170 B; direct median 200 ms |
|   2 | TENANCY       | `GET /rest/v1/household_members`                     | `resolve-active-membership.ts:31-41`  | `id, household_id, role, user_id`, active member by user                            |               1 / 167 B; direct median 219 ms |
|   3 | HOUSEHOLD     | `GET /rest/v1/households`                            | `get-home-household-context.ts:58-64` | Full context: name, locale, timezone, currency, month-close, income-allocation mode |               1 / 153 B; direct median 196 ms |
|   4 | JARS          | `GET /rest/v1/jars`                                  | `get-plan-pulse.ts:31-40`             | Jar state plus nested `jar_plans(plan_kind, percent_bps, fixed_amount)`             |             8 / 1,981 B; direct median 201 ms |
|   5 | HOUSEHOLD     | `GET /rest/v1/households`                            | `list-recurring.ts:19-25`             | `base_currency, income_allocate_mode` for upcoming projection                       | subset projection; not separately byte-probed |
|   6 | OTHER         | `GET /rest/v1/recurring_rules`                       | `list-recurring.ts:26-32`             | Recurring rule fields for upcoming preview                                          |                 0 / 2 B; direct median 222 ms |
|   7 | OTHER         | `POST /rest/v1/rpc/get_money_credit_card_raw_inputs` | `list-credit-cards.ts`                | Card/settings/billing raw inputs                                                    |             3 / 1,733 B; direct median 209 ms |
|   8 | OTHER         | `GET /rest/v1/loans`                                 | `list-plan-hub-upcoming.ts:51-61`     | Active loan summary fields                                                          |                 0 / 2 B; direct median 206 ms |
|   9 | OTHER         | `GET /rest/v1/loan_schedule_entries`                 | `list-money-products.ts:627-648`      | Upcoming schedule rows from today onward                                            |                 0 / 2 B; direct median 215 ms |
|  10 | OTHER         | `GET /rest/v1/liabilities`                           | `list-money-products.ts:31-44`        | Active liability summary fields                                                     |                 0 / 2 B; direct median 207 ms |
|  11 | HOUSEHOLD     | `GET /rest/v1/households`                            | `list-goals.ts:413-420`               | `base_currency` for goal mapping                                                    | subset projection; not separately byte-probed |
|  12 | SUMMARY       | `GET /rest/v1/goals`                                 | `list-goals.ts:363-373`               | Goal raw fields, excluding cancelled goals                                          |                 0 / 2 B; direct median 204 ms |
|  13 | SUMMARY       | `GET /rest/v1/goal_funding_links`                    | `list-goals.ts:374-384`               | Active links and source IDs                                                         |                 0 / 2 B; direct median 204 ms |
|  14 | PLAN_SETTINGS | `GET /rest/v1/households`                            | `get-current-jar-budgets.ts:190-222`  | `timezone, qualifying_monthly_income, base_currency`                                |                1 / 88 B; direct median 200 ms |
|  15 | OTHER         | `GET /rest/v1/inbox_items`                           | `review-items.ts:313-338`             | 18-field bounded pending queue, active kinds and assignment filter                  |             6 / 6,121 B; direct median 222 ms |
|  16 | COUNT         | `HEAD /rest/v1/inbox_items`                          | `review-items.ts:445-470`             | Exact unread-open navigation badge count                                            |              no body; server trace status 200 |
|  17 | TRANSACTIONS  | `GET /rest/v1/transactions`                          | `get-current-jar-budgets.ts:158-172`  | Current period budget transaction inputs plus `accounts!inner(financial_scope)`     |            23 / 6,633 B; direct median 201 ms |
|  18 | TRANSACTIONS  | `GET /rest/v1/loan_payments`                         | `get-current-jar-budgets.ts:173-178`  | Current-period transaction IDs treated as loan payments                             |                 0 / 2 B; direct median 207 ms |
|  19 | INCOME        | `GET /rest/v1/recurring_rules`                       | `get-current-jar-budgets.ts:225-249`  | Active income rules projected into the selected period                              |                 0 / 2 B; direct median 223 ms |
|  20 | HISTORY       | `GET /rest/v1/jar_period_rule_snapshots`             | `get-current-jar-budgets.ts:269-289`  | Current and previous period snapshots                                               |             8 / 3,120 B; direct median 203 ms |
|  21 | HISTORY       | `GET /rest/v1/transactions`                          | `get-current-jar-budgets.ts:158-172`  | Previous period budget transaction inputs                                           |                 0 / 2 B; direct median 209 ms |
|  22 | HISTORY       | `GET /rest/v1/loan_payments`                         | `get-current-jar-budgets.ts:173-178`  | Previous-period loan-payment IDs                                                    |                 0 / 2 B; direct median 206 ms |
|  23 | ADJUSTMENTS   | `GET /rest/v1/jar_period_adjustments`                | `get-current-jar-budgets.ts:292-313`  | Previous-period per-jar adjustment amounts                                          |                 0 / 2 B; direct median 198 ms |
|  24 | ADJUSTMENTS   | `GET /rest/v1/jar_period_adjustments`                | `get-current-jar-budgets.ts:292-313`  | Current-period per-jar adjustment amounts                                           |                 0 / 2 B; direct median 199 ms |
|  25 | OTHER         | `GET /rest/v1/transactions`                          | `review-items.ts:97-120`              | Inbox source detail: note, category name, account name and ownership                |               4 / 834 B; direct median 208 ms |
|  26 | MEMBERS       | `GET /rest/v1/savings`                               | `review-items.ts:122-153`             | Conditional ownership validation for two guided savings items                       |               2 / 243 B; direct median 204 ms |
|  27 | MEMBERS       | `GET /rest/v1/household_members`                     | `review-items.ts:219-230`             | Conditional active owner-membership validation for inbox sources                    |         conditional; server trace observed it |

Normal-load totals: **27 HTTP fetches**, comprising one Auth user read, two membership-table reads, four household projections, one jar read, three transaction reads, two loan-payment reads, two adjustment reads, one snapshot read, two recurring-rule reads, one inbox GET, one inbox HEAD, one goals read, one funding-link read, one savings read, one RPC, one loan read, one schedule read, and one liability read. The first cold traced load added `/auth/v1/.well-known/jwks.json`.

## 5. Dependency Graph

```text
W0: authenticated session
  getSessionMembership()
    ├─ getSessionUser() -> GET /auth/v1/user
    ├─ getVerifiedAuthSubject() -> local verification; cold JWKS GET
    └─ resolveActiveMembership(subject) -> GET household_members

W1: Plan base fan-out, after the session gate
  ├─ getPlanPulse()
  │    ├─ getHomeHouseholdContext() -> households
  │    └─ jars + nested jar_plans -> jars
  ├─ listPlanHubUpcomingEvents()
  │    ├─ listRecurring() -> households + recurring_rules
  │    ├─ listCreditCards() -> cached full household context + credit-card RPC
  │    ├─ loadHubLoans() -> loans
  │    ├─ listLiabilities() -> liabilities
  │    └─ listUpcomingLoanScheduleEntries() -> loan_schedule_entries
  ├─ listGoals() -> households + goals + goal_funding_links
  ├─ listOpenInboxItems() -> inbox_items
  ├─ countUnreadOpenInboxItems() -> inbox_items HEAD
  └─ getCurrentJarBudgets() -> households settings + getPlanPulse()

W2: ID/period-dependent reads
  getCurrentJarBudgets(), after settings + pulse resolve
    ├─ current transactions + current loan payments
    ├─ active recurring income rules
    ├─ current + previous snapshots
    ├─ previous transactions + previous loan payments
    └─ current + previous adjustments
  listOpenInboxItems(), after inbox rows resolve
    └─ transaction source details

W3: conditional inbox ownership tail
  transaction detail completion
    -> guided savings ownership read
    -> active owner-membership read

Page return
  all Promise.all values + inbox enrichment + financial derivation
  -> Plan sections rendered
```

The goals branch had zero active goal rows and zero active funding links for the authenticated representative household, so it produced no further linked-source wave in this run. The `/savings` request in the measured graph came from guided inbox-source ownership enrichment, not from goal funding.

## 6. Dependency Waves

| Wave                               | Requests                                                             | Start/completion shape                                                                                                                                      | Blocks                                                                 |
| ---------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 0. Auth/session                    | Auth user, claims verification, primary membership                   | Warm direct medians: 200 ms Auth and 219 ms membership; cold JWKS added ~707 ms in the first traced process                                                 | Product layout and all Plan loaders                                    |
| 1. Base fan-out                    | 14 page/preview/count requests, including four household projections | Requests begin together after the gate; warm endpoint medians are mostly 196–222 ms                                                                         | Pulse/settings resolution for budget branch; inbox rows for enrichment |
| 2. Budget + first inbox dependency | 8 jar-budget requests plus inbox transaction detail                  | Starts after `getPlanPulse()` and budget settings; the budget requests are parallel with the first inbox-detail read                                        | Final budget metrics and remaining inbox enrichment                    |
| 3. Conditional inbox tail          | Guided savings ownership, then active owner memberships              | Sequential inside `enrichWithTransactionDetails()`; current observed savings read was ~204 ms median and the final member read was ~200 ms in server traces | `listOpenInboxItems()`, then the page return                           |

The broad architecture creates Wave 2: `getCurrentJarBudgets()` first needs settings and the pulse/jar IDs, then starts eight reads. The inbox loader creates Wave 3 through explicit sequential enrichment. There is no avoidable serial await inside the eight budget reads themselves; the avoidable part is the number of dependent HTTP boundaries.

The measured server critical path is approximately the session gate, one hosted request floor for the base fan-out, one hosted request floor for the budget/inbox dependency, and the conditional inbox tail: roughly 0.9–1.2 s from server request start on warm traces, with occasional endpoint outliers. Browser content-complete is higher because it includes RSC/HTML transfer, client parsing, and hydration; the 10-load median was 1.61 s.

## 7. Production-Like Baseline

Commands used:

```text
npm run build
VINHA_PERF_TRACE=1 npm run start
```

`npm run build` completed successfully with Next.js 16.3.1, TypeScript checking, and static route generation. The traced production server ran on `http://localhost:3101`; an existing user development server on port 3000 was left untouched.

Clean warm Chromium sample: 10 consecutive authenticated navigations to `/en/plan`, using the representative household and verified Plan selectors.

| Metric                  |      Min |   Median |      P75 |      P95 |      Max |
| ----------------------- | -------: | -------: | -------: | -------: | -------: |
| Document response-start |   222 ms |   242 ms |   247 ms |   307 ms |   307 ms |
| Primary pulse visible   | 1,105 ms | 1,595 ms | 1,611 ms | 1,657 ms | 1,657 ms |
| Jars visible            | 1,117 ms | 1,607 ms | 1,617 ms | 1,662 ms | 1,662 ms |
| Upcoming visible        | 1,119 ms | 1,609 ms | 1,620 ms | 1,665 ms | 1,665 ms |
| Goals visible           | 1,120 ms | 1,610 ms | 1,623 ms | 1,667 ms | 1,667 ms |
| Full content-complete   | 1,120 ms | 1,607 ms | 1,623 ms | 1,667 ms | 1,667 ms |

A separate first-run traced sample retained the cold distinction: response-start was approximately 2,020 ms and full content-complete approximately 3,403 ms, with the extra cold Auth/JWKS work visible in the server log. The cold result is not mixed into the warm median above.

## 8. Auth / Membership

The layout and Plan page both express the session/membership guard, but request-local React `cache()` prevents a remote duplicate:

- [`require-product-session.ts:21-42`](../../modules/tenancy/application/require-product-session.ts:21) calls `getSessionMembership()` from the product layout.
- [`get-session-membership.ts:24-49`](../../modules/tenancy/application/get-session-membership.ts:24) overlaps `getSessionUser()` with verified claims, then resolves membership.
- [`get-session-user.ts:16-44`](../../modules/tenancy/application/get-session-user.ts:16) and [`resolve-active-membership.ts:23-70`](../../modules/tenancy/application/resolve-active-membership.ts:23) are both request-locally cached.
- The Plan page’s direct calls at `page.tsx:301-304` reuse the same cached operations in the same render.

Verdict: **required gate, request-local deduped**. There is one normal `/auth/v1/user` request and one primary `household_members` request per page. The second `household_members` request is conditional inbox-source ownership validation, not a duplicate of the gate. Auth must remain in the benchmark; no Auth architecture change is justified by this investigation.

## 9. Household / Plan Settings

Four household reads occur in the first fan-out:

| Consumer                                       | Projection                                                                      | Why it exists                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `getPlanPulse()` / `getHomeHouseholdContext()` | name, locale, timezone, base currency, month-close mode, income-allocation mode | Pulse currency and mode mapping                       |
| `listRecurring()`                              | base currency, income-allocation mode                                           | Upcoming event projection                             |
| `listGoals()`                                  | base currency                                                                   | Goal currency mapping                                 |
| `loadHouseholdSettings()`                      | timezone, qualifying monthly income, base currency                              | Budget period bounds and qualifying-income resolution |

`listCreditCards()` reuses the full request-local `getHomeHouseholdContext()` projection; it does not add a fifth full-context request. The four reads are overlapping projections of the same household row. Three are avoidable transport duplication in principle, but they are parallel, so removing them is expected to improve request load more reliably than critical-path latency.

No separate Plan-settings table or Plan-settings RPC is used by the hub. Month-close mode and income-allocation mode come from household columns. `month_ritual_runs` is not read on the hub; it is read by the monthly-review route.

## 10. Jars / Capacity

`getPlanPulse()` loads all household jars with nested `jar_plans` in one PostgREST request, then maps active/paused/archived state. The raw allocation fields are `plan_kind`, `percent_bps`, and `fixed_amount`; jar state includes `rollover_mode`.

`getCurrentJarBudgets()` waits for the pulse and settings, obtains active jar IDs, then starts the eight-read second wave at [`get-current-jar-budgets.ts:392-439`](../../modules/plan/application/queries/get-current-jar-budgets.ts:392):

- selected-period transactions and loan-payment IDs;
- selected-period recurring income;
- selected and previous period snapshots in one request;
- previous-period transactions and loan-payment IDs;
- previous-period adjustments;
- selected-period adjustments.

The current representative household returned eight jars and 23 current-period transactions. The previous-period transaction, both loan-payment, both adjustment, and recurring-income reads returned zero rows, but still paid the hosted request floor. The jar-budget path is therefore the strongest safe one-wave candidate, provided that raw inputs—not derived balances—are consolidated and formulas remain in the application layer.

## 11. Allocations / Adjustments

Allocations are not fetched from a separate aggregate. They are embedded in the jar query through the one-to-one `jar_plans` relation and mapped by `mapJarPlan()`.

Adjustments are distinct month-scoped reads at [`get-current-jar-budgets.ts:292-313`](../../modules/plan/application/queries/get-current-jar-budgets.ts:292). The current and previous calls use the same table and projection but different period values. They are necessary as separate application inputs today because previous adjustment values contribute to rollover-credit reconstruction.

Carry-forward and capacity semantics remain in TypeScript:

- previous snapshots provide prior `rule_budget` and `rollover_credit`;
- previous transactions provide prior spent amounts;
- previous adjustments participate in the previous budget state;
- current adjustments participate in current jar metrics;
- `calculateJarBudgetMetrics()`, `calculateJarSpentAmount()`, `calculateRolloverCreditFromPreviousState()`, and `resolveJarPlanForPeriod()` derive the displayed values.

No `plan_movements` read, allocation mutation, snapshot persistence, or month-close mutation occurs on the hub GET path. Missing current snapshots are synthesized in memory; the persistence command is not called.

## 12. Transaction / Income Dependencies

Plan reads raw transactions rather than an aggregate RPC for jar budgets. The query is bounded by the selected period, requires `accounts!inner(financial_scope='household')`, and selects only the financial fields used by the budget mapper. It does not require an account-ID discovery query.

`loadPeriodTransactions()` starts the transaction query and loan-payment-ID query in parallel. It is called once for the selected period and once for the previous period. The current query returned 23 rows / 6,633 B; the previous query returned zero rows / 2 B. A separate inbox enrichment query returned four source transactions / 834 B with a different narrow projection.

Income is resolved in the application layer from:

1. configured household qualifying income;
2. projected active recurring income;
3. posted current-period income fallback.

This is not a duplicate transaction scan: the inbox transaction detail query serves ownership and display enrichment, while the two budget transaction queries serve financial-period calculations. They are nevertheless separate hosted HTTP calls with the same table family in the page path.

## 13. Duplicate / Count / HEAD Reads

| Pattern                                                 | Classification                                                                            | Evidence                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Four `households` GETs with overlapping row projections | **Confirmed overlapping transport duplication**; three extra projections beyond the first | Pulse, recurring, goals, and budget-settings loaders each request the same household row with different selects |
| Layout auth/membership guard plus page guard            | **Request-local deduped**, not a remote duplicate                                         | React `cache()` on user, claims, membership, and money allowance                                                |
| Two `household_members` GETs                            | **Necessary + conditional**, not a duplicate                                              | Primary gate lookup plus inbox source-owner validation                                                          |
| Three `transactions` GETs                               | **Necessary by current consumers**, not identical payloads                                | Current budget, previous budget, and inbox detail projections                                                   |
| Two `jar_period_adjustments` GETs                       | **Necessary historical inputs**, not an exact duplicate                                   | Current and previous period semantics                                                                           |
| `GET /inbox_items` plus `HEAD /inbox_items`             | **Necessary but independently countable**                                                 | Full queue items for Plan exceptions versus unread navigation badge                                             |
| Link prefetch                                           | **Suppressed**                                                                            | `PRODUCT_LINK_PREFETCH` is `false`; no detail-route prefetch amplification observed                             |
| Server + client initial fetch                           | **Not present**                                                                           | No client Supabase/refetch activity observed after hydration                                                    |

Summary: **3 extra overlapping household projections; 0 confirmed exact duplicate payload reads**. The HEAD badge is a real remote request but runs in the layout footer Suspense branch and is not the main critical-path cause.

## 14. PostgreSQL Plans

All plans were read-only `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` against the linked hosted project. The RPC plan needed an authenticated subject; the query supplied `request.jwt.claim.sub` via a CTE for the explain only. No data was changed.

| Query                                               | Rows | Scan / join                                                            |   Buffers |  Planning | Execution |
| --------------------------------------------------- | ---: | ---------------------------------------------------------------------- | --------: | --------: | --------: |
| Jars + `jar_plans`                                  |    8 | Small-table sequential scans, hash left join, in-memory sort           |     5 hit |  3.686 ms |  0.189 ms |
| Current transactions + household accounts           |   23 | Transaction/account sequential scans, hash join, in-memory sort        |    10 hit |  4.324 ms |  0.320 ms |
| Previous transactions                               |    0 | Small-table sequential scans, hash join, sort                          |    10 hit |  1.464 ms |  0.188 ms |
| Snapshots, two periods                              |    8 | Sequential scans, hash join to household jars                          |     2 hit |  2.121 ms |  0.165 ms |
| Adjustments, two periods                            |    0 | `jar_period_adjustments_jar_period_idx` index scan plus small jar scan |     2 hit |  1.096 ms |  0.135 ms |
| Active recurring income                             |    0 | `recurring_rules_household_active_idx` index scan                      |     2 hit |  0.555 ms |  0.073 ms |
| Pending inbox queue                                 |    6 | `idx_inbox_items_household_status` bitmap index + heap + sort/limit    |     9 hit |  1.139 ms |  0.230 ms |
| Goals                                               |    0 | Small-table sequential scan and sort                                   |     4 hit |  1.395 ms |  1.320 ms |
| Goal funding links                                  |    0 | Small-table sequential scan                                            |     1 hit |  1.467 ms |  0.629 ms |
| Active loans                                        |    0 | Small-table sequential scan                                            |     1 hit |  0.637 ms |  0.129 ms |
| Active liabilities                                  |    0 | Small-table sequential scan and sort                                   |     4 hit |  0.763 ms |  0.177 ms |
| Upcoming loan schedule                              |    0 | Small-table sequential scan and sort                                   |     4 hit |  0.605 ms |  0.154 ms |
| `get_money_credit_card_raw_inputs()`                |    3 | Function scan; 1,058 shared hit blocks inside its joins                | 1,058 hit |         — |  4.446 ms |
| `is_month_ritual_locked`-equivalent existence query |    0 | `month_ritual_runs_review_status_idx` index scan                       |     2 hit | 12.226 ms |  3.842 ms |

The database executes the important hub reads in sub-millisecond to low-single-digit milliseconds. The month-ritual query has the highest planning/execution values in this sample but is not on the Plan hub path. The 190–220 ms direct HTTP medians therefore cannot be attributed to SQL execution.

## 15. Direct Endpoint Benchmarks

Authenticated, read-only direct Supabase samples used 20 repeats per endpoint after a warmup. Values are milliseconds; response bytes and rows are the stable sample values.

| Probe                                       |          Median |             P75 |             P95 |             Max | Bytes / rows |
| ------------------------------------------- | --------------: | --------------: | --------------: | --------------: | ------------ |
| Auth user                                   |             200 |             206 |             507 |             602 | 2,170 / 1    |
| Membership lookup                           |             219 |             232 |             287 |             304 | 167 / 1      |
| Pulse jars                                  |             201 |             212 |             251 |             265 | 1,981 / 8    |
| Full household context                      |             196 |             210 |             273 |             275 | 153 / 1      |
| Budget household settings                   |             200 |             208 |             264 |             305 | 88 / 1       |
| Current budget transactions                 |             201 |             222 |             248 |             295 | 6,633 / 23   |
| Previous budget transactions                |             209 |             222 |             309 |             313 | 2 / 0        |
| Current/previous loan-payment reads         |       207 / 206 |       212 / 216 |       238 / 240 |       251 / 249 | 2 B / 0 each |
| Snapshots, current + previous               |             203 |             229 |             307 |             374 | 3,120 / 8    |
| Current/previous adjustments                |       199 / 198 |       242 / 220 |       293 / 275 |       333 / 948 | 2 B / 0 each |
| Recurring income                            |             223 |             253 |             290 |             307 | 2 / 0        |
| Upcoming recurring rules                    |             222 |             238 |             377 |             603 | 2 / 0        |
| Goals / funding links                       |       204 / 204 |       220 / 230 |       285 / 311 |       294 / 311 | 2 / 0 each   |
| Inbox open queue, corrected filter encoding |             222 |             244 |             512 |             610 | 6,121 / 6    |
| Inbox transaction enrichment                |             208 |             218 |             258 |             284 | 834 / 4      |
| Inbox guided-savings enrichment             |             204 |             260 |             524 |             588 | 243 / 2      |
| Credit-card raw-input RPC                   |             209 |             220 |             288 |             289 | 1,733 / 3    |
| Loans / schedule / liabilities              | 206 / 215 / 207 | 220 / 219 / 225 | 280 / 276 / 309 | 351 / 315 / 341 | 2 B / 0 each |

The direct benchmark’s initial inbox probe used malformed repeated `or` query encoding and returned HTTP 400; it was excluded. A corrected authenticated probe using parenthesized PostgREST OR expressions returned HTTP 200 and is the value reported above.

## 16. Payload / Overfetch

Verdict: **MODERATE operational overfetch; low-to-moderate field overfetch**.

The individual projections are generally deliberate and narrow. The main cost is breadth and historical duplication:

- The hub makes 27 remote calls even though several branches returned zero rows and two of the major preview sections were empty for the representative household.
- The jar budget path fetches current and previous transaction/payment inputs because carry-forward semantics require both; the previous period happened to return no rows, so this is not proof that the historical read can be removed.
- Snapshots combine two periods in one request and returned eight rows / 3,120 B.
- The inbox uses an 18-field queue projection and then source enrichment. The observed open queue was six rows / 6,121 B; the source transaction enrichment was separately narrowed to four rows / 834 B.
- The credit-card RPC returned three raw rows / 1,733 B. This is a preexisting read model, not a Plan-specific field explosion.
- Upcoming loans, liabilities, schedule, and recurring rules each returned zero rows but still incurred the hosted request floor.

No field should be removed from the budget or inbox projections solely from this sample. The financial fields are consumed by application mappers and formulas; the evidence supports reducing dependent request boundaries before field surgery.

## 17. Client / Post-Hydration Requests

Initial server load: 27 warm Supabase/Auth HTTP fetches.

Post-hydration app traffic: **0 observed Supabase/refetch requests** in the browser performance resources for the Plan hub sample. No `useEffect`, SWR/React Query, client REST call, or `router.refresh()` added an initial data fetch. The diagnostic raw-stream checks were not counted as app post-hydration traffic.

Plan detail/config links use `PRODUCT_LINK_PREFETCH`, whose current value is `false` in `shared/constants/navigation.ts`. Repeated hub loads therefore did not show Next prefetch amplification for jar, goal, recurring, calendar, or ritual routes.

## 18. Index Review

The actual plans show adequate support for the important access patterns:

- `jar_period_adjustments_jar_period_idx` was used for the adjustment query.
- `recurring_rules_household_active_idx` was used for active income rules.
- `idx_inbox_items_household_status` was used for the pending inbox bitmap scan.
- `month_ritual_runs_review_status_idx` was used for the month-ritual existence check.
- `idx_transactions_household_date_created` exists for the household/date transaction pattern, although the tiny current table caused PostgreSQL to choose a sequential scan.
- Household, jar, snapshot, loan, liability, goal, and funding-link indexes exist for their scoped keys.

The Supabase performance advisor reported broad unindexed-foreign-key and unused-index notices across the schema. Those notices are not evidence that a new Plan index would reduce this hub’s critical path. No speculative index is recommended.

## 19. Root-Cause Classification

| Rank          | Classification                                    | Verdict                    | Evidence                                                                                                                     |
| ------------- | ------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| P1            | Page-wide RSC blocking / lack of useful streaming | Confirmed                  | Page awaits all loaders; Plan markers appear together at ~1.6 s and only in the final raw stream segment                     |
| P1            | Hosted Supabase HTTP/service overhead             | Confirmed                  | Direct endpoint medians cluster around 196–223 ms while SQL execution is below 1 ms for most reads                           |
| P1            | Jar-budget dependency wave                        | Confirmed                  | Settings + pulse precede eight period/input reads; current and previous paths are all awaited before page return             |
| P2            | Sequential inbox enrichment tail                  | Confirmed                  | Transaction detail, guided savings ownership, and member validation are sequential in `enrichWithTransactionDetails()`       |
| P2            | Overlapping household projections                 | Confirmed                  | Four projections of the same household row; no request-local shared settings read model across all consumers                 |
| P2            | Broad upcoming preview fan-out                    | Confirmed                  | Five cross-domain reads start for a seven-day preview, including empty loan/liability/schedule/rule tables in this household |
| P2            | Unread HEAD count                                 | Confirmed but not dominant | One exact-count HEAD request; it is parallel in the footer Suspense branch                                                   |
| NOT A PROBLEM | PostgreSQL execution                              | Confirmed not material     | Hub query execution was 0.073–4.446 ms in the captured plans                                                                 |
| NOT A PROBLEM | Missing Plan index                                | No evidence                | Existing access-pattern indexes are present and relevant indexes were used where selective                                   |
| NOT A PROBLEM | Client post-hydration refetch                     | Confirmed absent           | Zero Plan Supabase/refetch requests observed after hydration                                                                 |
| INCONCLUSIVE  | Region/network distance                           | Not isolated               | The brief forbids changing region; hosted request floor is measured, but network path is not independently decomposed        |
| INCONCLUSIVE  | Large-household scaling                           | Not modeled                | The representative household is small; no claim is made about 10k-row production behavior                                    |

## 20. Ranked Optimization Candidates

No candidate was implemented.

| Rank | Candidate                                                                     | Expected critical-path gain                                                       | Confidence  | Financial/RLS risk                                   | Complexity | Assessment                                                                         |
| ---- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| 1    | One narrow jar-budget raw-input read model at `getCurrentJarBudgets()`        | High; removes a dependent 8-read wave plus its settings read                      | High        | Medium–High; must preserve carry-forward and tenancy | Medium     | Best first target after raw/final equivalence and RLS tests                        |
| 2    | Section-level streaming for pulse/jars versus upcoming/goals/inbox            | High visual gain; total fetch work initially unchanged                            | High        | Low                                                  | Medium     | Strong second target if first useful paint matters more than total work            |
| 3    | Reuse one request-local household context for recurring/goals/budget settings | Low–Medium critical-path gain; removes overlapping requests but they are parallel | High        | Low                                                  | Low–Medium | Safe follow-up, not the largest wall-time lever                                    |
| 4    | Defer or separately stream the upcoming preview fan-out                       | Medium visual gain                                                                | Medium–High | Low                                                  | Medium     | The preview is not required for the first pulse, but route composition must change |
| 5    | Remove or defer the unread HEAD count                                         | Low                                                                               | High        | Low                                                  | Low        | One request, parallel with page work; not dominant                                 |
| 6    | Add a Plan index                                                              | Unproven                                                                          | Low         | Schema/maintenance cost                              | Medium     | Reject until a larger-cardinality plan proves a scan bottleneck                    |

## 21. Recommended First Implementation

**FIRST TARGET:** `modules/plan/application/queries/get-current-jar-budgets.ts` — replace its multi-request raw-input boundary with one narrow authenticated read-only jar-budget read model.

**CURRENT SHAPE:** 9 budget-related HTTP reads: one household-settings projection plus eight dependent reads after the pulse/settings gate. The full hub is 27 warm fetches across 4 waves; browser content-complete median is 1,607 ms.

**TARGET SHAPE:** one read-only jar-budget raw-input call that returns the jar/period inputs needed by the existing application formulas, reducing the expected hub to approximately 19 warm fetches across 3 broad waves. The exact after latency must be measured; no after-performance number is claimed here.

**WHY:** the eight dependent reads all pay a roughly 200 ms hosted Supabase request floor, while their PostgreSQL execution is sub-millisecond to low-single-digit milliseconds. The target removes the largest confirmed dependency wave without moving financial derivation into SQL.

**EXPECTED RISK:** MEDIUM / HIGH. The implementation must prove raw/final equivalence for current and previous periods, preserve income-allocation and carry-forward semantics, enforce household tenancy inside the read model, and keep all browser/runtime access on the publishable authenticated path. Do not create a mega Plan RPC and do not persist snapshots from the GET path.

## 22. Raw Evidence

### Repository and server evidence

- Build: `npm run build` — passed.
- Production server: `env PORT=3101 VINHA_PERF_TRACE=1 npm run start` — passed and served the production build.
- Trace source: [`modules/platform/application/perf-trace.ts`](../../modules/platform/application/perf-trace.ts), gated by `VINHA_PERF_TRACE=1`; it logs pathnames, methods, status, start offsets, and durations only.
- Captured trace log: [`output/playwright/plan-perf/server.log`](../../output/playwright/plan-perf/server.log).
- Direct benchmark artifact: [`output/playwright/plan-perf/direct-benchmark.json`](../../output/playwright/plan-perf/direct-benchmark.json). The corrected inbox probe is recorded in this report because the first artifact’s inbox path used invalid OR encoding.

### Browser evidence

- Browser: Playwright Chromium, authenticated representative household, repeated `/en/plan` navigations.
- Warm sample: 10 consecutive loads, response-start 222–307 ms, full content-complete 1,120–1,667 ms, median 1,607 ms.
- Marker order: pulse, jars, upcoming, goals, and full content all appeared within approximately 12 ms of the first useful Plan marker.
- Raw stream: first response chunks arrived before Plan content, but Plan markers appeared only in the final content segment.

### Database evidence

- Linked project was inspected read-only through Supabase MCP.
- `EXPLAIN (ANALYZE, BUFFERS)` was captured for jars, transactions, snapshots, adjustments, recurring income, inbox, goals, goal links, loans, liabilities, loan schedule, credit-card RPC, and month-ritual existence logic.
- No migration, DDL, INSERT, UPDATE, DELETE, Auth configuration, RLS policy, fixture setup, or financial mutation was performed.

### Final safety statement

This report is diagnostic only. No production optimization was shipped, no Plan formula or allocation semantics were changed, no financial data was mutated, and no speculative index or broad cache was added.
