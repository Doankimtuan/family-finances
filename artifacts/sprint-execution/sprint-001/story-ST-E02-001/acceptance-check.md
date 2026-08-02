# ST-E02-001 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| Splash: Logo + Spinner | `SplashScreen` Heading brand + Spinner | PASS |
| Splash: session resolve routing | `resolveAuthEntry` → welcome/home | PASS |
| Welcome: value prop | Title “Why join?” + `common.tagline` | PASS |
| Welcome: CTA Login / Register | Buttons → `/login`, `/register` | PASS |
| Required components | Spinner, Heading, Text (EmptyState), Button, EmptyState | PASS |
| Auth chrome, no BottomNav | `(auth)` layout + e2e | PASS |
| i18n en/vi | `auth.json` filled; parity tests | PASS |
| Landing not `/home` bypass | Open app → `/welcome` e2e | PASS |
| BR-02 / REQ-002 / AC-002 (scoped) | Session-aware entry only; membership gate = E02-002 | PASS (scoped) |

## Verdict

**ACCEPTED** for ST-E02-001. Login/register screens themselves are later stories.
