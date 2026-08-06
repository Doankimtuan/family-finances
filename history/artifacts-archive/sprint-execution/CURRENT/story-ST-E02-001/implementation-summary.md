# ST-E02-001 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E02-001` |
| Title | Splash and Welcome screens |
| Sprint | S1 / `sprint-001` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E02-001_20260802T005514Z` |
| Date | `2026-08-02T00:55:14Z` |

## Delivered

| Task | Result |
|------|--------|
| T-E02-001-a Routes `/splash`, `/welcome` | PASS under `(auth)` |
| T-E02-001-b Auth layout (no BottomNav) | PASS (existing chrome) |
| T-E02-001-c `messages/{en,vi}/auth.json` | PASS |
| T-E02-001-d Landing → Welcome | PASS (`OpenAppButton` → `/welcome`) |
| T-E02-001-e Tests | PASS unit + Playwright |

## Code changes

- `modules/tenancy/application/resolve-auth-entry.ts` — session → welcome \| home
- `app/[locale]/(auth)/splash/*` — brand + Spinner, resolve redirect
- `app/[locale]/(auth)/welcome/*` — EmptyState + Login/Register CTAs
- `messages/en|vi/auth.json`
- `app/[locale]/open-app-button.tsx` — `/welcome` (no `/home` bypass)
- Tests: `resolve-auth-entry.test.ts`, `auth-entry.smoke.spec.ts`; chrome smoke updated

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (27) |
| e2e auth-entry + chrome + bootstrap | PASS (8) |
