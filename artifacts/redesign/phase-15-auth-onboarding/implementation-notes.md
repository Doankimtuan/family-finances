# Phase 15 — Implementation notes

**Status:** Presentation implemented. Unauthenticated auth surfaces verified in a real browser. Authenticated onboarding wizard was not live-exercised (no membership-less session; auth was not bypassed). Does not overwrite `.agents/design-system.md`. Next phase is Cross-App Visual QA — not started.

## What this phase did

Make entry and setup answer:

> What do I need to do next to enter ViNha or finish setting up my household, without confusion or unnecessary friction?

without changing authentication architecture, household rules, or financial semantics.

## Files changed

### Auth

- `app/[locale]/(auth)/welcome/welcome-screen.tsx` — restored previous Welcome: identity, promise, decorative Home-quoting preview (badged Preview), three value rows, Create account primary / Log in secondary
- `app/[locale]/(auth)/login/login-screen.tsx` — glow removed; **`busy || !hydrated` preserved**
- `app/[locale]/(auth)/login/page.tsx` — Suspense fallback uses `AuthScreenShell` + `Skeleton`
- `app/[locale]/(auth)/register/register-screen.tsx` — glow removed
- `app/[locale]/(auth)/forgot-password/forgot-password-screen.tsx` — glow removed
- `app/[locale]/(auth)/reset-password/reset-password-screen.tsx` — glow removed
- `app/[locale]/(auth)/auth/confirm/confirm-screen.tsx` — shared primary action class
- `shared/patterns/auth-house-glow.tsx` — restored previous Welcome wash

### Onboarding / invite

- `app/[locale]/(onboard)/together/onboard/onboard-wizard-screen.tsx` — brand row, Skip secondary under Finish, Back tertiary
- `app/[locale]/(invite)/invite/[token]/invite-accept-screen.tsx` — auth-family identity, token-based surfaces, no hero card
- `app/[locale]/(invite)/invite/[token]/loading.tsx` — token radius on skeletons

### Copy / tests / docs

- `messages/en/auth.json` / `messages/vi/auth.json`
- `messages/en/onboard.json` / `messages/vi/onboard.json`
- `tests/unit/auth-onboard-ui.test.tsx`
- `tests/unit/phase-15-auth-onboarding.test.tsx`

Not changed: tenancy application commands, `/auth/confirm` and `/auth/signout` handlers, `proxy.ts`, `createHousehold` RPC shape, OAuth providers, schemas, five tabs.

## Components reused

`AuthScreenShell`, `AuthScreenHeader`, `BrandMark`, `SocialButton`, `DividerWithText`, `AuthTextField`, `AmountField`, `ChoiceTile` / `ChoiceTileGroup`, `Progress`, `StatusAlert`, `LocaleSwitcher`, `AppIcon` / `IconContainer`, `Button`, `Skeleton`, `MotionStep`

No competing design system. No new auth mechanism.

## Hierarchy decisions

- Welcome: brand → headline → subtitle → decorative Preview card → three existing points → Create account → Log in. Preview is `aria-hidden` and uses static illustration values from the previous Welcome.
- Login / Register: existing OAuth-first order (S1 + tests), then email form, one primary submit, footer cross-link.
- Forgot / Reset: back, heading, short explanation, fields, primary action, return-to-login.
- Onboarding: brand + “Step N of 2” + one question. Step 2 actions: Finish (primary) → Skip for now (ghost) → Back (quieter ghost). Skip handler unchanged.
- Invite: identity + household name from preview + existing accept/decline/sign-in. Token not shown as text; sign-in remains a `Link` to `loginHrefWithNext(invitePath(token))`.

## Contract preservation

- Auth action signatures, callback routes, redirect destinations, providers, session creation/refresh, tokens, password reset, and verification: **not modified**.
- Onboarding still posts `name`, optional `accountName`, `openingBalance`, `planPreset`, locale/timezone/currency.
- Skip still omits account name and forces `planPreset: null`.
- Opening balance remains an amount already present, not income (copy only).
- Hũ/jars remain intention envelopes (copy already said so; kept).
- Hydration gate on Login was not weakened.

## Security / privacy

No passwords, tokens, session IDs, or invite tokens in visible copy, `aria-label`s, or errors. Invite token remains only in the existing sign-in `href` `next` path.

## i18n

EN/VI updated together. Removed unused Welcome preview keys. Login subtitle, household/setup, skip, and opening-amount copy exist in both locales.

## Accessibility

- Existing `h1` titles, labelled `AuthTextField`s, 44px back/skip/submit targets
- Login `aria-busy` via `AuthScreenShell`
- Password reveal unchanged
- Progress still `role="progressbar"` with “Step N of 2”
- Confirm/invite errors use `StatusAlert`

## Focused tests

- `tests/unit/auth-onboard-ui.test.tsx`
- `tests/unit/phase-15-auth-onboarding.test.tsx`
- `tests/unit/together-invitation-scan.test.tsx` (invite path constants)
- `tests/unit/register-forgot.test.ts` (command contract, not UI)

## Typecheck / lint / build

- `npm run typecheck` — PASS
- ESLint on the touch set — PASS
- Full `npm run lint` — FAIL on pre-existing `output/vinha-*.mjs` `console` usage, not this phase
- Build — NOT RUN

## Known limitations

- Authenticated onboarding wizard was not opened in the browser (unauthenticated `/together/onboard` correctly redirects to login; hydration gate blocks logging in from this browser; no new user was created).
- Playwright `capture.mjs` could not launch Chromium in this environment (browser binary missing). Cursor browser + CDP metrics were used instead.
- Design-system S1 Home-preview recipe is restored on Welcome after review. OAuth-first order was kept.
