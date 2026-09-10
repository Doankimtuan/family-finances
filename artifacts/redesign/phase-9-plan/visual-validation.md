# Phase 9 — Visual validation

## Environment

- App: local Next.js on `http://127.0.0.1:3000` (restarted with host permissions after a hung `:3100` instance)
- Auth: **not bypassed**
- Credentials: `.env.local` `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` are present and were used by the capture script
- Browser attempts:
  - Cursor IDE browser tab at `/en/login`
  - Headless Playwright Chromium (`artifacts/redesign/phase-9-plan/evidence/capture.mjs`) against `:3000` and earlier against `:3100`

No fake planning records were seeded.

## Authentication result

**Did not reach an authenticated Plan screen.**

On `/en/login`, `Log in` (and OAuth buttons) stayed `disabled` because the login screen gates submit on client hydration (`isDisabled={busy || !hydrated}` via `useSyncExternalStore`).

- Cursor browser accessibility tree: `Log in` `states: [disabled]` after wait
- CDP `Runtime.evaluate`: `loginDisabled: true`, `document.readyState === "complete"`, React hydration flag not present
- Playwright: enabled-login wait timed out; session stayed on `/en/login`

A first capture against `:3100` failed earlier (`page.goto` timeout while that process hung after a `uv_interface_addresses` error). Auth was not skipped. No session cookie was injected.

Evidence:

- `artifacts/redesign/phase-9-plan/evidence/notes.json` (`auth: "login-disabled"` on `:3000`)
- `artifacts/redesign/phase-9-plan/evidence/login-disabled.png`

## Routes checked

| Route | Result |
| --- | --- |
| `/en/login` | Reached. Form visible (Email, Password, Log in). Submit never enabled in this environment |
| `/en/plan` | Not reached (auth required) |
| `/vi/plan` | Not reached live |
| `/en/plan/jars` | Not reached live |
| `/en/plan/goals` | Not reached live |
| `/en/plan/recurring` | Not reached live |
| `/en/plan/calendar` | Not reached live |
| `/en/plan/ritual` | Not reached live |

Sheets/wizards were not opened live. They were not rewritten; opening them would have been inspect-only (no submit).

## Real data availability

Unknown for this session. Live jars, goals, recurring, calendar, and review state could not be inspected. Empty vs populated attention, compact rows, and privacy masking were verified in unit tests with fixtures — not against the household database.

## Viewports

| Viewport | Live result |
| --- | --- |
| 390 | Not captured on Plan |
| 440 | Login chrome visible in Cursor browser and Playwright; centered auth shell. Plan hub not reached |
| 768 | Not captured |
| 1280 | Not captured |

The 440px app shell CSS was not changed in this phase. No desktop planning dashboard was added.

## Light / dark

Login screenshots were **light**. Dark Plan surfaces were not reached. Theme tokens used in code remain semantic (`hero-*`, `text-*`, `surface-*`, `warning`). Health is icon + title + body, not color alone. Overspent uses danger tone **and** “over by” copy.

## Privacy (live)

Not live-verified. Focused tests cover masking of intention amounts and exception `aria-label` without leaking figures.

## Accessibility observations (login only)

- Login form labels are present (Email, Password)
- `Log in` remains disabled until hydration; that blocked Plan keyboard/focus checks
- Plan hub interactive rows use `min-h-14` (`PLAN_DESTINATION_ROW_CLASS`); asserted in unit tests, not live

## Known limitations

- Login hydration did not complete in Cursor browser or headless Playwright during this pass, so Phase 9 browser coverage is **incomplete**
- Vietnamese clipping, 768/1280 shell, light/dark on Plan, privacy toggle, and child Plan routes were not visually confirmed
- Whether the E2E household currently has jars/goals/recurring data is unknown from this session
- Screenshot of the login form must not be treated as Plan hub validation

## Classification

Per Definition of Done: browser coverage incomplete → phase is **PARTIAL**, not COMPLETE.
