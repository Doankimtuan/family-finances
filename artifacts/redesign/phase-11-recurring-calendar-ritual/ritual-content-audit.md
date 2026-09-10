# Phase 11 — Ritual / Monthly Review content audit

## Canonical route

| Surface | Path | Query |
| --- | --- | --- |
| Ritual page | `/plan/ritual` | optional `PLAN_MONTH_QUERY` (`month`) |

The live page is **Monthly Review** (`getMonthlyReview` → `MonthlyReviewReport`). Test ids preserved: `plan-ritual-page`, `monthly-review-report`.

`planRitualPath(month?)` was added next to `planCalendarPath`. Same query name. Navigation semantics unchanged (still `/plan/ritual?month=`).

## Conflict: Month Ritual vs Monthly Review

Domain also has `getMonthRitual` (Assisted preview → approve → lock). That flow is **not** the current `/plan/ritual` UI.

Leftover i18n under `plan.ritual` still describes lock/approve copy. This phase did not invent a lock wizard and did not switch the page to that query.

Redesign target: Monthly Review only.

## Review model (existing)

`getMonthlyReview(period?)` returns facts already computed:

- `review.state`: `MonthlyReviewStatus.NOT_STARTED` | `VIEWED` | `MARKED_REVIEWED`
- `cashFlow` (income, expenses, savingsAdded, netInvested, debtPrincipalReduced, netCashFlow, activityCount)
- `jars`, `goals`, `issues`, `changes`, `recommendations`
- `assistMode` (`PlanAssistMode`)
- `periodMonth`, `currentPeriodMonth`, `isCurrentPeriod`

No new questions, scores, or insights.

## Review states

| State | Presentation |
| --- | --- |
| Not started | `MonthlyReviewActions` still calls existing `markMonthlyReviewViewed` on mount |
| Viewed / not marked | Badge “Not marked reviewed”; primary action `markMonthlyReviewReviewed` |
| Marked reviewed | Badge “Reviewed” + success copy; no gamification |

Primary decision remains mark-reviewed. Snapshot payload unchanged (`capturedAt`, cashFlow, jars, goals).

## Questions (copy over existing facts)

Not a new analysis engine. Two copy branches over existing `issues`:

- Issues present → “What should we look at together?”
- No issues → “Ready to finish this review?”

Issues still use existing kinds (`uncategorized`, `overspent_jar`, `goal_backing`, missing income). Links still go to Money transactions, Goals, or Jars.

## Existing facts (contextual evidence)

Presented after the question, as evidence, not a dashboard:

- Compact cash-flow **rows** (`monthly-review-cash-flow`) — `FinancialNumberKind.MOVEMENT` (recorded Money facts)
- Jars — intention remaining/budget + existing `Progress`
- Goals — existing funded/target + backing copy (`goalBackingCopyKey`)
- Month-over-month `changes` when the model provides them
- Existing `RecommendationList` when `assistMode` is assisted — **not** `RecommendationListVariant.SUPPORTING`

No metric-card grid (`tone="metric"` removed). No health score. No XP/badges.

## Current UX issues (pre-redesign)

- Cash-flow metric cards made the page feel like a report
- Question/decision sat below a wall of numbers
- Month links were easy to miss
- Copy did not make “finish this review” the job

## Proposed / implemented hierarchy

1. `TopAppBar` `DETAIL` + privacy
2. Review context (period, current vs historical, prev/next via `planRitualPath`)
3. Review state badge
4. One review question
5. Existing issues (if any)
6. Recorded facts (cash flow, jars, goals, changes)
7. Existing recommendations (assisted only)
8. One primary action (`MonthlyReviewActions` in `BottomActionBar`)

Month next is still blocked when `nextMonth > currentPeriodMonth` (existing rule).
