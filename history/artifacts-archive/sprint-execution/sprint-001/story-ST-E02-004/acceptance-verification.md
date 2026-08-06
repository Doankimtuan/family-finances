# ST-E02-004 — Acceptance Verification

| Criterion | Evidence | Status |
|-----------|----------|--------|
| AC-002a OAuth-first Login | Google → Apple → divider → Email on `/login` | PASS |
| REQ-002a Google OAuth | `startOAuthSignIn({ provider: "google" })` + CTA | PASS |
| REQ-002a Apple OAuth | `startOAuthSignIn({ provider: "apple" })` + CTA | PASS |
| REQ-002a Email retained | Email/password Sign in still on Login | PASS |
| No guest | No guest CTA | PASS |
| Confirm callback | `redirectTo` → `/auth/confirm` PKCE | PASS |
| Fail closed | unconfigured / provider_error → StatusAlert | PASS |
| Auth chrome | No BottomNav; AppViewport | PASS |
| i18n en/vi | `continueGoogle`, `continueApple`, `continueWithEmail`, errors | PASS |
| BR-02b | Not fully exercised (linking = ST-E02-005); OAuth start does not create app profiles | PASS (scoped) |

## Verdict

**ACCEPTED** for ST-E02-004. Account linking conflict UX is **ST-E02-005**.
