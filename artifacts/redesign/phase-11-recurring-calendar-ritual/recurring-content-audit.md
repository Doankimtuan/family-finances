# Phase 11 — Recurring content audit

## Canonical route

| Surface | Path | Builder |
| --- | --- | --- |
| List | `/plan/recurring` | `APP_PATH.PLAN_RECURRING` |
| Detail | `/plan/recurring/[id]` | `planRecurringPath(id)` |

Discovered from `modules/shared-kernel/app-path.ts` (re-exported by `modules/tenancy/application/app-path.ts`). Not assumed from the prompt.

Back navigation: list → Plan (`APP_PATH.PLAN`); detail → list (`APP_PATH.PLAN_RECURRING`).

## Current IA (implemented)

1. `TopAppBar` `DETAIL` — title, subtitle, back to Plan, `PlanPrivacyToggle`
2. Concise list context (`listContext`) + existing income-placement mode label
3. Active repeating items (`plan-recurring-active`)
4. Paused repeating items (`plan-recurring-paused`), behind `PlanDisclosure` when any exist
5. Shared `EmptyState` when there are no rules
6. Existing create action (`CreateRecurringForm` Sheet)

Scan-first rows (`PLAN_DESTINATION_ROW_CLASS`, `min-h-14`) — not inventory cards.

Row priority:

1. Identity (name + direction icon)
2. Planned amount (`FinancialNumberKind.INTENTION`)
3. Cadence (direction · frequency)
4. Next occurrence (`nextRunDate` via `formatDate` + `HOUSEHOLD_TIMEZONE.VIETNAM`)
5. Status (`StatusBadge` Active / Paused)

## Recurrence semantics (existing model)

`PlanRecurring` from `listRecurring` / `getRecurring`. Amount is the **planned/expected commitment** on the rule. It is not:

- current account balance
- available cash
- actual spending
- a guaranteed future expense

UI labels it as planned (`plannedAmountLabel`, `amountHint`, `listContext`) and marks `INTENTION`.

Cadence values actually supported: `RecurringFrequency.WEEKLY` and `RecurringFrequency.MONTHLY` only. No yearly/custom rule was added.

Preserved fields: `startDate`, `nextRunDate`, `frequency`, `intervalCount`, `dayOfMonth`, `dayOfWeek`, `isActive`.

`nextRunDate` is the existing next-occurrence fact. List sorts within each group by that date, then name (`sortRecurringByNextRun`). Sorting is presentation-only.

## Lifecycle

Existing boolean `isActive`. There is no archive state.

- Active vs paused grouping on the list
- Detail checkbox still submits `isActive` on `updateRecurringAction`
- Delete exists via `deleteRecurringAction` (separated from save)

No new lifecycle states.

## Actions (unchanged payloads)

| Action | Function | Notes |
| --- | --- | --- |
| Create | `createRecurringAction` | Same fields, `intervalCount: 1`, `isActive: true` |
| Update | `updateRecurringAction` | Same fields including `isActive` |
| Delete | `deleteRecurringAction` | `{ ruleId }` |

Create still uses local `useState` (not rewritten to RHF). Closing the Sheet still resets.

## Current UX issues (pre-redesign)

- Fields competed equally on list/detail
- Cadence/next run were harder to scan than identity + amount
- Weekday labels were developer-facing (`0=Sun` style) rather than locale weekday names
- Paused rules mixed with active without progressive disclosure

## Proposed / implemented hierarchy

See “Current IA” above. Detail:

1. `TopAppBar`
2. Identity + status
3. Planned amount (`INTENTION`)
4. Cadence + next occurrence + start
5. Existing grouped edit form (identity / cadence / schedule)
6. Existing save + separated delete

No forecast chart. No annual/monthly totals invented.
