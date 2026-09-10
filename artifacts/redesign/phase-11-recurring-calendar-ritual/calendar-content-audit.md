# Phase 11 — Calendar content audit

## Canonical route

| Surface | Path | Query |
| --- | --- | --- |
| Calendar | `/plan/calendar` | `PLAN_MONTH_QUERY` = `"month"` via `planCalendarPath(month?)` |

`searchParams` type is `Partial<Record<typeof PLAN_MONTH_QUERY, string>>`. Invalid/missing month falls back to `currentPeriodMonth()`. Regex still accepts `YYYY-MM` or `YYYY-MM-DD` and normalizes to `YYYY-MM-01`.

Date math stays in existing `calendar-navigation.ts` (`parseAnchorMonth`, `shiftPeriodMonth`, `calendarMonthCells`, `daysInUtcMonth`). This file was **not** changed.

Week start: `weekStartDayForLocale` (EN Sunday-first, VI Monday-first). Unchanged.

## Date behavior

- Month heading and day labels: `formatDate` with `timeZone: "UTC"` (calendar period is a UTC month key)
- Recurring next-run on the Recurring surface uses Vietnam household timezone; Calendar dates stay on the existing UTC month grid
- Previous / next: `planCalendarPath(shiftPeriodMonth(anchor, ±1))`
- This month: `planCalendarPath()` (no query) when the viewed period is not current
- Selected day: client state; defaults to today when the viewed month is the current UTC month, otherwise day 1
- `aria-pressed` on the selected cell; `aria-current="date"` on today
- Day cells remain buttons because the existing interaction model selects a day to show its events. Empty filler cells are not interactive.

Nav controls use `min-h-11` / `min-w-11` (≥44px).

## Event types (existing only)

`CalendarEventSource`:

| Source | Origin | Amount kind in UI |
| --- | --- | --- |
| `recurring` | Plan commitment | `INTENTION` |
| `card_due` | Money card due | `CURRENT_STATE` |
| `loan` | Money loan | `CURRENT_STATE` |
| `liability` | Money debt | `CURRENT_STATE` |
| `payoff_milestone` | Money loan payoff milestone | `CURRENT_STATE` |

No synthesized event types. Source copy uses `plan.calendar.sources.*`. Icon + text, not color alone. Milestone days also get a diamond marker (`aria-hidden`) plus accessible name text (`milestoneBadge`).

Links:

- Recurring → `planRecurringPath`
- Card → `moneyAccountPath`
- Loan / payoff → `moneyLoanPath`
- Liability → `moneyDebtPath`
- Payoff celebration (existing) may link Inbox / Plan jars

## Event sources vs forecast (conflict, not “fixed”)

`getHouseholdCalendar` still returns `startingBalance`, `deficitDates`, and related forecast fields from `buildCashFlowForecast`. **The query was not changed.**

Presentation conflict:

- Do **not** lead with a cash hero or “starting balance”
- Page no longer passes `startingBalance` into the view
- Deficit warning still renders **only when** `deficitDates.length > 0` (existing flag)
- Copy states the calendar is upcoming moments, not a cash forecast (`periodContext`)

This is a presentation de-emphasis of an existing forecast read model. Removing deficit dates would require changing the query or hiding a domain fact that already exists. Documented, not invented.

## Current UX issues (pre-redesign)

- Starting-balance / “all clear” success competed with the month grid
- Dense financial framing above the calendar
- Event amounts used `Intl.NumberFormat(undefined)` instead of shared locale formatters
- Empty month/day copy could read like a money shortage

## Proposed / implemented hierarchy

1. `TopAppBar` `DETAIL` + privacy toggle
2. Period context copy
3. Deficit banner only if the existing model flags dates
4. Month navigation (previous / heading / next / this month)
5. Month grid
6. Selected-day events (or `EmptyState`)
7. Existing payoff celebration / day-deficit alerts when those flags are true

Empty copy: “Nothing planned this month” / nothing on the selected day — not “no money available.”
