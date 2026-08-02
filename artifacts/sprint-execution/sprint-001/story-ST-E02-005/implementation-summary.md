# ST-E02-005 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E02-005` |
| Title | Account Linking (identity linking + conflict UX) |
| Sprint | S1 / `sprint-001` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E02-005_20260802T074306Z` |
| Date | `2026-08-02T07:43:06Z` |

## Delivered

| Task | Result |
|------|--------|
| T-E02-005-a Ops automatic linking policy | PASS — `ops-linking-policy.md` records BR-02b / B-ENV-05 decision |
| T-E02-005-b Conflict error map + Alert | PASS — `mapAuthLinkingError` + confirm route/UI codes |
| T-E02-005-c Optional `linkIdentity` | PASS (scoped) — application `linkIdentity` shipped; settings UI **deferred** (no Account Security screen in S1) |

## Key paths

- `modules/tenancy/application/map-auth-linking-error.ts`
- `modules/tenancy/application/link-identity.ts`
- `app/auth/confirm/route.ts` — OAuth `error` / exchange conflict mapping
- `app/[locale]/(auth)/auth/confirm/confirm-screen.tsx` — conflict Alert titles/copy
- `messages/{en,vi}/auth.json` — linking conflict strings
- `artifacts/sprint-execution/CURRENT/story-ST-E02-005/ops-linking-policy.md`

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (66) including linking map + `linkIdentity` |
| e2e account-linking + auth regression | PASS (14) + 1 skipped (no E2E email creds) |
| build | PASS |

## Acceptance

See `acceptance-check.md` — **ACCEPTED** for `AC-002b` / `BR-02b` / `REQ-002a` (scoped).
