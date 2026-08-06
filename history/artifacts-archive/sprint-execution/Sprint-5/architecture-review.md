# Architecture Review — Sprint 5

## Decisions

1. CalendarSchedule projection owned by Planning (`modules/plan`), composing ledger public queries.
2. No new DB calendar table — derived from recurring / card billing / installment counts.
3. Primary delivery via RSC + application query; Spec `GET /api/v2/calendar/events` name maps to `getHouseholdCalendar`.

## Boundaries

- Plan may read ledger application APIs (existing pattern).
- Calendar does not write Inbox reminders (read aggregation); payoff celebration deep-links existing Inbox / jar flows.
