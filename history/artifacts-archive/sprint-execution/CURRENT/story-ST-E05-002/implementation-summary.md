# ST-E05-002 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E05-002` |
| Title | Jars list and detail Active-only targets |
| Sprint | S4 / `sprint-004` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E05-002_20260802T153800Z` |
| Date | `2026-08-02T15:38:03Z` |

## Delivered

| Task | Result |
|------|--------|
| Jars list (`plan.jars`) | PASS — Active section + Paused/Archived non-targets |
| Jar detail (`plan.jar-detail`) | PASS — Planned amount via `Amount` (not Balance) |
| State matrix Active\|Paused\|Archived | PASS — `is_paused` + archive; BR-03 targets Active only |
| Suggest default plans (AC-004) | PASS — household Suggest + percent\|fixed `jar_plans` |
| Ritual lock teaching (AC-008) | PASS — info strip + ritual stub link (enforcement → ST-E05-004) |
| Create / Pause / Archive / Edit plan | PASS — offline fail-closed |
| Capture Active-only jars | PASS — `listCaptureJars` filters paused |
| i18n en/vi | PASS — `messages/{en,vi}/plan.json` |
| Tests | PASS — unit plan-pulse + e2e smoke |

## Key paths

- `supabase/migrations/20260802150000_plan_jars_state_and_plans.sql`
- `modules/plan/application/{jar-types,queries/*,commands/*}`
- `app/[locale]/(product)/plan/jars/{page,create-jar-form,actions,[id]/*}`
- `shared/patterns/{amount,jar-card}.tsx`
- `messages/{en,vi}/plan.json`
- `tests/unit/plan-pulse.test.ts`
- `tests/e2e/plan-jars.smoke.spec.ts`

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (128) |
| e2e plan-hub + plan-jars | PASS (2 passed, 2 skipped without E2E creds) |
| build | PASS (`/plan/jars`, `/plan/jars/[id]`) |
