# ST-E05-004 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| AC-008 / BR-08 approve locks normal movements | `assertPlanPeriodUnlocked` on jar/goal/recurring mutations; ritual approve sets `approved` | PASS |
| AC-009 / BR-09 Assisted default | Household `month_close_mode` assisted; ritual UI mode label | PASS |
| Explicit correction | Correct form → `corrected` unlocks period | PASS |
| AC-018 / BR-15 offline | Offline banner; preview/approve/correct blocked offline | PASS |
| AC-019 keyboard / touch | min-h-11 CTAs; Progress + confirm flow | PASS |
| Screens | `plan.month-ritual` at `/plan/ritual` | PASS |
| i18n en/vi | `plan.ritual` | PASS |

## Verdict

**ACCEPTED** for ST-E05-004. Sprint S4 complete. Next story: `ST-E06-001` (S5).
