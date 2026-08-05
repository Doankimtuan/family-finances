# Fixes Applied — Sprint 4 Verification Blockers

Board required fixes from `artifacts/sprint-verification/Sprint-4/blocking-issues.md`.

| ID | Fix |
|----|-----|
| **B1** | Migration `20260804160000_sprint45_verification_fixes.sql`: `run_month_ritual_autolock_worker_all()` + pg_cron `0 1 * * *` when available; page-open sweep remains fallback |
| **B2** | `assertPlanPeriodUnlocked` fail-closed; blocks target period locked statuses **and** any household `pending_review`; worker creates pending_review for due months without requiring unmapped inbox |
| **B3** | Extended `tests/unit/plan-month-ritual.test.ts` (gate codes, BR-11 mapping, constants); calendar/ritual coverage expanded |
| **B4** | `emergencies_acknowledged_at` + `acknowledgeRitualEmergencies`; approve/Quick Close gated; Step 3 always shown |

Hygiene: streak reset on correct; divergence query fail-closed; stale ritual page comment fixed.
