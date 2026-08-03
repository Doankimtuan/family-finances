# ST-E07-001 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E07-001` |
| Title | Home three answers and Health chip |
| Sprint | S6 / `sprint-006` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E07-001_20260803T052222Z` |
| Date | `2026-08-03T05:22:22Z` |

## Delivered

| Task | Result |
|------|--------|
| Real position (AC-001 / BR-01) | PASS — `Balance` from `getRealPosition`; never jar as bank |
| Plan pulse intention labels | PASS — active jar count + allocate mode; link to Plan |
| Inbox CTA | PASS — pending count + open Inbox |
| Health chip (AC-015) | PASS — `HealthCard` → `/health` shell (not dead-end) |
| Day-0 empty trio | PASS — invite / set up plan / add expense |
| Capture CTA | PASS — Add expense when not day-0 |
| Patterns | PASS — `KpiBlock`, `HealthCard` |
| i18n en/vi | PASS — `home` namespace + expanded `health` |
| Keyboard / touch (AC-019) | PASS — min-h-11 CTAs; focus-visible |

## Key paths

- `modules/home/application/get-home-dashboard.ts`
- `modules/health/application/{health-pulse,get-health-overview}.ts`
- `app/[locale]/(product)/home/**`
- `app/[locale]/(product)/health/**`
- `shared/patterns/{kpi-block,health-card}.tsx`
- `messages/{en,vi}/{home,health}.json`
- `tests/unit/health-pulse.test.ts`
- `tests/e2e/home-dashboard.smoke.spec.ts`

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (156) |
| e2e home-dashboard | PASS (1 passed, 1 skipped) |
| build | PASS |
