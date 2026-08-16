# PLAN 12 — Pre-edit Plan V2 Architecture Map

This map records the implementation surface inspected before Plan 12 edits. It is an audit artifact, not a new product specification.

## Authoritative application layers

| Concern | Current authoritative implementation | Runtime consumers | Plan 12 disposition |
| --- | --- | --- | --- |
| Jar rule and period budget math | `modules/plan/application/jar-budget.ts` | current Jar budget query, home health, recommendations, Jar UI | Keep as the single engine; remove any competing live reads of `capacity_delta`. |
| Rollover and period adjustments | `modules/plan/application/jar-rollover.ts`, `jar-budget.ts`, `jar_period_adjustments` | current-budget query and reallocation command | Preserve period snapshots/adjustments; verify timezone and historical immutability. |
| Goal funding/progress | `modules/plan/application/goal-funding.ts` | goals queries, goal detail, recommendations | Keep Money/Savings/Investment/Debt-derived funding as V2 source of truth; isolate legacy manual fields. |
| Goal actions and source reassignment | `commands/goal-actions.ts`, `commands/link-goal-funding.ts` | Goal detail actions | Preserve atomic RPC boundaries and active-link exclusivity. |
| Monthly Review | `queries/get-monthly-review.ts`, `app/.../ritual/monthly-review.tsx`, `actions-review.ts` | `/plan/ritual` | Make review path authoritative; retain old ritual storage only as a compatibility adapter. |
| Legacy ritual compatibility | `commands/month-ritual.ts`, `queries/get-month-ritual.ts`, `ritual-types.ts`, `run-month-ritual-autolock.ts` | legacy route/actions and historical rows | Deprecate and ensure no V2 route depends on lock semantics. |
| Assisted recommendations | `plan-recommendations.ts` | Plan Home and Monthly Review | Keep as the only ranking engine; `assisted-suggestions.ts` may remain a thin adapter. |

## Route surface

The product Plan routes are under `app/[locale]/(product)/plan`. The technical `/plan/ritual` path currently hosts the Monthly Review UI. Jar, Goal, recurring, calendar, and Plan Home routes remain in place and should be smoke-tested without route redesign.

## Data and migration surface

The committed V1 Plan migrations create jars, jar plans, goals, recurring rules, month ritual rows, movements, and legacy fields. The local Plan V2 migration sequence currently contains eight files dated from `20260816150000` through `20260816210000`. The migration audit must confirm that each file only depends on objects created by earlier committed migrations or an earlier V2 file, and that overlapping Review migrations are complementary.

## Cross-domain dependencies

Plan reads Money transactions and account/ledger semantics for posted income and Jar spend; Savings, Investments, Loans/Debts provide Goal funding sources; Categories provide historical Jar routing; Recurring provides qualifying-income fallback and expected activity; Inbox remains responsible for uncategorized triage. Plan must not create Money transactions for Jar reallocation, Goal linking/reassignment, Review marking, or Assisted recommendations.

## Initial legacy findings

Static search before edits found active references to `approveMonthRitual`, `pending_review`, `Quick Close`, `auto-lock`, `capacity_delta`, `funded_amount`, `goal_contributions`, and `contributeToGoal`. Some are historical compatibility or migration references, but the current review/ritual command surface still contains lock-oriented branches and silent catches that require isolation or cleanup. `getPlanRecommendations()` is already present and `buildAssistedSuggestions()` delegates to it, so duplicate ranking logic should not be reintroduced.

## Initial migration risks

The V2 rollover migration uses `timezone('utc', now())` when converting `capacity_delta` to the current period, while the application period helper uses household-local time. The migration should use the household timezone already stored on `households` (currently constrained by tenancy preferences) or explicitly document the controlled UTC policy. Review and snapshot migrations must be checked for duplicate columns/indexes and for ordering assumptions. Physical legacy columns should remain unless a safe removal migration is justified.
