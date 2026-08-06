# ST-E02-003 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| Register screen (email, password, submit) | `/register` RHF + Zod + TextField/Button | PASS |
| Forgot-password screen (email, submit) | `/forgot-password` + Toast on success | PASS |
| Alert / Toast components | StatusAlert errors; `toast.success` on reset send | PASS |
| Links from login | Create account → register; Forgot password? → forgot | PASS |
| Confirm email reuse | `emailRedirectTo` / `redirectTo` → `/auth/confirm` | PASS |
| Application layer fail-closed | unconfigured → error codes; no invented schema | PASS |
| i18n en/vi parity | `auth.register`, `auth.forgotPassword` | PASS |
| Playwright smoke | chrome, links, submit feedback | PASS |
| No S2 onboard | Not built | PASS |

## Verdict

**ACCEPTED**. S1 story list complete after this freeze.
