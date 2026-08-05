# Engineering Review — Sprint 5

## Reuse

| Area | Finding |
|------|---------|
| Constants | **PASS** — `CalendarEventSource`, `CalendarCashFlowSign`, `CASH_FLOW_DEFICIT_THRESHOLD`, `CALENDAR_PROJECTION_MONTHS`, `APP_PATH.PLAN_CALENDAR` |
| Ledger queries | **PASS** — `listCreditCards`, `listInstallmentPlans`, `listLiabilities`, `getRealPosition` |
| Billing due resolver | **PASS** — `resolveBillingDueDate` |
| Recurring list | **PASS** — `listRecurring` |
| i18n | **PASS** — en/vi `plan.calendar` |

## Duplication / smells

| Smell | Location |
|-------|----------|
| Event id prefixes hardcode source strings | `calendar-projection.ts` (`recurring:`, `card_due:`, …) vs `CalendarEventSource` |
| Test literals `"active"` / `"VND"` | `plan-calendar.test.ts` |
| `forecast` computed then dropped from UI props | `get-household-calendar.ts` → `page.tsx` |
| Installment/payoff href via `moneyCardPath(planId)` | `calendar-view.tsx` — plan id ≠ card route id |

## Abstraction quality

- Clean split: pure projectors + server query + presentational view.
- `mergeAndSortEvents` / `payoffMilestoneDates` appropriate.
- Hardcoded `dueDay: 1` is a leaky temporary — should be schema-backed.

## Engineering score

**7.5 / 10**
