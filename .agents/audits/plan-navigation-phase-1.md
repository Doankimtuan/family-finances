# Plan Performance Phase 1 — Progressive Overview Rendering

**Date:** 2026-10-11  
**Status:** Structural changes complete; runtime performance unverified.

## Previous dependency graph

```text
Session and membership gate
  └─ one PlanHubData promise
       ├─ Plan pulse
       ├─ current jar budgets
       ├─ history-month options
       ├─ Inbox items and enrichment
       ├─ translations
       └─ selected historical budget
            └─ Critical, Jars, Attention, Upcoming, shortcuts,
               allocation action, and tool destinations
```

Every consumer awaited the same resolver. Its `Promise.all` made the summary
and jar rows wait for Inbox enrichment and history-month options. Upcoming reads
did not begin until this shared promise resolved. Tool destinations had no
local Suspense boundary.

## New dependency graph

```text
Session and membership gate
  └─ period identity from authorized household context and request time
       ├─ shared financial promise
       │    ├─ current: pulse + one current-budget read
       │    └─ historical: selected frozen budget history only
       │         ├─ Critical Summary
       │         └─ Jar Rows
       ├─ Inbox items and enrichment ── Attention + financial metrics
       ├─ history-month options ──────── nested period-selector boundary
       ├─ current-only upcoming read ─── Upcoming
       ├─ allocation action
       ├─ tool destinations
       └─ shortcuts
```

The household period identity is the routing prerequisite for choosing the
current or historical branch. After it resolves, secondary reads run without
awaiting the financial promise. Summary and jars still share the same financial
promise, so their period and metrics cannot drift.

## Financial invariants

- Current requests use the existing `getPlanPulse()` and one
  `getCurrentJarBudgets(requestTime)` call. The two visible financial sections
  receive the same promise.
- Existing `summarizeJarBudgets()` and `JarBudgetMetrics` results are passed
  through. Income, currency, allocation mode, active jars, spending, remaining
  amounts, and overspending semantics are unchanged.
- Historical requests call `getPlanBudgetHistory()` for the selected month and
  do not start current pulse or current-budget reads. Missing history remains
  explicitly unavailable; current metrics are never used as a fallback.
- Inbox attention still uses its existing bounded query, enrichment, statuses,
  banner, and overspending action. An unavailable Inbox result does not delay
  or hide valid financial content.

## Household timezone

Before Phase 1, the page compared `?month=` against
`currentPeriodMonth()` using the default `Asia/Ho_Chi_Minh` timezone. It now
classifies the requested month using the authorized household timezone from
`getHomeHouseholdContext()`, with the existing Vietnam default only when the
context has no timezone. One request timestamp is passed to period
classification, the current budget read, history reconstruction, and history
option calculation.

The deterministic route tests cover current and historical selections, a month
boundary where UTC differs from Vietnam, an invalid month, and a future month.
The boundary test confirms the selected October period is current in UTC even
though it is already November in Vietnam.

## Request topology and authorization

- Period classification runs after the existing user and active-membership
  checks. All read helpers retain their household authorization and RLS paths.
- The page calls the current budget helper once on the current branch. The
  existing RPC shape is unchanged; no database, RPC, policy, or write path was
  modified.
- The period timezone and currency are passed into the existing history and
  history-month helpers, avoiding additional household-settings reads. Those
  helpers retain their own authorization checks.
- Upcoming uses the existing `listPlanHubUpcomingEvents()` helper once on the
  current branch and is skipped for historical periods. It adds no recurring,
  loan, card, liability, or schedule reads.
- Inbox and history options have their own promises. No browser-side budget
  fetching or cross-request financial cache was introduced.

## Suspense and streaming evidence

- Summary and jars retain their respective reserved fallbacks and resolve from
  one financially consistent promise.
- The period selector has an inner skeleton boundary. It receives the selected
  period from the financial result, so it shows no incorrect month while
  history options are pending. If options are unavailable, current and
  selected-period options remain available and the existing disabled state is
  retained.
- Attention and Upcoming remain in their own boundaries. Allocation, history
  badge, shortcuts, and tool destinations use only period identity; tool
  destinations now have a boundary so they cannot suspend the page shell.
- **Source-level independence:** verified by the dependency graph and component
  inputs.
- **Promise/component-level independence:** verified with controllable deferred
  promises. Summary and jars resolve while Inbox or selector options remain
  pending; both wait together for the shared budget; Upcoming resolves while
  that budget is pending.
- **Actual RSC chunk/browser reveal:** not verified. The repository has no
  authenticated Plan response harness, and the documented credential gate
  prevents safe authenticated browser access. Promise tests are not presented
  as proof of streamed HTML or browser timing.

## Validation

- Focused Plan suite: 7 files, 43 tests passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- Targeted Prettier check and `git diff --check`: passed.
- `npm run build`: passed; all 111 static pages generated.
- Full `npm run test`: 262 of 265 files passed; 1,821 of 1,826 tests passed.
  The five failures are outside this change: English/Vietnamese key parity is
  missing `money.savingsPage.summaryCaption`; Money privacy expects
  `break-words` but renders `truncate`; and three Phase 6 account-presentation
  tests lack `NextIntlClientProvider`.
- E2E and browser validation were not run under the credential gate below.

## Runtime limitation

The previously exposed E2E password is still unrotated. No login was attempted,
and Playwright global setup was not run because it writes fixtures to the shared
hosted Supabase database. `logging.serverFunctions = false` remains enabled in
the existing workspace configuration. No authenticated browser timings or
390/440/768/1280 viewport, theme, focus, or reduced-motion evidence was
collected. No performance improvement is claimed.

**PLAN PHASE 1 STRUCTURALLY COMPLETE — RUNTIME PERFORMANCE UNVERIFIED**
