# Implementation Report — Sprint 5 (Spec v2.1)

| Field | Value |
|-------|--------|
| Sprint | Implementation Planning **Sprint 5** / `Sprint-5` |
| Goal | Unified Household Financial Calendar (EPIC 5) |
| Plan SoT | `artifacts/implementation-planning/CURRENT/sprint-plan.md` |
| Spec SoT | Specification Synchronization v2.1 |
| Opened | 2026-08-04 |
| Completed | 2026-08-04T06:40:00Z |
| Status | **COMPLETE — awaiting approval** |

## Scope executed

| Story | Points | Outcome |
|-------|--------|---------|
| `ST-E05-001` Multi-domain schedule projection | 8 | Done |
| `ST-E05-002` Calendar UI + cash-flow deficit warning | 5 | Done |
| `ST-E05-003` Debt payoff milestone & celebration | 3 | Done |

## What shipped

### Module home (Constitution)
- Calendar lives under **`modules/plan`** as `CalendarSchedule` projection — **no** `modules/calendar/` BC invented
- Route: `APP_PATH.PLAN_CALENDAR` → `/plan/calendar`

### Application
- Pure projection: `modules/plan/application/calendar-projection.ts`
  - Recurring expansion, card dues (BR-17), installments/liabilities (BR-20)
  - Payoff milestone tagging (BR-11)
  - Real-cash running forecast + deficit dates (ST-E05-002)
- Query: `getHouseholdCalendar()` aggregates plan + ledger reads

### UI
- Plan hub entry + `/plan/calendar` month grid
- Deficit warning banner; day-level low-balance callout
- Payoff celebration surface with Inbox + jar reallocate CTAs

### Tests
- `tests/unit/plan-calendar.test.ts` (AC-CAL-01 three domains, deficit, milestone)
- Full suite: **231** tests passed

## Explicit non-goals

- Sprint 6 Health-RO / AI guards
- Inventing `modules/calendar/`
- pg_cron payment-reminder fan-out beyond existing Inbox primitives
- Dedicated REST `GET /api/v2/calendar/events` (RSC/query is the app contract; Spec API name documented as plan query)

## Decisions

- Spec Sync deficit warnings shipped now (overrides PDB EO-03 R1 deferral)
- Installment due day defaults to day-of-month `1` when plans lack a schedule column
