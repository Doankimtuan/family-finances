# Phase 8 — Visual validation

## Environment

- App: local Next.js on `http://127.0.0.1:3000` (existing `node` listener)
- Auth: **not bypassed**
- Credentials: `.env.local` `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` are present
- Browser attempts:
  - Cursor IDE browser tab at `/en/login`
  - Headless Playwright Chromium using those E2E credentials

## Authentication result

**Did not reach an authenticated Investments screen.**

On `/en/login`, `Log in` (and OAuth buttons) stayed `disabled` because the login screen gates submit on client hydration (`isDisabled={busy || !hydrated}`).

- Cursor browser accessibility tree: `Log in` `states: [disabled]` after wait
- Playwright: `waitForFunction` for an enabled Log in button timed out (30s); click also timed out on the disabled submit control

Auth was not skipped. No session cookie was injected. No fake investment records were seeded.

Evidence of the failed attempt: `artifacts/redesign/phase-8-investments/evidence/notes.json`.

## Routes checked

| Route | Result |
| --- | --- |
| `/en/login` | Reached. Form visible (Email, Password, Log in). Submit never enabled in this environment |
| `/en/money` | Not reached (auth required) |
| `/en/money/investments` | Not reached live |
| `/en/money/investments/[id]` | Not reached live |
| `/en/money/investments/new` | Not reached live (create was not submitted in any case) |
| `/en/money/investments/convert` | Not reached live (convert was not executed) |

## Real data availability

Unknown for this session. Live holdings could not be inspected. Presentation contracts for populated, unpriced, closed, and privacy states were verified in unit tests with fixtures — not against the household database.

## Viewports

| Viewport | Live result |
| --- | --- |
| 390 | Not captured on the Investments surface |
| 440 | Login chrome visible in Cursor browser; centered auth shell. Investments hub not reached |
| 768 | Not captured |
| 1280 | Not captured |

The 440px app shell CSS was not changed in this phase. No desktop portfolio dashboard was added.

## Light / dark

Login screenshot in the Cursor browser was **light**. Dark Investments surfaces were not reached. Theme tokens used in code remain semantic (`hero-*`, `text-*`, `surface-*`). Estimate vs unavailable is copy + `data-financial-kind`, not color alone. Active vs closed is tab text + Closed badge, not color alone.

## Create / detail / convert / privacy (live)

Not live-verified.

Covered by focused tests:

- Estimated hero + not-cash copy
- Missing valuation is not ₫0
- Incomplete allocation coverage stays visible
- Position card hierarchy
- Closed tab `aria-selected`
- Privacy masking without aria-label leakage
- Convert href stays `APP_PATH.MONEY_INVESTMENTS_CONVERT`
- Detail hero estimate-first, PnL off hero

Create/convert forms were not rewritten; opening them live would have been inspect-only (no submit / no destructive convert).

## Known limitations

- Login hydration did not complete in Cursor browser or headless Playwright during this pass, so Phase 8 browser coverage is **incomplete**
- Vietnamese clipping, 768/1280 shell, and light/dark on the Investments hub were not visually confirmed
- Whether the E2E household currently has holdings is unknown from this session
- Screenshot of the login form must not be treated as Investments validation

## Classification

Per Definition of Done: browser coverage incomplete → phase is **PARTIAL**, not COMPLETE.
