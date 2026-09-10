# Phase 10 — Goals content audit

Presentation-only. Domain, APIs, queries, mutations, and goal progress algorithms were inspected and left unchanged.

## Canonical routes (from `APP_PATH` / path builders)

| Route | Builder | Role |
| --- | --- | --- |
| `/plan` | `APP_PATH.PLAN` | Plan hub. Compact goal entries + view-all. |
| `/plan/goals` | `APP_PATH.PLAN_GOALS` | Goals list (this phase) |
| `/plan/goals/[id]` | `planGoalPath(id)` | Goal detail (this phase) |

No extra Goals tab. Goals stay under Plan.

## Current Goal IA (after this phase)

1. `TopAppBar` — title, intention subtitle, back to Plan, `PlanPrivacyToggle`
2. Concise list context (Goals are intentions; linked products stay in Money)
3. Empty state **or**
   - Active/open goals (`ACTIVE` / `PAUSED` / `READY`) as scan-first rows
   - Completed/cancelled behind `PlanDisclosure`
4. Existing create action

Detail:

1. `TopAppBar` — identity, back to list
2. Teaching alert: not a bank balance
3. Intention hero (`plan-goal-hero`) — existing progress percent or indeterminate copy
4. Funded amount only when the existing model has something to show (`progressPercent != null` **or** `fundedAmount > 0`). Missing progress is not replaced with 0%.
5. Target + status + type + date
6. Linked source summary when `fundingSummary` already exists
7. Existing contribute / edit / archive / funding-link controls

## Existing Goal fields (unchanged)

From `PlanGoal` / `GoalDetail`:

- `id`, `name`, `targetAmount`, `fundedAmount`, `targetDate`, `status`, `goalType`
- `fundingLinks[]` — existing `kind`, `sourceId`, `sourceName`, `currentAmount`, `valueStatus`, `availability`
- `backingState`, `fundingValueStatus`, `fundingSummary`, `isLegacyIntention`
- `progressPercent: number | null` — already computed in the read model (`calculateGoalProgressPercent` when linked). UI does not invent a ratio.

Types: `SAVE_UP`, `INVEST`, `PAYOFF`. Statuses include `ACTIVE`, `PAUSED`, `READY`, `COMPLETED`, `CANCELLED`.

## Progress semantics (preserved)

- Progress is intention toward the named goal, not household cash.
- `progressPercent == null` stays indeterminate (`progressIndeterminate` / funding quality copy). Never coerced to 0.
- Funded / target remain `FinancialNumberKind.INTENTION`.
- No time-to-goal, projected completion, or contribution advice was added.

## Linked financial sources (preserved)

Existing links only:

- Savings / savings account / holding → Money products
- Loan / debt → Money liabilities (`GoalType.PAYOFF`)

Presentation:

- List: “Linked to {source}” when a link exists
- Detail summary: PAYOFF principals use `CURRENT_STATE`; investment market/gain use `ESTIMATE`; goal funded/target stay `INTENTION`
- Copy: the Goal tracks an existing Money source; it does not own that cash or asset

No new source links. No “Goal balance = Savings balance” wording.

## Existing actions (unchanged payloads)

- `createGoalAction`, `updateGoalAction`
- `contributeToGoalAction` (legacy intention contribute — presentation clarified, mutation unchanged)
- `linkGoalFundingAction` and existing reassignment/archive flows

Sheets still use `Sheet` / `ActionSheetLayout` / `SheetActionFooter`. Create remains ephemeral on close.

## Current UX issues this phase addressed

- List density / card soup
- Progress could be misread as an account
- Linked Money values needed their original number kinds
- Empty copy could sound like “create an account”
- Contribute / create needed a clearer “intention, not a transfer” frame

## Proposed / implemented hierarchy

Goal name → funded (intention) → target → linked source or status → existing progress bar only when `progressPercent` is present.
