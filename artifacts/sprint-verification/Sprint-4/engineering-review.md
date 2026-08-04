# Engineering Review — Sprint 4

## Reuse

| Area | Finding |
|------|---------|
| Constants | **PASS** — `RitualStatus`, `RitualMode`, `QUICK_CLOSE_CONSECUTIVE_RITUALS`, `RITUAL_AUTOLOCK_DAYS_AFTER_MONTH_END`, `MISCELLANEOUS_JAR_NAME`, `RITUAL_GATE_ERROR_CODE`, `RITUAL_LOCKED_STATUSES` |
| Money action gate | **PASS** — `assertMoneyActionAllowed` on mutations/worker |
| Ritual period helpers | **PASS** — shared date helpers |
| Patterns | **PASS** — TopAppBar, EmptyState, StatusAlert |
| Inbox constants in SQL | **GAP** — SQL literals for `unmapped_expense` / `auto_resolved` / `pending` not shared with TS inbox constants |

## Duplication / smells

| Smell | Location |
|-------|----------|
| Date eligibility in TS helper unused by SQL worker | `isRitualAutolockDue` vs SQL interval — drift risk |
| Lock check duplicated (TS query vs unused SQL fn) | `assert-plan-unlocked.ts` vs `is_month_ritual_locked` |
| Unit tests assert raw status/mode strings | `plan-month-ritual.test.ts` |
| Stale page comment `ST-E05-004` | `plan/ritual/page.tsx` |

## Abstraction quality

- Divergence + emergency queries colocated in `ritual-gates.ts` — clear.
- `approveMonthRitual({ quickClose })` folds Assisted + Quick Close — acceptable.
- Worker returns counts — good observability hook; unused in UI.

## Engineering score

**7.0 / 10**
