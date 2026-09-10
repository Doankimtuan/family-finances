# Phase 15 — Auth + onboarding content audit

Inspected the live repository before presentation edits. This audit records what already existed and what was presentation-only.

## Discovered auth routes

Locale prefix is always `/{locale}` (`en` | `vi`). Chrome for these routes is `ChromeShell chrome="auth"` (no five-tab nav).

| Surface | Route | Implementation |
| --- | --- | --- |
| Welcome / locale root | `/{locale}`, `/{locale}/welcome` | `app/[locale]/page.tsx`, `(auth)/welcome/page.tsx` + `welcome-screen.tsx` |
| Splash (e2e/entry) | `/{locale}/splash` | `(auth)/splash/` — not in `APP_PATH`; left unchanged |
| Login | `/{locale}/login` | `login-screen.tsx` + `loginAction` |
| Register | `/{locale}/register` | `register-screen.tsx` + `registerAction` |
| Forgot password | `/{locale}/forgot-password` | `forgot-password-screen.tsx` + `forgotPasswordAction` |
| Reset password | `/{locale}/reset-password` | `reset-password-screen.tsx` + `updatePasswordAction` |
| Locale confirm UI | `/{locale}/auth/confirm` | `confirm-screen.tsx` |
| Adapter confirm | `GET /auth/confirm` | `app/auth/confirm/route.ts` — PKCE / OTP |
| Sign out | `POST /auth/signout` | `app/auth/signout/route.ts` |
| Public invite | `/{locale}/invite/[token]` | `invite-accept-screen.tsx` |

No `/signup`, `/sign-in`, `/magic-link`, or `/oauth` pages exist. Google and Apple OAuth are buttons on Login and Register; callbacks stay on `/auth/confirm`.

Canonical paths live in `modules/shared-kernel/app-path.ts` (`WELCOME`, `LOGIN`, `REGISTER`, `FORGOT_PASSWORD`, `RESET_PASSWORD`, `ONBOARD`, `invitePath`).

## Existing auth flow (unchanged)

```text
Welcome → Register | Login
Login → Forgot password → Reset password (via email link /auth/confirm?next=/reset-password)
Register success + session → /together/onboard
Register success without session → inline email-confirm alert
Authenticated visit to Welcome/Login → /home or /together/onboard
```

Session gate: Next.js `proxy.ts` (no `middleware.ts`). Product layout uses `requireProductSession`.

## Login / register fields and providers

**Login:** email, password, remember; Google; Apple; `loginAction`; `startBrowserOAuthSignIn`. Hydration gate **`busy \|\| !hydrated`** on OAuth and submit.

**Register:** email, password, confirmPassword, acceptTerms; Google; Apple. No hydration gate (existing).

**Forgot:** email → toast on success (`toastSent`). No fabricated “email sent” page.

**Reset:** password, confirmPassword → `updatePasswordAction` → `result.next`.

**Confirm:** `ok` / `error` / `pending`. Bare visit is error, not infinite pending.

## Onboarding

Only surface: `/{locale}/together/onboard`.

Guards (unchanged): no session → login; active membership → home.

**Two steps** (`TOTAL_STEPS = 2`):

1. Household name (min 2). Info note: start alone, invite later.
2. Cash account name, opening balance (`AmountField`, default `0`), jar preset `balanced` \| `simple` \| set-up-later (`null`). Skip account (`onboard-skip-account`) omits account name, forces `planPreset` null, still sends `openingBalance`. Back + Finish.

Completion: `createHouseholdAction` → server `redirect` to `/home`. Client state only; no draft persistence.

Opening balance meaning in copy: money already in the account, not income.

Hũ / jars: intention envelopes via `planPreset`, not a cash account.

## Invite

`getInvitationPreview(token)` + accept/decline actions. Token stays in the URL `next` path for sign-in; it is not rendered as visible text.

## Existing copy / validation

Namespaces: `auth`, `onboard`, `together.accept`, plus `validation` / `common`.

Password minimum remains `PASSWORD_MIN_LENGTH` (8). No new strength rules.

## UX problems found (presentation)

- Welcome quoted Home with a decorative `aria-hidden` preview (static illustration values, badged Preview). Restored after review so Welcome matches the previous product entry.
- Auth glow used a marketing gradient wash.
- Onboarding Skip sat in the top-right of step 2, easy to miss, and visually disconnected from Finish.
- Invite used a hero card with `border-white/15` and a one-off primary Link style.
- Login Suspense fallback was `null`.

## Explicitly not changed

Authentication providers, actions, callbacks, redirects, session/cookies/tokens/PKCE, password reset and email verification mechanics, household RPC payload, membership rules, validation schemas, five-tab navigation, database, Supabase policies.

## Conflict logged (not implemented as behavior change)

Design-system S1 describes a Home-quoting decorative preview with static illustration values. After review, Welcome keeps that previous product preview (badged Preview, `aria-hidden`). Other Phase 15 auth/onboarding presentation work remains.
