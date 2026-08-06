# Code Quality Review — Sprint 5

## Strengths

- Typed DTOs (`CalendarEvent`, `HouseholdCalendar`)
- Constants-first sources and thresholds
- Touch targets `min-h-11`; aria-labels on day cells
- Auth gate on page (session + membership)
- Empty state when calendar unavailable

## Issues

| Topic | Notes |
|-------|-------|
| Component size | `calendar-view.tsx` ~280 lines — acceptable |
| Complexity | Projection loops with guards — readable |
| Magic strings | Event id prefixes; month regex; weekday key array (i18n) |
| Tailwind | Token spacing — OK |
| Performance | Five parallel list queries — fine for month view; watch growth |
| Accessibility | Grid buttons OK; celebration not modal (focus trap N/A) |
| Type safety | Good; installment `status: string` in projector input |
| React | Local selected day state — appropriate |
| Dead data | Server `forecast` unused by UI |

## Code quality score

**7.0 / 10**
