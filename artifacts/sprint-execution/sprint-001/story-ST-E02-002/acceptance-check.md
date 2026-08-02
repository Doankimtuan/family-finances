# ST-E02-002 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| Supabase SSR login | `signInWithPassword` + login UI RHF/Zod | PASS |
| Login required components | Input, Button, Alert, Text | PASS |
| Confirm email/magic link | `app/auth/confirm` exchange + locale UI | PASS |
| Session cookies via SSR client | platform supabase server + proxy refresh | PASS |
| Unauth money path gated | redirect `/money` → `/login` | PASS |
| AC-002 membership for money actions | fail-closed stub; money gate UI; `assertMoneyActionAllowed` | PASS (scoped) |
| BR-02 / BR-02a / REQ-002 | Auth session + membership invariant stub | PASS (scoped) |
| No S2 onboard wizard | Not built | PASS |
| i18n | `auth.login`, `auth.confirm`, `auth.moneyGate` | PASS |
| Playwright Auth reachable | invalid credentials Alert | PASS |
| Playwright happy path | skipped without `E2E_USER_*` | PARTIAL |

## Verdict

**ACCEPTED** with known limitation: full login→home e2e requires `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`.
