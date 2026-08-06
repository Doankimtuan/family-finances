# ST-E08-001 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E08-001` |
| Title | System error offline permission maintenance shells |
| Sprint | S6 / `sprint-006` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E08-001_20260803T063711Z` |
| Date | `2026-08-03T06:37:11Z` |

## Delivered

| Task | Result |
|------|--------|
| `system.error` (`/error` + locale `error.tsx`) | PASS — ErrorState, retry, home |
| `system.offline` (`/offline`) | PASS — fail-closed copy; retry / read-only |
| `system.permission` (`/permission`) | PASS — Admin elevation explained (AC-020) |
| `system.maintenance` (`/maintenance`) | PASS — terminal calm message |
| Offline escalate (AC-018 / BR-15) | PASS — shared `MutationOfflineBanner` → `/offline` |
| Policies → permission | PASS — read-only link + FORBIDDEN redirect |
| Maintenance gate | PASS — `isMaintenanceMode` + proxy redirect |
| System chrome (no 6th tab) | PASS — `(system)` ChromeShell |
| i18n en/vi | PASS — `system` namespace |
| Tests | PASS — unit + e2e smoke |

## Key paths

- `app/[locale]/(system)/{error,offline,permission,maintenance}/**`
- `app/[locale]/error.tsx`
- `shared/patterns/{system-shell,mutation-offline-banner}.tsx`
- `modules/platform/application/maintenance-mode.ts`
- `proxy.ts` (maintenance redirect)
- `messages/{en,vi}/system.json`
- `tests/unit/maintenance-mode.test.ts`
- `tests/e2e/system-shells.smoke.spec.ts`

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (162) |
| e2e system-shells | PASS (4) |
| build | PASS |
