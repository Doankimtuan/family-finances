# Phase 9 — Plan content audit

Presentation-only. Domain, APIs, queries, mutations, and planning algorithms were inspected and left unchanged. Hũ list/detail and Goal list/detail were not redesigned (Phase 10). Recurring editor, Calendar navigation, and Ritual flow were not redesigned (Phase 11).

## Canonical routes (from `APP_PATH` / path builders)

Discovered in `modules/shared-kernel/app-path.ts` and re-exported from `modules/tenancy/application/app-path.ts`. Do not assume design-doc aliases.

| Route | Builder | Role |
| --- | --- | --- |
| `/plan` | `APP_PATH.PLAN` | Plan hub (this phase) |
| `/plan/jars` | `APP_PATH.PLAN_JARS` | Hũ list |
| `/plan/jars/[id]` | `planJarPath(id)` | Hũ detail |
| `/plan/goals` | `APP_PATH.PLAN_GOALS` | Goals list |
| `/plan/goals/[id]` | `planGoalPath(id)` | Goal detail |
| `/plan/recurring` | `APP_PATH.PLAN_RECURRING` | Recurring list |
| `/plan/recurring/[id]` | `planRecurringPath(id)` | Recurring detail |
| `/plan/calendar` | `APP_PATH.PLAN_CALENDAR` | Household calendar (`PLAN_MONTH_QUERY = "month"`) |
| `/plan/ritual` | `APP_PATH.PLAN_RITUAL` | Monthly Review |

There is already one Plan hub. No Budget / Goals / Hũ / Calendar / Reports tab was added. Five product tabs remain Home · Money · Plan · Inbox · Together.

## Current Plan IA

Plan is the third bottom-tab destination. Child surfaces stay under `/plan/*`. The hub already composed:

- period pulse / health
- exceptions (attention)
- recommendations from `getPlanRecommendations`
- 7-day upcoming preview (`listPlanHubUpcomingEvents`)
- compact Hũ and Goal entries
- Recurring / Calendar / Ritual destinations
- teaching copy + Money link

This phase reordered and restyled that composition. It did not add routes or extra queries on the hub.

## Planning concepts (existing)

| Concept | Existing meaning | Hub source |
| --- | --- | --- |
| Period | Current jar-budget month (`periodMonth` / `currentPeriodMonth()`) | Pulse + jar budgets |
| Assist mode | `PlanAssistMode` from ritual `RitualMode` | Pulse |
| Health | `resolvePlanHomeHealth` — healthy / attention / off-track / no plan | Existing helper |
| Exceptions | `collectPlanHomeExceptions` + allocation + goal-backing | Existing helper |
| Recommendations | `getPlanRecommendations` (existing engine, existing limit) | Existing helper |
| Hũ | Intention envelope; remaining/over-by is budget vs plan, not cash | `getCurrentJarBudgets` |
| Period income | Qualifying income used to run jar rules — not spendable cash | `currentJarBudgets.periodIncome` |
| Goals | Intention; funded/target from existing goal read model | `listGoals` |
| Upcoming | Existing 7-day preview, not the full calendar graph | `listPlanHubUpcomingEvents` |
| Recurring / Calendar / Ritual | Owned by child routes | Hub entry rows only |

Hub still loads (unchanged): `getPlanPulse`, `getCurrentJarBudgets`, `listOpenInboxItems`, `listGoals`, `listPlanHubUpcomingEvents`. It does **not** call `getMonthlyReview`, `getHouseholdCalendar`, or `listRecurring`.

## Hũ relationship

Hũ is an intention envelope (English Jar / Vietnamese Hũ). Remaining / over-by amounts come from `JarBudgetMetrics` (`remainingAmount`, `JarBudgetState`). They describe how the **plan** is tracking, not money stored in the jar.

- Overspent → “over by …”
- No income / no budget → “set income” / not available
- Otherwise → “remaining …”

`data-financial-object="jar"` and `FinancialNumberKind.INTENTION` mark these values. Teaching copy still says jars are not bank balance. Money remains the cash/account surface (`APP_PATH.MONEY`).

List/detail/create/reallocate sheets were not changed. No cash-transfer metaphor was added.

## Goal relationship

Goals stay intention. Hub shows active/ready goals only (`GoalStatus.ACTIVE` / `READY`), sorted by existing target date then progress, capped at `PLAN_HUB_VISIBLE_GOAL_LIMIT` (3). Progress uses existing `fundedAmount` / `targetAmount` / `progressPercent`. Indeterminate progress keeps the existing “linked funding value is not available yet” copy rather than fabricating 0%.

Legacy vs linked funding (`isLegacyIntention`) is preserved as meta. Missing backing still becomes a `GOAL_BACKING` exception. Linked savings/investment/debt sources are not reinterpreted as Plan-owned cash.

Goal list/detail/contribute were not redesigned.

## Recurring relationship

Recurring belongs to Plan. The hub keeps a compact destination row to `APP_PATH.PLAN_RECURRING`. Recommendation actions that target a recurring entity now resolve through `planRecurringPath` (same destination, no new algorithm). Full recurring editor is Phase 11. No monthly forecast total was invented.

## Calendar relationship

Calendar is a planning tool. The hub shows:

- a 7-day upcoming preview from the existing hub query
- a “View calendar” section action
- a workspace row to `APP_PATH.PLAN_CALENDAR`

Amounts on upcoming events are `FinancialNumberKind.INTENTION`. Due vs expected uses existing `CalendarEventSource`. Full calendar navigation is Phase 11. No new date math or cash-flow forecast was added.

## Review / Ritual relationship

Monthly Review lives at `APP_PATH.PLAN_RITUAL`. The hub presents it as a finishable planning activity (“Review the month and mark it done” / “Xem lại tháng và đánh dấu đã xong”), not a report or dashboard. Ritual lock/approve flow was not redesigned.

## Existing financial semantics (preserved)

| Value | Kind | Must not be read as |
| --- | --- | --- |
| Period income base | Intention (qualifying income for jar rules) | Spendable cash / Free to Spend |
| Hũ remaining / over-by | Intention (budget vs plan) | Cash in the jar |
| Goal funded / target | Intention (existing progress) | Account balance |
| Upcoming event amount | Intention (planned / due) | Cleared cash |
| Account / savings / investment / loan / debt | Money domain | Not duplicated as a Plan hero |

No Plan cash hero. No sum of goals. No assignable-cash calculation. No Net Worth / Reports / Total Money / Free to Spend / Ready to Assign / Age of Money / YNAB category grid.

## Current UX problems (before this phase)

1. Hub read like a secondary Money dashboard: pulse + jar cards + progress cards stacked without a decision hierarchy.
2. Period income could be read as cash (“qualifying income”) rather than the base used to plan.
3. Hũ subtitle talked about allocation targets / onboard restore, not “intended for, not cash.”
4. Attention was easy to miss; empty attention had no explicit “nothing to decide” state.
5. Recommendations were a list, not one primary decision plus supporting work.
6. Calendar had a section CTA but no workspace entry next to Recurring / Ritual.
7. Full `JarCard` / goal progress cards on the hub competed with Phase 10 depth.

## Proposed hierarchy (implemented)

1. `TopAppBar` — Plan + intention subtitle
2. Planning context (`PlanHubHero`) — period caption (not a giant money number), health question with icon + title + body, quiet jar/allocation meta, income base as intention
3. Attention (`PlanHubExceptions`) — always present; empty copy when nothing needs a decision
4. One primary recommendation (`HIGHLIGHTED`) + supporting list
5. Upcoming intention/commitment preview
6. Compact Hũ / Goal planning rows (`PlanHubWorkRow`)
7. Secondary planning tools: Recurring, Calendar, Monthly Review
8. Teaching + Money link (existing bank-balance teaching preserved)

No FAB: Plan had no high-frequency global create on the hub; none was invented.

## Concepts deferred

### Phase 10 — Hũ + Goals

- Hũ list/detail/create/edit/reallocate/archive
- Goal list/detail/contribute/edit
- Deep progress presentation, funding-source UX, jar lifecycle

### Phase 11 — Recurring + Calendar + Ritual

- Recurring editor
- Full calendar navigation / month control
- Ritual preview → approve → lock

### Not in Plan

- Money accounts, savings, investments, loans, debts, transactions
- Inbox as a sixth tab (uncategorized exceptions still deep-link to Inbox)
- Health (secondary, not a tab)
