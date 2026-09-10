# Phase 11 — Implementation notes

**Status:** Presentation implemented. Browser validation is incomplete (login hydration never enabled submit). Does not overwrite `.agents/design-system.md`. Next phase is Inbox — not started.

## What this phase did

Make Recurring, Calendar, and Ritual answer:

> What is coming up, what repeats, and what should we review or decide next?

without turning Plan into a forecast engine, report, or second Money.

## Files changed (this phase)

### Recurring

- `app/[locale]/(product)/plan/recurring/page.tsx`
- `app/[locale]/(product)/plan/recurring/plan-recurring-row.tsx`
- `app/[locale]/(product)/plan/recurring/recurring-presentations.ts` **new**
- `app/[locale]/(product)/plan/recurring/create-recurring-form.tsx`
- `app/[locale]/(product)/plan/recurring/[id]/page.tsx`
- `app/[locale]/(product)/plan/recurring/[id]/recurring-detail-form.tsx`
- `app/[locale]/(product)/plan/recurring/[id]/loading.tsx`

### Calendar

- `app/[locale]/(product)/plan/calendar/page.tsx`
- `app/[locale]/(product)/plan/calendar/calendar-view.tsx`
- `app/[locale]/(product)/plan/calendar/calendar-month-frame.tsx`
- `app/[locale]/(product)/plan/calendar/calendar-presentations.ts` **new**
- `app/[locale]/(product)/plan/calendar/loading.tsx`

Not changed: `calendar-navigation.ts` (date math).

### Ritual

- `app/[locale]/(product)/plan/ritual/page.tsx`
- `app/[locale]/(product)/plan/ritual/monthly-review.tsx`
- `app/[locale]/(product)/plan/ritual/ritual-presentations.ts` **new**

Not changed: `monthly-review-actions.tsx`, `actions-review.ts` (mutation payloads).

### Shared

- `modules/shared-kernel/app-path.ts` — `planRitualPath` (same `PLAN_MONTH_QUERY` as calendar)
- `messages/en/plan.json` / `messages/vi/plan.json`

### Tests

- `tests/unit/phase-11-recurring-calendar-ritual.test.tsx` **new**
- `tests/unit/plan-calendar-view.test.tsx`

Plan hub destination rows (`plan-entry-recurring`, `plan-workspace-calendar`, `plan-ritual-open`) were left as Phase 9 entries. Hub still does **not** call `listRecurring` / `getHouseholdCalendar` / `getMonthlyReview`.

## Shared components reused

`TopAppBar`, `Page`, `Section`, `Card`, `EmptyState`, `ErrorState`/`PlanUnavailable`, `StatusBadge`, `StatusAlert`, `Amount`, `FinancialValue`, `Progress`, `PlanPrivacyToggle`, `Sheet`, `ActionSheetLayout`, `SheetActionFooter`, `ChoiceTile`, `AmountField`, `TextField`, `BottomActionBar`, `SectionHeader`, `AppIcon`, `IconContainer`, `formatCurrency` / `formatDate`, `weekStartDayForLocale` / `WEEKDAY_KEYS_BY_UTC_DAY`.

## Local components

- `PlanRecurringRow` — scan-first list row
- `recurring-presentations.ts` — partition/sort/weekday helpers
- `calendar-presentations.ts` — source → icon/tone/kind
- `ritual-presentations.ts` — cash-flow fact list, review helpers, `goalBackingCopyKey`
- `planRitualPath` — month query helper only

## Date / number semantics

| Surface | Kind | Notes |
| --- | --- | --- |
| Recurring amount | `INTENTION` | Planned commitment |
| Calendar recurring event | `INTENTION` | Same rule amount |
| Calendar card/loan/debt/payoff | `CURRENT_STATE` | Money-origin events |
| Review cash flow | `MOVEMENT` | Recorded facts |
| Review jar remaining/budget | `INTENTION` | Plan envelopes |
| Review goal funded/target | `INTENTION` | Existing goal semantics |

## Privacy

Reuse `PlanPrivacyToggle` → `FinancialPrivacyToggle`. Amounts wrap `FinancialValue`. Progress uses `privacyAware`. Focused tests assert recurring amounts mask while name/status remain.

## i18n

EN/VI updated for recurrence terminology, weekday names (`weekdayNames.sun` …), calendar empty/this-month/period context, monthly-review question language. No hardcoded English month/day names in UI. Recurring weekday tiles use `WEEKDAY_KEYS_BY_UTC_DAY` (stored value still 0–6).

Unused `startingBalance*` / `deficitClear*` keys left in JSON to avoid an unrelated i18n sweep.

## Tests

Focused only (24 passed):

- `tests/unit/phase-11-recurring-calendar-ritual.test.tsx`
- `tests/unit/plan-calendar-view.test.tsx`
- `tests/unit/plan-calendar-loading-parity.test.tsx`
- `tests/unit/recurring-detail-form.test.tsx`
- `tests/unit/financial-privacy.test.tsx`
- `tests/unit/plan-hub-progressive-disclosure.test.tsx`

Full unit suite not run.

## Typecheck

`npx tsc --noEmit` — pass.

## Lint

ESLint on the Phase 11 touch set — pass.

## Contract audit

- Database / API / queries / calculations / domain models / validation / auth: unchanged in this phase
- `planRitualPath` does not change routes or query names
- Recurring create/update/delete payloads unchanged
- Calendar month query unchanged
- Five tabs unchanged
- 440px shell unchanged
- No fake data

`GoalFundingSourceType` in `plan-constants.ts` belongs to Phase 10, not this phase.

## Conflicts (not resolved by changing calculations)

1. Calendar read model still computes `startingBalance` + `deficitDates`. UI no longer heroes starting balance; deficit warning remains when flagged.
2. `/plan/ritual` is Monthly Review, not `getMonthRitual` lock/approve.
3. Recurring create remains local `useState`, not RHF.

## Refactor review

- Source → presentation uses `Record<CalendarEventSource, …>` instead of a switch
- Recurring partition uses one pass + `toSorted`
- `goalBackingCopyKey` replaces nested backing ternary
- `RecurringTranslator` is a narrow next-intl workaround (same pattern as other Plan pages)
- Issue kind strings stay on the existing `MonthlyReview` type
- No new financial calculations, no duplicate privacy/date systems
