# Plan Navigation Performance — Phase 0 Investigation

**Date:** 2026-10-11 · **Status:** Source audit complete; authenticated runtime investigation unavailable.

## Investigation scope and security gate

This is a read-only Phase 0 audit. No application code, database state, credentials, or fixtures were changed. The source tree and the current Plan routes were inspected. No authenticated browser session was used.

The latest credential-hygiene record, `.agents/audits/investments-phase-1-2-verification-closeout.md`, says the E2E password previously exposed in development output remains unrotated and its replacement is unverified. `next.config.ts` currently sets `logging.serverFunctions` to `false`, which disables Next.js development logging of Server Function arguments. That config is an uncommitted workspace change; this audit did not restart a server or submit a Server Function to test the live setting. The security gate therefore remains uncleared.

The requested Brave benchmark was not run. The available Brave profile is a personal profile with unrelated signed-in tabs, not a confirmed safe Plan test context. No E2E login was attempted, the standard Playwright global setup was not run, and no records were created. Per the investigation brief, this report uses source evidence and marks runtime measurements unavailable.

## Useful UI milestones

**Plan Overview:** skeletons and the page shell are feedback, not useful financial content. First useful content is the selected planning month plus its income/budget summary and the visible active jar rows with their budget state. Historical review also needs the selected historical month and frozen jar summary; current values must not be mixed into that view.

**Jar Detail:**

1. Header and identity: selected jar name and type.
2. Primary financial state: selected-period budget, spending, and remaining envelope.
3. Secondary content: recent ledger activity and linked categories.
4. Actions ready: edit/reallocation/lifecycle controls and required household/category options.

**Goal Detail:**

1. Header and identity: selected goal name and type.
2. Primary financial state: target, funding-derived amount, progress, and funding quality.
3. Secondary content: linked funding-source details shown in the goal screen.
4. Actions ready: contribution, link/unlink/reassign, edit, and lifecycle actions.

These milestones are source-defined. No browser reveal times were collected.

## Route and component map

All `page.tsx` route modules below are Server Components by default. Plan has a segment `layout.tsx` that loads Plan client messages; the enclosing Product layout provides the authenticated shell, privacy provider, bottom navigation, and transition wrapper. Plan defines no local `error.tsx`; failures reach the enclosing `app/[locale]/(product)/error.tsx` boundary. Each listed `loading.tsx` supplies the route-segment fallback.

| Route                  | Page and server reads                                                                                                                                                | Client leaves / actions                                                                                            | Loading, error, and nested Suspense                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/plan`                | `PlanHubPage`: `getPlanPulse`, `getCurrentJarBudgets`, history-months, inbox attention, and later upcoming-event loaders.                                            | Period selector, jar filter/sort, privacy/offline controls; links to jars, goals, recurring, calendar, and review. | `plan/loading.tsx`; local boundaries for critical summary, attention, jars, upcoming, shortcuts, and allocation action. Error inherits Product boundary. |
| `/plan/jars`           | `PlanJarsPage`: `listJars`, current jar budgets, linked categories, editable categories. This is the allocation/capacity surface; there is no separate budget route. | Create jar/category sheets, category-icon management, privacy controls.                                            | `jars/loading.tsx`; no route-local Suspense/error. Product error boundary.                                                                               |
| `/plan/jars/[id]`      | `PlanJarDetailPage`: selected jar, active jar options, household policies, inbox items, category mappings, and current jar budgets.                                  | Edit/lifecycle/reallocation controls and privacy controls.                                                         | `jars/[id]/loading.tsx`; nested Suspense around `JarRecentActivity`. Product error boundary.                                                             |
| `/plan/goals`          | `PlanGoalsPage`: full goal list and funding options.                                                                                                                 | Create-goal sheet and privacy control.                                                                             | `goals/loading.tsx`; no route-local Suspense/error. Product error boundary.                                                                              |
| `/plan/goals/[id]`     | `PlanGoalDetailPage`: selected goal, then funding options and the full goal list for action options.                                                                 | Goal edit, contribute, link/reassign, Money action navigation, and lifecycle controls.                             | `goals/[id]/loading.tsx`; no nested Suspense in the page. Product error boundary.                                                                        |
| `/plan/recurring`      | `PlanRecurringPage`: recurring rules list.                                                                                                                           | Create recurring sheet and privacy control.                                                                        | `recurring/loading.tsx`; Product error boundary.                                                                                                         |
| `/plan/recurring/[id]` | `PlanRecurringDetailPage`: selected recurring rule.                                                                                                                  | Edit form and actions.                                                                                             | `recurring/[id]/loading.tsx`; Product error boundary.                                                                                                    |
| `/plan/calendar`       | `PlanCalendarPage`: household calendar read model.                                                                                                                   | Calendar view, month navigation, event links, privacy control.                                                     | `calendar/loading.tsx`; Product error boundary.                                                                                                          |
| `/plan/ritual`         | `PlanRitualPage`: monthly review read model.                                                                                                                         | Review actions and privacy control.                                                                                | `ritual/loading.tsx`; Product error boundary.                                                                                                            |

Create and edit are embedded actions, not separate Plan routes. Jar create/edit, goal create/edit/contribute/funding, and recurring create/edit use sheets or in-place controls. Jar adjustments are capacity reallocations; they do not create Money transfers. No distinct Plan settings route was found; jar/category configuration and monthly review are the current settings-like surfaces.

Related Home usage: `getHomeReadiness` calls `getPlanPulse` to show active-jar count and allocation mode, alongside account position. It does not load the Plan budget summary. No separate Plan budget summary read was found in Money; transaction capture/detail surfaces use jar/category context rather than the Plan hub model.

## Navigation and state

| Transition               | Current implementation                                                                                                                                                      | State implications                                                                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bottom Navigation → Plan | Next `Link` in `BottomNavigation`, with `PRODUCT_LINK_PREFETCH` (`false`).                                                                                                  | No Plan-specific state is passed.                                                                                                                                                                         |
| Plan → Jar Detail        | `JarCard` Next `Link`, also with prefetch disabled.                                                                                                                         | The period is held in `?month=` on Plan; the detail URL does not include it.                                                                                                                              |
| Plan → Goal Detail       | Plan hub links to Goals, then `GoalCard` Next `Link` to detail; shared card disables prefetch.                                                                              | Goal list has no URL-backed tab/filter state.                                                                                                                                                             |
| Plan → Create Jar / Goal | Navigate to `/plan/jars` or `/plan/goals`, then open a sheet.                                                                                                               | The create form is not a route and does not survive route unmount.                                                                                                                                        |
| Detail → Back            | Jar detail’s populated header links to `/plan`; Goal and recurring detail use fixed links to their list routes. Shared `TopAppBar` uses a Next `Link`, not `router.back()`. | These return links target canonical routes, not the prior history entry. Jar detail reached from the Jar list also returns to Plan Overview. The Plan month query is not restored by a fixed return link. |
| Edit → Back              | Close/cancel an in-page sheet; no route navigation.                                                                                                                         | Form state is reset or the form body unmounted on close; no draft persistence.                                                                                                                            |

The Plan period selector uses `router.replace` with the `PLAN_MONTH_QUERY` value, so changing months replaces the current history entry. The Plan jar filter and sort use local component state, not URL state. Browser-history Back may restore a cached route/scroll state, but app-header Back is a fixed Link. Whether either path reuses an RSC payload or issues a new RSC request was not measured.

Goal create success uses `router.push` to the new Goal Detail; recurring create and jar edit paths use refresh/update patterns. Server redirects handle unauthenticated or no-membership states. Mutations use Server Actions. No Plan page calls `router.back()`.

## Main Plan dependency chain and request topology

```text
Bottom Navigation Link
→ Next client navigation / RSC request
→ Product session gate (on a render where Product layout runs)
→ Plan page's explicit session and membership checks
→ Plan read helpers
→ server-side mapping and financial calculations
→ Plan sections / RSC stream
→ browser reveal
```

The Product layout calls `requireProductSession()`. Its `getSessionMembership()` starts `getSessionUser()` and verified JWT-subject resolution in parallel, then starts membership resolution from the verified subject while awaiting the user. The tenancy helpers use React `cache()` for the render. Plan pages separately call `getSessionUser()` and then `resolveActiveMembership(user.id)` in sequence. The underlying helpers are also cached, so when both gates execute in one render the source indicates request-local reuse; it does not prove behavior for every client navigation where the shared Product layout may be reused.

The Transactions list/detail routes explicitly call `requireProductSession()` and add session-gate spans. Plan page modules do not; they retain the sequential page-level checks. This is a structural difference from the Transactions route path, not a measured extra network wave. `getSessionUser()` wraps `auth.getUser()`. `getVerifiedAuthSubject()` wraps `auth.getClaims()`; whether claims verification performs a network fetch depends on token/key state. Membership is a household-members query. No runtime HTTP trace was collected to count those calls.

For a current-month Plan Overview, the page starts its domain reads together after its page-level gate:

| Dependency                  | Source-derived HTTP shape                                                                                                                                                                      | Parallel / sequential                                                                                | Blocks first useful UI?                                                                                     | Required for first useful UI?                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Session                     | `getUser`, verified claims, active membership; exact HTTP behavior not measured.                                                                                                               | Product gate overlaps user and subject verification; Plan page source awaits user before membership. | Yes, the route gate blocks page rendering.                                                                  | Yes, safe household access.                                                                           |
| Plan pulse / jar identities | One household read (`getHomeHouseholdContext`) plus one `jars` read.                                                                                                                           | Household and jars reads are parallel.                                                               | Yes: active jar names/kinds are needed for the overview.                                                    | Yes for the jar overview.                                                                             |
| Current budget/capacity     | One PostgREST RPC call to `get_plan_jar_budget_raw_inputs`; the current overview then maps and calculates in TypeScript.                                                                       | Starts alongside the other overview helpers.                                                         | Yes: it supplies the current period metrics.                                                                | Yes.                                                                                                  |
| History-month options       | Normally one household settings read followed by one snapshot-month read; settings has a fallback query if the preferred select fails.                                                         | Sequential within the helper; parallel with other page helpers.                                      | Yes in current code because the shared `PlanHubData` promise waits for it.                                  | Past-month options are not needed to show current numbers; they are needed for the complete selector. |
| Inbox attention             | One bounded open-inbox query, then zero to four batched source reads (transactions, savings, loans, liabilities) depending on returned item kinds, plus a conditional owner-membership lookup. | Base query then source enrichment; enrichment queries are parallel.                                  | Yes in current code because `resolvePlanHubData` waits for inbox items before resolving the shared promise. | No for budget/jar summary; yes for the inbox/attention section.                                       |
| Navigation unread badge     | Separate exact-count/head query against `inbox_items`.                                                                                                                                         | Runs in the Product footer Suspense branch.                                                          | Does not gate Plan page data; bottom-nav fallback remains available.                                        | No for Plan financial content.                                                                        |
| Upcoming preview            | Five top-level loaders: recurring rules, cards, active loans, liabilities, and remaining loan schedule. Each can have its own internal query shape.                                            | Starts after the shared Plan data promise resolves; the section has its own Suspense fallback.       | Not for first useful content; it can extend full RSC completion.                                            | No.                                                                                                   |
| Translations                | Server message lookups for Plan, catalog, and jars.                                                                                                                                            | Started alongside data; resolved locally.                                                            | The page title awaits Plan translations; shared Plan data also awaits catalog/jar translators.              | Labels only; no remote financial dependency.                                                          |

`resolvePlanHubData()` awaits translations, pulse, budget, history months, inbox, and history through one `Promise.all`. `PlanCriticalSection`, `PlanJarsSection`, and `PlanAttentionSection` all await that same promise. Thus the separate Suspense boundaries do not let the budget summary or jar rows pass the inbox and history-month work. This shared join is proven by source; its latency impact is unmeasured.

For a historical month, pulse/current-budget and inbox reads are skipped. History-month options and the selected frozen-history read remain. The selected history path reads household settings, snapshots and jar identities, then the selected period's transactions/loan-payment data and adjustments. No live current-period calculation is substituted into the historical display.

### Helpers versus actual requests and caching

The request shapes above come from the helper implementations, not helper names. A cached Supabase client is reused within the render, but each executed `.from()` or `.rpc()` query is a separate PostgREST request. React `cache()` on session, membership, client, inbox list, home household context, and Plan pulse is request-scoped; it is not household data caching across users or requests. Several Plan query functions (`getCurrentJarBudgets`, `getJar`, `listJars`, `listGoals`, `getGoal`, `listGoalFundingOptions`) are not themselves wrapped in React `cache()`.

No `use cache`, `unstable_cache`, or shared cross-request Plan cache was found. Cookie-backed Supabase access makes product routes request-specific. There is no basis here to recommend cross-user caching, and it would violate household isolation.

The current perf wrapper logs method/path/status and elapsed time until `fetch()` returns response headers. It does not consume the body, measure body completion, SDK query completion, or local Plan projection. Existing named spans cover auth and membership but not the Plan loaders/RPC. Those gaps matter for the requested header/body/SDK/projection split.

## Read models and financial authority

### Budget, jar allocation, and capacity

The Plan hub combines `getPlanPulse()` (jar identity/state and household display settings) with `getCurrentJarBudgets()`. The latter calls the read-only `get_plan_jar_budget_raw_inputs` RPC once on the current path. The SQL function returns raw household, jar, period, transaction, recurring-income, snapshot, loan-payment, and adjustment inputs. TypeScript in `get-current-jar-budgets.ts` maps those inputs and applies the shared `jar-budget.ts` calculations.

For each active jar, the model chooses configured qualifying income first, then recurring income, then qualifying posted income. A fixed rule uses its fixed amount; a percentage rule floors `qualifying income × basis points / 10,000`. The budget amount adds nonnegative rollover credit and the signed period adjustment, with a floor of zero. Spent is derived from the bounded period transaction set and the stored transaction `jar_id`, including reversal/correction semantics. Remaining is budget minus spent and can be negative when overspent. Current rules are used for the current month; historical months use frozen snapshots. Period boundaries use the household timezone and an exclusive end.

The read-only RPC is `SECURITY INVOKER`, has a fixed `search_path`, revokes public execute, and grants execute to `authenticated`. Its source definition is in `supabase/migrations/20260925145853_plan_personal_jar_expenses.sql`. No query plan or RLS-aware `EXPLAIN` was run because there is no repeatedly dominant query established by runtime evidence.

The overview obtains jar identity data twice in separate paths: pulse reads `jars`, while the budget RPC also returns jar inputs. The Jar Detail route adds a selected-jar query and an all-active-jars pulse query, while the budget RPC supplies metrics for all jars. These are overlapping read models, but each serves different display/action fields. No runtime count or latency proves the overlap is worth changing.

### Goals, contributions, and adjustments

Goal rows store target, type, status, and legacy funding fields. For linked goals, the authoritative funded amount/progress comes from active funding links and current Money source values: Savings, eligible accounts, investment holdings/valuations, loans, and liabilities. `goal-funding.ts` resolves source values and quality; payoff progress uses original principal snapshots and remaining principal. Unknown/missing/incomplete source values remain represented as quality states rather than silently becoming a fully trusted balance. For legacy unlinked intentions, the legacy funded amount is used.

Manual `contribute_to_goal` is a separate path for unlinked legacy goals: it checks the active-link count and calls the contribution RPC. Linked-goal progress is not recomputed from a client-side balance. Goal target/progress mapping is in `goal-recurring-types.ts`; no formula was changed.

Jar reallocation calls `reallocate_jar_capacity`; the database validates the selected period/source and writes signed `jar_period_adjustments` and the audit movement atomically. It is not a ledger transfer. Budget reads include those adjustments; the Plan screen must preserve that distinction.

## Jar and Goal Detail critical paths

### Jar Detail

`PlanJarDetailPage` starts `getJar(id)`, `listActiveJars()`, `getHouseholdPolicies()`, `listOpenInboxItems()`, `listJarCategories()`, and `getCurrentJarBudgets()` together after its gate. `getJar()` itself reads household settings and the selected jar in parallel. `listActiveJars()` goes through `getPlanPulse()` and reads household context plus the whole jar list. The budget RPC returns all jar raw inputs. Category mappings, policies, and inbox data support controls/attention, while the selected jar plus budget metrics supply identity and financial state. Because the page awaits the whole top-level `Promise.all`, those action/attention dependencies currently delay the header and primary financial card too.

`JarRecentActivity` is already placed under its own Suspense boundary. It requests at most four activities through `listTransactionEvents`; that loader uses bounded raw-row lookahead and a stable date/created/id cursor. It may fetch missing transfer/loan groups in two batched queries in parallel. It does not issue a query per rendered row. Activity is secondary and does not gate the initial jar card.

### Goal Detail

`getGoal(id)` loads the goal and all active household funding links in parallel, then enriches funding sources by source kind using batched ID sets. It is not an N+1 per linked source, but it can load source classes for the whole household because link rows are not narrowed to the selected goal before enrichment.

Only after that enriched selected-goal result arrives does the page start `listGoalFundingOptions()` and `listGoals()` in parallel. Those provide linkable sources and goal reassignment choices for controls. `listGoals()` reloads household goals and active links, then enriches them again; `listGoalFundingOptions()` separately reads source lists and active links. Neither is request-memoized at the exported query level. Since the page awaits both before returning, action-option data blocks header and progress rendering. No separate contribution-history query was found in this detail page.

This is a strong structural duplication candidate, not a measured performance bottleneck. The selected goal’s progress remains owned by the `getGoal()` funding read model.

## Create/Edit dependencies and draft behavior

| Flow                      | Current initial dependencies                                                                                                                                                                    | Form behavior                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Create/Edit Jar           | `/plan/jars` awaits the jar list, budget RPC, linked categories, and editable categories before rendering. Create/edit forms receive category and jar options, currency, and qualifying income. | `JarConfigurationForm` is mounted only while its sheet is open; closing unmounts the form. Edit defaults come from the selected jar. |
| Create Goal               | `/plan/goals` waits for both the goal list and `listGoalFundingOptions()`, even though the options are only used by the create form’s optional funding-source picker.                           | Closing resets name, target, type, date, source selection, and alert. Success may navigate to the new detail.                        |
| Edit/Contribute/Link Goal | Goal Detail waits for full funding options and listed goals before rendering controls.                                                                                                          | Edit and contribution cancel paths reset local values; no draft is stored across route navigation.                                   |
| Create Recurring          | `/plan/recurring` loads rules; create has no remote reference data.                                                                                                                             | Sheet fields render while open; close resets values.                                                                                 |
| Edit Recurring            | `/plan/recurring/[id]` loads only the selected rule plus household display settings.                                                                                                            | Edit is in place; no separate edit route.                                                                                            |

The current initial fields for jar/goal create can be understood without every action reference, but runtime timing is unavailable, so deferral is only a candidate. No form behavior was changed.

## Loading, data volume, and prefetch

Plan Overview uses a route skeleton plus nested section fallbacks. Jar Detail defers only recent activity locally. Goal Detail has a route loading fallback but no nested boundary for its post-goal action-option reads. The shared Product shell and bottom navigation are preserved by the layout. Static source shows reserved skeleton heights, but no browser measurement was made for CLS, header/nav stability, theme, keyboard focus, reduced motion, or content jumps.

The recent Jar activity list is capped at four activities and uses stable cursor logic internally. The Plan goal list, jar list, recurring list, and history-month selector have no explicit row pagination/limit in the inspected page queries. Linked-source reads are batch-by-kind rather than per row. No representative row counts or payload sizes were collected because that would require a safe authenticated household context.

`PRODUCT_LINK_PREFETCH` is false and is applied to bottom navigation, the shared top bar, Plan jar/goal cards, recurring rows, and several hub controls. Some Plan links omit the setting and therefore use the Next Link default behavior in production, including calendar month/event links, monthly-review links, some action links, and Jar Detail’s custom back link. This is a potential source of authenticated RSC prefetches/request bursts. No browser Network trace was captured to establish which links prefetched, whether a prefetch was duplicated by the selected navigation, or whether requests contended.

## Browser timing and HTTP attribution

| Transition               | Click → RSC | RSC headers/body | First useful financial content | Samples |
| ------------------------ | ----------: | ---------------: | -----------------------------: | ------: |
| Bottom Navigation → Plan | Unavailable |      Unavailable |                    Unavailable |       0 |
| Plan → Jar Detail        | Unavailable |      Unavailable |                    Unavailable |       0 |
| Jar Detail → app Back    | Unavailable |      Unavailable |                    Unavailable |       0 |
| Plan → Goal Detail       | Unavailable |      Unavailable |                    Unavailable |       0 |
| Goal Detail → app Back   | Unavailable |      Unavailable |                    Unavailable |       0 |
| Plan → Create            | Unavailable |      Unavailable |                    Unavailable |       0 |

No click timing, RSC response time, body completion, decoded bytes, useful-content marker, browser tail, p50/p75, or cold/warm samples are available. No request is attributed to SQL execution time. A future authenticated run needs a remediated credential, a dedicated safe browser context, existing records only, and request instrumentation that separates response headers, body completion, SDK completion, and local projection.

## Ranked opportunities

All five are **structural candidates without timing proof**. Ordering is based on directness to first useful content and potential scope, not measured impact.

1. **Plan Overview shared promise joins secondary attention/history work.** Affected route: `/plan`. Evidence: the shared `PlanHubData` promise awaits inbox enrichment and history months, then critical summary and jar sections await that same promise. Root cause: independent presentation/action reads are attached to the first-useful summary barrier. Improvement mechanism: let the current period/budget/jar read model render before inbox and past-month selector data. Risk: preserve the historical period selector, inbox banner semantics, and consistent source values while streaming.
2. **Goal Detail waits for action options and reloads overlapping goal/funding data.** Affected route: `/plan/goals/[id]`. Evidence: `getGoal()` finishes before `listGoalFundingOptions()` and `listGoals()` start; `listGoals()` reloads all active links and enriches sources. Improvement mechanism: isolate action-only reads and avoid rebuilding selected-goal data. Risk: funding permissions, source quality, and reassignment options must remain current and household-scoped.
3. **Jar Detail gates identity/metrics on action and attention reads, with overlapping jar reads.** Affected route: `/plan/jars/[id]`. Evidence: whole-page `Promise.all` includes policy, full inbox, categories, all-active-jars pulse, selected jar, and metrics. Improvement mechanism: render identity/metrics before action-only data and verify whether an all-jar fetch is necessary. Risk: no mutation/action may appear before its authorization and source options are ready; preserve period-scoped capacity meaning.
4. **Plan Next Links do not consistently apply the explicit prefetch policy.** Affected routes: hub, calendar, review, Jar Detail. Evidence: several Next Links omit `PRODUCT_LINK_PREFETCH`; the app-level constant documents that authenticated prefetches can contend for Supabase round trips. Improvement mechanism: first observe request traces, then scope any correction to proven links. Risk: changing prefetch can trade background work for click latency; no browser evidence currently identifies the offenders.
5. **List queries are unbounded by page-level limits.** Affected routes: Goals, Jars, Recurring, history-month options. Evidence: list queries order/read collection results without explicit pagination in these route models; Jar activity alone is explicitly capped. Improvement mechanism: only consider pagination if private-safe row counts show material growth. Risk: truncating goals/jars/history could hide financial intentions or available selection options.

No query is classified as a **proven runtime bottleneck**. Hosted-service latency floor, SQL execution time, row volume, payload size, duplicate RSC requests, and UI layout stability remain unmeasured.

## One Phase 1 candidate (conditional)

**Candidate:** Plan Overview progressive data readiness: keep the existing current-period budget/jar model authoritative, and allow the first useful current summary and jar rows to become available without waiting for full inbox enrichment and history-month options.

- **Scope:** `/plan` only. Separate the first-useful current summary dependency from attention/history-selector dependencies. Do not change formulas, RPCs, table access, other Plan routes, or mutation behavior.
- **Expected benefit:** remove source-proven independent work from the Plan summary barrier; runtime improvement is unknown until measured.
- **Financial invariants:** use `getCurrentJarBudgets()` and the existing period and jar identity model; retain the household gate; keep all current/historical figures from their existing authoritative paths; never treat jar envelope values as bank balance.
- **Verification:** after credential remediation, collect one cold-ish and ten warm Plan navigation samples in the safe Brave context. Record click, RSC start/headers/body, first useful summary+jar rows, section completion, decoded bytes, and browser tail. Compare current-period values and historical selection behavior against the baseline without fixture writes.
- **Rollback condition:** revert if current period/budget/jar rows are absent or inconsistent, historical selection changes meaning, attention content disappears, or first-useful timing does not improve beyond sample noise.

This is the single candidate to measure first, not authorization to start Phase 1. Runtime evidence is a prerequisite for deciding whether it is the highest-value optimization.

## Security and data-integrity constraints

- E2E password rotation is not confirmed; do not reuse the previously exposed password.
- `next.config.ts` currently disables development Server Function argument logging; keep that protection in place during any future local authentication.
- Do not run standard E2E setup for this audit; it creates Auth and financial records.
- The budget raw-input RPC is authenticated and `SECURITY INVOKER`; query/RLS performance has no EXPLAIN evidence.
- Request-local React caching preserves per-render reuse only. Never introduce cross-user or cross-household caching for Plan data.
- Keep budget, spending, rollover, adjustments, and linked Goal progress in their existing server-side financial authorities. No client-side financial authority or formula change is proposed.
- No authentication, write action, SQL mutation, fixture setup, or financial record inspection occurred in this Phase 0 pass.

## Validation

- Source review only; no tests or data queries were run.
- Browser benchmark and visual stability checks: unavailable because the credential-remediation gate is uncleared.
- Report formatting and `git diff --check` are checked after this file is written.

**PLAN INVESTIGATION INCONCLUSIVE — DO NOT START PHASE 1**
