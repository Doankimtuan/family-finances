# Phase 11 — Visual validation

## Environment

- App: local Next.js on `http://127.0.0.1:3000` (login returned HTTP 200)
- Auth: **not bypassed**
- Credentials: `.env.local` `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` are present and were used by the capture script
- Browser attempts:
  - Cursor IDE browser tab at `/en/login`
  - Headless Playwright Chromium (`artifacts/redesign/phase-11-recurring-calendar-ritual/evidence/capture.mjs`) with `PLAYWRIGHT_BROWSERS_PATH` pointed at the local Playwright cache

No fake recurring, calendar, or review records were seeded. No destructive mutations were submitted.

## Authentication result

**Did not reach an authenticated Plan, Recurring, Calendar, or Ritual screen.**

On `/en/login`, `Log in` (and OAuth buttons) stayed `disabled` because the login screen gates submit on client hydration (`isDisabled={busy || !hydrated}`). After `document.readyState === complete` and JS bundles loaded, the button remained `disabled` in both browsers.

- Cursor browser accessibility tree: `Log in` `states: [disabled]`
- Playwright: `loginEnabled: false`; session stayed on `/en/login`
- Auth was not skipped. No session cookie was injected.

Evidence:

- `artifacts/redesign/phase-11-recurring-calendar-ritual/evidence/notes.json` (`auth: "login-disabled"`)
- `artifacts/redesign/phase-11-recurring-calendar-ritual/evidence/login-disabled.png`
- `artifacts/redesign/phase-11-recurring-calendar-ritual/evidence/login-disabled-cursor.png`

## Real data availability

Unknown for this session. Live recurring rules, calendar events, monthly-review facts, empty vs populated lists, Sheets, and privacy masking on real household figures could not be inspected in a browser.

Empty vs populated rows, intention/current-state kinds, month query helpers, and privacy masking were verified in unit tests with fixtures — not against the household database.

## Recurring verification (live)

| Route | Result |
| --- | --- |
| `/en/plan/recurring` | Not reached (auth required) |
| `/en/plan/recurring/[id]` | Not reached live |
| Create Sheet | Not opened live |
| Pause / delete | Not exercised live (destructive mutations not run) |

## Calendar verification (live)

| Check | Result |
| --- | --- |
| Current month | Not reached live |
| Previous / next / this month | Not reached live |
| Selected date | Not reached live |
| Real events | Unknown |
| Event detail | Not reached live |

## Ritual verification (live)

| Check | Result |
| --- | --- |
| Review start | Not reached live |
| Question / state | Not reached live |
| Primary action | Not submitted (would be a mutation; not run) |
| Completion | Not reached live |

## Plan integration (live)

Plan → Recurring / Calendar / Ritual and child back-to-Plan were **not** live-verified. Code still uses `APP_PATH.PLAN`, `APP_PATH.PLAN_RECURRING`, `APP_PATH.PLAN_CALENDAR`, `APP_PATH.PLAN_RITUAL`, `planRecurringPath`, `planCalendarPath`, `planRitualPath`.

## Viewports

| Viewport | Live result |
| --- | --- |
| 390 | Not captured on Recurring/Calendar/Ritual |
| 440 | Login chrome visible (centered auth shell). Product surfaces not reached |
| 768 | Not captured |
| 1280 | Not captured |

The 440px app shell CSS was not changed in this phase. No desktop calendar dashboard was added.

## Light / dark

Login screenshot was **light**. Dark Recurring/Calendar/Ritual surfaces were not reached. Theme tokens in code remain semantic.

## Privacy (live)

Not live-verified. Focused tests cover masking of recurring planned amounts while identity/status remain.

## Accessibility observations (login only)

- Login form labels are present (Email, Password)
- `Log in` remains disabled until hydration; that blocked Recurring/Calendar/Ritual keyboard, focus, Sheet, calendar cell names, and Vietnamese clipping checks
- Calendar nav `min-h-11` and day `aria-label` construction are asserted in unit tests, not live

## Known limitations

- Login hydration did not complete in Cursor browser or headless Playwright during this pass
- Recurring list/detail, Calendar month navigation, Ritual review, privacy toggle, Plan integration, 390/768/1280, and dark theme were **not** visually confirmed
- Whether the E2E household currently has recurring rules, calendar events, or a monthly review is unknown from this session
- Screenshot of the login form must not be treated as Recurring, Calendar, or Ritual validation

**STATUS = PARTIAL** because authenticated browser coverage is incomplete.
