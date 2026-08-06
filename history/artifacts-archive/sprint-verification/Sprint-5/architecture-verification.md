# Architecture Verification — Sprint 5

## Intentional decisions (accepted)

| Decision | Board |
|----------|-------|
| Calendar under `modules/plan` as CalendarSchedule — no `modules/calendar/` BC | **PASS** vs Spec Architecture + Constitution |
| Derived projection, no calendar table | **PASS** |
| Plan reads ledger application APIs | **PASS** (existing pattern) |
| RSC + `getHouseholdCalendar` as app contract | **ACCEPTABLE** for rewrite; Spec REST still a gap |
| Calendar does not write Inbox reminders | Consistent with arch review; **conflicts with BR-11 task** |

## Layering

| Layer | Finding |
|-------|---------|
| Pure projection | **PASS** — `calendar-projection.ts` client-safe |
| Query orchestration | **PASS** — `get-household-calendar.ts` |
| UI | **PASS** — no schedule math in `calendar-view.tsx` |
| Shared UI | **PASS** — StatusAlert, SectionHeader, Text |

## Boundary issues

| Issue | Severity |
|-------|----------|
| Planning catalog / traceability still say `modules/calendar/` | Low — SoT drift; code correct |
| Spec Tech Spec REST vs RSC-only | Medium |
| Plan→Ledger read fan-out (5 parallel queries) | Low — OK |
| Liability amounts in projection distort Planning forecast | High (business, not layering) |

## Circular dependencies

None observed for calendar surfaces.

## Architecture score

**8.0 / 10**
