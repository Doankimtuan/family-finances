# ST-E02-004 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E02-004` |
| Title | OAuth login (Google + Apple) |
| Sprint | S1 / `sprint-001` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E02-004_20260802T020739Z` |
| Date | `2026-08-02T02:07:39Z` |

## Delivered

| Task | Result |
|------|--------|
| T-E02-004-a Providers / redirect | Documented ops (dashboard); app redirects to `/auth/confirm` |
| T-E02-004-b `StartOAuthSignIn` | PASS — tenancy application + Server Action |
| T-E02-004-c-google | PASS — Continue with Google CTA |
| T-E02-004-c-apple | PASS — Continue with Apple CTA |
| T-E02-004-c-email | PASS — Divider + email form retained |
| T-E02-004-d Confirm reuse | PASS — existing `/auth/confirm` PKCE exchange |
| T-E02-004-e Tests + i18n | PASS en/vi + unit + Playwright |

## Key paths

- `modules/tenancy/application/{oauth.schema,start-oauth-sign-in}.ts`
- `app/[locale]/(auth)/login/{login-screen,actions}.tsx`
- `app/auth/confirm/route.ts` (OAuth PKCE note)
- `messages/{en,vi}/auth.json` — OAuth login strings

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (45) |
| e2e oauth + login | PASS (6) + 1 skipped (no E2E email creds) |
| build | PASS |
