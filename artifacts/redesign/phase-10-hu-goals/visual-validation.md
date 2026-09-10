# Phase 10 — Visual validation

## Environment

- App: local Next.js on `http://127.0.0.1:3000` (already listening; login returned HTTP 200)
- Auth: **not bypassed**
- Credentials: `.env.local` `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` are present and were used by the capture script
- Browser attempts:
  - Cursor IDE browser tab at `/en/login`
  - Headless Playwright Chromium (`artifacts/redesign/phase-10-hu-goals/evidence/capture.mjs`)

No fake Hũ or Goal records were seeded. No destructive mutations were submitted.

## Authentication result

**Did not reach an authenticated Plan, Hũ, or Goals screen.**

On `/en/login`, `Log in` (and OAuth buttons) stayed `disabled` because the login screen gates submit on client hydration (`isDisabled={busy || !hydrated}`).

- Cursor browser accessibility tree: `Log in` `states: [disabled]` after navigation
- Playwright: `loginEnabled: false`; session stayed on `/en/login`
- Auth was not skipped. No session cookie was injected.

Evidence:

- `artifacts/redesign/phase-10-hu-goals/evidence/notes.json` (`auth: "login-disabled"`)
- `artifacts/redesign/phase-10-hu-goals/evidence/login-disabled.png`

## Real data availability

Unknown for this session. Live jars, goals, empty vs populated lists, allocation sheets, contribution sheets, and privacy masking on real household figures could not be inspected in a browser.

Empty vs populated rows, intention kinds, and privacy masking were verified in unit tests with fixtures — not against the household database.

## Routes tested

| Route | Result |
| --- | --- |
| `/en/login` | Reached. Form visible. Submit never enabled |
| `/en/plan` | Not reached (auth required) |
| `/en/plan/jars` | Not reached live |
| `/en/plan/jars/[id]` | Not reached live |
| `/en/plan/goals` | Not reached live |
| `/en/plan/goals/[id]` | Not reached live |
| `/vi/plan/jars` | Not reached live |
| Create / edit / reallocate / contribute sheets | Not opened live |

Plan → Hũ / Plan → Goals / child back navigation were not live-verified. Code still uses `APP_PATH.PLAN`, `APP_PATH.PLAN_JARS`, `APP_PATH.PLAN_GOALS`, `planJarPath`, `planGoalPath`.

## Viewports

| Viewport | Live result |
| --- | --- |
| 390 | Not captured on Hũ/Goals |
| 440 | Login chrome visible (centered auth shell). Product surfaces not reached |
| 768 | Not captured |
| 1280 | Not captured |

The 440px app shell CSS was not changed in this phase. No desktop Hũ grid or goal matrix was added.

## Light / dark

Login screenshot was **light**. Dark Hũ/Goals surfaces were not reached. Theme tokens in code remain semantic (`hero-*`, `text-*`, `surface-*`, `danger` + “over by” text for overspent).

## Privacy (live)

Not live-verified. Focused tests cover masking of Hũ remaining, Goal funded/target, and progress `aria-label`.

## Accessibility observations (login only)

- Login form labels are present (Email, Password)
- `Log in` remains disabled until hydration; that blocked Hũ/Goals keyboard, focus, Sheet, and Vietnamese clipping checks
- Interactive rows use `min-h-14`; asserted in unit tests, not live

## Known limitations

- Login hydration did not complete in Cursor browser or headless Playwright during this pass
- Hũ list/detail, Goal list/detail, sheets, privacy toggle, Plan integration, 390/768/1280, and dark theme were **not** visually confirmed
- Whether the E2E household currently has jars/goals is unknown from this session
- Screenshot of the login form must not be treated as Hũ or Goals validation

## Classification

Per Definition of Done: browser coverage incomplete because of login hydration → phase is **PARTIAL**, not COMPLETE.
