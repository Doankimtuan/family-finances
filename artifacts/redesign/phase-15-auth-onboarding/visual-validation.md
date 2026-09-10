# Phase 15 — Visual validation

## Environment

- App: local Next.js on `http://127.0.0.1:3000`
- Browser: Cursor IDE browser (Chromium), unauthenticated
- Auth: **not bypassed**. No fake accounts, seeded sessions, or mocked Supabase auth
- Playwright `evidence/capture.mjs` could not run: Chromium headless binary missing in this environment

## Authentication availability

**Unauthenticated.** Welcome, Login, Register, Forgot password, Reset password, Confirm (bare error), and invalid invite rendered without a session.

Login Google / Apple / Log in stayed **disabled** because of the existing `busy || !hydrated` gate. That gate was not weakened. Empty-submit validation on Register was not reliably triggered from HeroUI in this browser; field-error presentation is covered by unit tests.

`/en/together/onboard` redirected to `/en/login` (expected with no session).

**PARTIAL — authenticated onboarding could not be exercised because no valid membership-less session was available, and authentication was not bypassed.**

## Routes tested

| Route | Result |
| --- | --- |
| `/en/welcome`, `/vi/welcome` | Welcome hierarchy with decorative Preview card |
| `/en/login` | Auth family; hydration-disabled primary/OAuth |
| `/en/register` | OAuth-first, auth-critical fields, password hint, terms |
| `/en/forgot-password` | Simple email + Send reset link + back to login |
| `/en/reset-password` | New / confirm password + hint + Update password |
| `/en/auth/confirm` | Bare visit = “Link not valid”; no token shown |
| `/en/invite/not-a-valid-uuid` | “Invitation unavailable”; token not displayed |
| `/en/together/onboard` | Redirect to login |

Five-tab nav was absent on all of the above (auth chrome). Desktop remained a centered ~440px column, not a dashboard.

## Viewport results

| Surface | 390 | 440 | 768 | 1280 |
| --- | ---: | ---: | ---: | ---: |
| Welcome | ✓ innerWidth 390 / shell 390 | ✓ (desktop shell 440) | same centered column | ✓ innerWidth 2227 / shell 440 |
| Login | ✓ shell 390 then 440 | ✓ innerWidth 440 / shell 440 | Emulation 768 did not stick in this browser; column stayed 440 | ✓ shell 440 |
| Register | visual family match at ~440/1280 | ✓ | same | ✓ |
| Forgot password | visual family match | ✓ | same | ✓ |
| Onboarding | not live | not live | not live | not live |

Cursor screenshots include surrounding IDE chrome; column width was confirmed with `innerWidth` / `#app-viewport-root` offsetWidth.

## Light / dark

| Theme | Surfaces | Evidence |
| --- | --- | --- |
| Light | Welcome EN/VI, Login, Register, Forgot, Reset, Confirm error, Invite fail-closed | Cursor captures; `evidence/welcome-1280.png` |
| Dark | Login after `documentElement` `dark` class (light removed) | `evidence/login-440-dark.png` |

Dark login: charcoal canvas, visible input borders, Apple as inverse (light) button, teal primary. Disabled OAuth/login remain reduced opacity because of the hydration gate.

No feature-level hex or new gradients. Auth glow is an `bg-accent/10` blur wash.

## Responsive observations

- 440px shell stayed authoritative at wide widths
- Vietnamese Welcome headline wraps without clipping (`Biết rõ tiền của nhà mình đi đâu`)
- Primary buttons remain full width in the 22rem auth column
- No horizontal overflow observed on Welcome / Login / Register / Forgot

## Accessibility observations

- Welcome/Login/Register/Forgot/Reset expose an `h1`
- Email/password fields have visible labels
- Back controls are named links (Welcome / Log in)
- Show password buttons present
- Login disabled state is exposed (`disabled` on OAuth + submit)
- Confirm/invite errors are `StatusAlert`, no stack traces or tokens

## Evidence

- `evidence/welcome-1280.png`
- `evidence/welcome-390.png` (CDP 390; screenshot still shows IDE chrome)
- `evidence/login-440-dark.png`
- `evidence/capture.mjs` (not runnable here)

## Blocked scenarios

| Scenario | Reason |
| --- | --- |
| Live onboarding steps / Skip / Finish | No session without household; login hydration blocks sign-in in this browser; did not create a user |
| Login empty-submit in this browser | Submit disabled until hydrated |
| Reset via real recovery email | Would require a live recovery session; reset **screen** was opened without a token |
| Playwright viewport matrix files | Chromium binary missing |

## Known limitations

- Onboarding presentation is unit-tested, not live-walked
- 768 CSS viewport override did not apply after 440 in this IDE browser
- Full `npm run lint` fails on unrelated `output/vinha-*.mjs` files
