# Stories Completed — Sprint 4

| Story | Title | AC | Status |
|-------|-------|----|--------|
| `ST-E04-001` | 30-Day Month Ritual Temporal Auto-Lock Worker | AC-RIT-01 | **COMPLETE** |
| `ST-E04-002` | Month Ritual Step 1 Category-Jar Divergence Check Gate | AC-CAT-01 | **COMPLETE** |
| `ST-E04-003` | Step 3 Emergency Reflection & 1-Tap Quick Close Mode | AC-RIT-01 / BR-23 | **COMPLETE** |

## Acceptance evidence

### AC-RIT-01 / BR-08
- `isRitualAutolockDue("2026-01-01", 30, Mar 2)` → true; Mar 1 → false
- RPC `run_month_ritual_autolock_worker` → `pending_review` + plan lock
- UnmappedExpense for the period auto-resolves to General jar

### ST-E04-002 / BR-12
- `listRitualDivergence` surfaces unbound / archived-jar categories used in the period
- Preview and approve blocked with `ritual_divergence`

### BR-09 / BR-23
- `QUICK_CLOSE_CONSECUTIVE_RITUALS = 6`
- Approve increments `consecutive_completed_rituals`; unlocks Quick Close UI + `quick_close` mode
- Emergency plan movements listed in Step 3 reflection panel
