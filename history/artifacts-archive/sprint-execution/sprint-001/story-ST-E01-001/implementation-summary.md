# ST-E01-001 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E01-001` |
| Title | Bootstrap AppViewport shell and theme tokens |
| Sprint | S1 / `sprint-001` |
| Mode | `verify_gap_close` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E01-001_20260802T004227Z` |
| Date | `2026-08-02T00:42:27Z` |

## What was done

Verified Sprint 0 shell against Story DoD. No product shell rebuild required.

| Task | Result |
|------|--------|
| T-E01-001-a AppViewport 440px, centered, no sidebar | **PASS** — `shared/patterns/app-viewport.tsx` + product layout |
| T-E01-001-b CSS tokens + next-themes light/dark | **PASS** — `styles/globals.css` + `providers/theme-provider.tsx` |
| T-E01-001-c No archive imports in app shell | **PASS** — grep clean under `app/`, `shared/`, `providers/` |
| T-E01-001-d Smoke `/en` + `/vi` shell | **PASS** — new Playwright smoke |
| T-E01-001-e Gap-close | Smoke tests only; no shell code changes |

## Code changes

- Added [`tests/e2e/shell.smoke.spec.ts`](../../../../tests/e2e/shell.smoke.spec.ts): `/en/home` + `/vi/home` assert `#app-viewport-root`, `maxWidth: 440px`, width ≤ 440; dark-class canvas token smoke.

## Intentionally unchanged

- Landing page remains outside `<AppViewport>` (uses `--app-viewport-max` CSS); product routes use AppViewport.
- No ThemeToggle UI (system preference via next-themes; Design System defers manual toggle).

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit (`vitest`) | PASS (21) |
| e2e shell + bootstrap | PASS (4) |
