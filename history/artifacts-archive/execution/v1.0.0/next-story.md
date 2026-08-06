# Next Story

| Field | Value |
|-------|--------|
| Story | **`ST-E02-006`** |
| Title | Sign-out + delete account |
| Sprint | S1 |
| Priority | P1 |
| Mode | `full_implement` |
| Depends on | `ST-E02-004` / session (satisfied); linking freeze (satisfied) |

## Prerequisites

| Need | Status |
|------|--------|
| Session cookies / SSR Auth client | Present |
| Auth chrome / Pattern v1 | Present |
| Product AC for lifecycle | `AC-002a` lifecycle notes; DoD §4 |
| Privileged delete path | Must be server-only (no service role on client) |
| i18n en/vi | Add sign-out / delete copy |
| Tests | Unit + Playwright cookie clear / unauth gates |

## Task sketch (from planning)

- T-E02-006-a — `signOut` adapter + nav entry  
- T-E02-006-b — Delete account command + confirm UX  
- T-E02-006-c — Tests for cookie clear / unauth gates  

## Do not

- Start S2  
- Re-open frozen auth stories unless a quality gate fails  
- Implement guest mode  
