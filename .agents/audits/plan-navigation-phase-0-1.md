# Plan Performance Phase 0.1 — Critical-Path Isolation & Verification Readiness

**Date:** 2026-10-11  
**Scope:** `/plan` overview only  
**Production changes:** none  
**Test harness:** one deterministic Vitest characterization test added

## Decision

The shared-promise barrier is proven at the source and promise-resolution
levels. `resolvePlanHubData()` waits for inbox items and history-month options
along with current budget data; the critical summary and jar section both await
that same promise. Deferred tests show either secondary loader keeps both
sections pending, even when current financial data is already available.

This does not prove when Next.js emits RSC stream chunks. The test invokes the
async Server Components from the returned element tree and does not serialize a
Next.js response. Runtime streaming and authenticated timing remain blocked by
the credential gate below. The minimal architectural split is feasible, with
one period-identity condition: use the household timezone consistently when
classifying `?month=`.

**Architectural readiness:** verified, subject to the period-identity condition
above. **Performance readiness:** blocked. Do not start Phase 1 as a measured
performance change unless authenticated benchmarking becomes safe or
structural-only validation is explicitly accepted.

## Scope inspected

- `app/[locale]/(product)/plan/page.tsx`
- `app/[locale]/(product)/plan/layout.tsx`
- `app/[locale]/(product)/plan/plan-period-select.tsx`
- `app/[locale]/(product)/plan/loading.tsx`
- `app/[locale]/(product)/layout.tsx`
- `modules/plan/application/queries/get-plan-pulse.ts`
- `modules/plan/application/queries/get-current-jar-budgets.ts`
- `modules/plan/application/queries/list-plan-hub-upcoming.ts`
- `modules/inbox/application/queries/review-items.ts`
- `modules/tenancy/application/require-product-session.ts`
- `modules/tenancy/application/get-session-membership.ts`
- `modules/platform/application/perf-trace.ts`

No Goal Detail, Jar Detail, Calendar, or Recurring routes were revisited. The
existing `.agents/audits/plan-section-streaming.md` describes a different Plan
data graph; its historical measurements are not evidence for this checkout's
current `PlanHubData` promise.

## Dependency DAG and await boundaries

The bottom navigation Plan link uses `PRODUCT_LINK_PREFETCH = false` in
`shared/patterns/bottom-navigation.tsx`. A navigation reaches the product
layout, which awaits `requireProductSession()` before rendering children. That
gate uses `getSessionMembership()`. The Plan layout then awaits `getMessages()`
before rendering the page. The Plan page awaits `params` and `searchParams`
together, calls `getSessionUser()`, and then `resolveActiveMembership(user.id)`
in sequence. The session and membership helpers use React request caching; no
HTTP trace was collected to verify the number or completion time of those
calls. The product footer's unread inbox count is inside its own Suspense
boundary and is not passed into `PlanHubData`.

After the Plan page gate, the page starts the reads below before awaiting the
Plan translation. Promise creation starts each helper; each helper may first
await its own cached authorization gate before issuing its remote read. The
source identifies these ordering relationships, not actual network completion
times.

| Dependency                   | Required input and remote read                                                                                                                                              | Start and await relationship                                                                                                                                      | Blocks first useful current financial content?                                                        | Historical role                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Plan translation             | Locale; `getTranslations("plan")`                                                                                                                                           | Started with the other reads; the page awaits it before returning the element tree                                                                                | Yes, page shell construction waits for it                                                             | Labels and selector copy                                                                                                              |
| Catalog and Jar translations | Locale; `getTranslations("catalog")` and `getTranslations("plan.jars")`                                                                                                     | Started before the page awaits Plan translation; both are in the resolver's `Promise.all`                                                                         | Yes, because the resolver includes both                                                               | Snapshot jar names are already stored; catalog lookup remains part of the current model                                               |
| Plan pulse                   | Household authorization; household context plus ordered `jars` query                                                                                                        | Current route only; starts alongside current budget, inbox, and history months; resolver awaits it                                                                | Yes; provides active jar identities, currency, and month-close mode                                   | Skipped for a route preclassified as historical                                                                                       |
| Current jar budgets          | Household authorization; `get_plan_jar_budget_raw_inputs` RPC with the request time                                                                                         | Current route only; starts alongside pulse and secondary reads; resolver awaits it                                                                                | Yes; provides authoritative current period and per-jar metrics                                        | Skipped for a route preclassified as historical                                                                                       |
| History-month options        | Household authorization; household settings read, then `jar_period_rule_snapshots.period_month` read                                                                        | Started on current and historical routes; resolver awaits it with all other inputs                                                                                | Yes today, though options are not needed to calculate a selected period                               | Populates selectable past months; it does not establish whether the URL's selected month is historical or whether its snapshot exists |
| Inbox attention              | Household authorization; bounded `inbox_items` query, then `enrichWithTransactionDetails()` reads for transaction, savings, loan, and liability sources present in the page | Current route only; starts in parallel, but resolver awaits the base query and enrichment before exposing its result                                              | Yes today; it is needed by attention UI, not the budget summary or jar rows                           | Skipped for a route preclassified as historical                                                                                       |
| Historical budget            | Household settings/timezone; selected month's frozen rule snapshots and jar identities, then period transactions and adjustments                                            | Started only when the route preclassifies the query as historical; loader internally validates the month and uses parallel reads in two waves                     | No current financial summary is eligible on this branch; the historical summary waits for this result | Authoritative source for historical jar names/rules/income/rollover; metrics use transactions and adjustments for that same period    |
| Upcoming preview             | Household authorization and the existing recurring, card, loan, liability, and loan-schedule reads                                                                          | **Not started at page navigation.** `PlanUpcomingSection` waits for `PlanHubData`, then `listPlanHubUpcomingEvents()` starts its five top-level reads in parallel | Yes indirectly today, because it first waits for the shared resolver                                  | Skipped after the shared data resolves as historical                                                                                  |

For current requests, `resolvePlanHubData()` awaits translations, pulse, current
budgets, history-month options, inbox items, and the historical placeholder in
one `Promise.all` (`page.tsx:198-226`). For a request preclassified as
historical, pulse/current-budget/inbox are resolved placeholders, while the
history snapshot and history-month options are awaited. The current budget
helper makes one existing RPC call and performs its mapping/calculation after
the RPC returns; this phase did not add or duplicate that call.

## Suspense isolation proof and limits

`PlanCriticalSection`, `PlanAttentionSection`, `PlanJarsSection`,
`PlanUpcomingSection`, and `PlanShortcutSections` all await the same
`dataPromise` (`page.tsx:294-303`, `529-541`, `651-660`, `932-943`,
`1055-1065`). The top-bar allocation action also awaits it inside Suspense.
`PlanToolDestinations` awaits it without a local Suspense boundary
(`page.tsx:1095-1103`, `1292`). The explicit section boundaries therefore do
not isolate the underlying readiness dependency; they all become data-ready
only after the resolver's slowest input. `PlanToolDestinations` can also
suspend to the route's `loading.tsx` boundary while that promise is pending.

Added `tests/unit/plan-hub-critical-promise.test.tsx`. It builds the actual
`PlanHubPage` element tree, defers either `listOpenInboxItems()` or
`listPlanBudgetHistoryMonths()`, and directly invokes the critical and jar
Server Components. Both remain pending while the chosen deferred promise is
unresolved. Resolving it with the helper's unavailable value (`null`) releases
both sections and preserves the mocked current planned amount and jar section.

Focused deterministic run:

```text
npm run test -- tests/unit/plan-hub-critical-promise.test.tsx \
  tests/unit/plan-jar-budget.test.ts \
  tests/unit/plan-jar-calculation-plan03.test.ts \
  tests/unit/plan-budget-history.test.ts
4 test files passed; 24 tests passed.
```

This proves the promise barrier and final component inputs, not actual HTML/RSC
chunk order, response headers, browser visibility, or navigation timing. No
arbitrary sleep or timing benchmark was used. A real Next.js response test or
authenticated browser run is still needed to prove streamed output.

## Minimum current financial data contract

The current summary and current jar rows need:

- One selected current month from `CurrentJarBudgetSummary.periodMonth`, which
  is returned with the budget RPC result and its household timezone.
- Active jar identities and names from `getPlanPulse()`, excluding
  `JarKind.INCOME` for budget presentation.
- `byJarId` metrics from `getCurrentJarBudgets()`, keyed by those jar IDs.
- `periodIncome` from the current budget result and currency/mode from the
  pulse.
- Existing `summarizeJarBudgets()` and `JarBudgetMetrics` outputs for planned,
  spent, remaining, usage, and budget state. Negative remaining values remain
  valid overspend results.

These are already derived server-side. Phase 1 must pass the existing values
through unchanged: no recalculation, grouping, rounding, allocation, or RPC
change. Both summary and jar rows must consume one request-scoped current-period
read model so period month and metrics cannot drift between them.

## Historical-period boundary

`?month=` is read through `PLAN_MONTH_QUERY` and validated against
`PLAN_PERIOD_MONTH_PATTERN`. The selected URL value establishes the requested
period; history-month options only populate the selector. The selector currently
receives the current month, selected month, and history options together, and
disables selection when fewer than two options are present
(`plan-period-select.tsx:42-55`, `79-85`).

Historical numbers must wait for `getPlanBudgetHistory(requestedMonth)`. That
loader rejects current/future periods using household settings, loads frozen
jar rule snapshots and identities, then loads selected-period transactions and
adjustments. `resolvePlanHubData()` uses the history result for historical
metrics and returns unavailable metrics when it is missing; it does not use
current budget values as a fallback (`page.tsx:238-258`). Keep this branch
strictly snapshot-backed while history is pending.

One existing boundary risk needs a deterministic route test: the page's early
`isHistoricalRequest` check calls `currentPeriodMonth()` with its default
`Asia/Ho_Chi_Minh` timezone (`page.tsx:1215-1218`), while the budget and history
helpers use the household's configured timezone. If those differ around a
month boundary, the page can start the wrong set of reads. The resolver still
does not mix historical figures with current metrics, but it can show history
as unavailable or do unnecessary current reads. Phase 1 must classify the
period using one authoritative household-timezone value, without adding a
second budget RPC.

## Smallest safe Phase 1 decomposition

Keep the server session and membership gate. Create one request-scoped
financial promise for the selected period:

```text
session / membership gate
  └─ selected-period financial promise
       ├─ current: existing pulse + existing current budget RPC
       └─ historical: existing frozen history query only

separate readiness promises
  ├─ history-month selector options
  ├─ inbox items + source enrichment
  └─ upcoming preview (start on navigation; skip for historical selection)
```

The critical summary and jar rows reuse the same financial promise. A nested
selector boundary can receive the same selected month and later history
options. Attention can reuse the financial result for overspending while
awaiting inbox independently. Upcoming should start its existing read when the
page starts its other reads, rather than after the critical promise. Keep all
promises request-scoped and reuse existing query helpers; do not create a
second budget RPC or cross-request cache. Keep all authorization in the current
server helpers.

The current-versus-historical decision must be made once from the same
household-timezone period identity used by the query helper. Historical
selection must never render current-period fallback metrics while the snapshot
is pending or unavailable.

## Deterministic financial correctness matrix

| Case                             | Existing evidence                                                                                                                             | Phase 1 regression assertion                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Current month                    | `plan-jar-budget.test.ts` covers current live plan summaries; new deferred test verifies the current summary uses the supplied current budget | Current selected month, income, active IDs, metrics, and summary remain one period                                                        |
| Historical month                 | `plan-budget-history.test.ts` covers a frozen snapshot with one missing jar snapshot                                                          | Delayed/unavailable history never exposes current budget values; available history uses snapshot names/rules and selected-period spending |
| No active jars                   | `plan-jar-budget.test.ts` asserts the empty summary is zero with null usage                                                                   | Empty jar list remains a valid current summary and empty jar state                                                                        |
| Overspent jar                    | `plan-jar-budget.test.ts` asserts negative remaining and 120% usage                                                                           | Keep negative remaining, spent amount, and overspent state intact                                                                         |
| Rollover credit                  | `plan-jar-budget.test.ts` covers carry/reset and positive rollover credit                                                                     | Preserve prior-period carry calculation and snapshot rollover credit                                                                      |
| Signed adjustment                | Existing tests cover positive adjustment and overspend recovery                                                                               | Add a negative adjustment case as well as positive, preserving signed amount behavior                                                     |
| Household timezone boundary      | `plan-jar-calculation-plan03.test.ts` covers two Ho Chi Minh month-boundary instants                                                          | Add route classification coverage where household timezone differs from default, including `?month=`                                      |
| Inbox slow/unavailable           | New test defers inbox and resolves it unavailable                                                                                             | Current summary and rows are ready independently of both outcomes                                                                         |
| History options slow/unavailable | New test defers options and resolves them unavailable                                                                                         | Current summary and rows remain ready; selector can update when options arrive                                                            |

The new test does not exercise the historical branch or month-selector browser
interaction. Those are required before implementation is accepted.

## Runtime authentication readiness

**Blocked; no authenticated browser activity was attempted.** The latest
credential record, `.agents/audits/investments-phase-1-2-verification-closeout.md`
(2026-10-11), says the exposed E2E password remains unrotated and the local
secret unchanged/unverified. The local secret value was not read or printed.
No login was attempted, and Brave was not opened for authenticated work.

`next.config.ts` currently has `logging.serverFunctions = false`. Existing
`perf-trace.ts` logging records request method/path/status and durations, not
tokens, bodies, or row data. However, standard Playwright setup is unsafe for
this audit: `tests/e2e/global-setup.ts` invokes
`scripts/e2e-auth-fixture.mjs setup`, which creates or updates an Auth identity,
household, Plan data, and other financial fixtures against the configured
Supabase backend. A redacted environment check confirmed the configured URL is
hosted Supabase, not localhost; an isolated backend was not verified. That
setup also writes the generated email/password JSON to stdout, which
`globalSetup` inherits. Therefore `npm run test:e2e` was not run.

Before authenticated verification, rotate the exposed credential and update
the local value, confirm both without printing them, keep Server Function
logging disabled, and use a read-only browser context that does not invoke the
fixture-writing global setup. The fixture stdout credential output must also
be addressed before any setup command is run.

## Instrumentation plan for a future matched baseline

Existing `modules/platform/application/perf-trace.ts` provides fetch timing by
method/path/status and spans for Auth user, claims, and membership. It does not
provide Plan loader milestones or browser first-useful timing.

Add request-correlated, low-cardinality server spans for navigation/session
gate, Plan pulse, budget RPC, history-month settings/query, inbox base query,
inbox enrichment, selected-period financial model ready, jar rows ready,
attention ready, and upcoming ready. Measure the settings read, raw HTTP fetch
to response headers, response body completion, Supabase SDK result
consumption, and local mapping/projection as separate stages where available.
Do not log tokens, parameters, household/user IDs, rows, amounts, or response
bodies.

In the browser, record Plan click, RSC request start, response headers,
`requestfinished`/body completion, RSC UI commit, first visible
`plan-period-pulse`, first visible `plan-home-jars`, attention ready, and page
response complete. Separate header wait, response-body duration, client RSC
processing, and local projection. Use the same authenticated read-only
household, viewport, locale, theme, and browser state for baseline and candidate
captures; report sample counts and percentiles. No benchmark number is claimed
in this audit.

## Stop conditions

- Do not start Phase 1 in this task.
- Stop if the financial promise requires a second budget RPC, changes existing
  calculations, or mixes current and historical values.
- Stop if period classification cannot use the same household-timezone source
  as the financial read.
- Do not attempt login or run E2E setup until credential rotation and the
  fixture/logging gate above are resolved.
- Do not describe promise-level tests as proof of Next RSC streaming or as a
  measured performance improvement.

## Validation

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- Focused Plan and financial tests: 4 files, 24 tests passed.
- Full `npm run test`: 262 of 265 files passed; 1,814 of 1,819 tests passed.
  The five failures were i18n message key parity, three
  `phase-6-accounts-presentation` tests missing `NextIntlClientProvider`, and
  one `money-ia-privacy` class expectation. These files are outside this task's
  changed set.
- Full `npm run format:check`: failed; Prettier reported 194 repository files,
  including files outside this task. Both files changed for this task were
  formatted and checked separately.
- Playwright E2E and authenticated browser verification: not run for the
  security reasons above.

**PLAN PHASE 0.1 COMPLETE — ARCHITECTURE VERIFIED, RUNTIME GATE BLOCKED**
