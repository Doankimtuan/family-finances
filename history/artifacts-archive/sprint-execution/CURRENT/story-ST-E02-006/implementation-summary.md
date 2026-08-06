# ST-E02-006 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E02-006` |
| Title | Sign-out + delete account |
| Sprint | S1 / `sprint-001` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E02-006_20260802T082600Z` |
| Date | `2026-08-02T08:26:00Z` |

## Delivered

| Task | Result |
|------|--------|
| T-E02-006-a Sign-out adapter + nav | PASS — `POST/GET /auth/signout` + Together Account card |
| T-E02-006-b Delete account + confirm | PASS — Admin API + confirm UX; service role server-only |
| T-E02-006-c Tests | PASS — unit + Playwright |

## Key paths

- `modules/tenancy/application/{sign-out,delete-account}.ts`
- `modules/platform/supabase/admin.ts` (`server-only`)
- `app/auth/signout/route.ts`
- `app/[locale]/(product)/together/{account-lifecycle-card,actions,page}.tsx`
- `messages/{en,vi}/auth.json` — `account.*`
- `.env.local.example` — `SUPABASE_SERVICE_ROLE_KEY`

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (72) |
| e2e account-lifecycle | PASS (3) |
| build | PASS (`/auth/signout` listed) |
