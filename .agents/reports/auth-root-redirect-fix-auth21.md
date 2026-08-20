# AUTH.2.1 — Root Locale Redirect + Persistent Supabase Session

## Final verdict

AUTH ROOT REDIRECT FIXED

## Root cause

`app/[locale]/page.tsx` always rendered the public landing page and never
resolved the server-side Supabase session. Authenticated users therefore stayed
on the public entry flow when opening `/vi` directly.

The existing SSR session infrastructure was already present: `proxy.ts` calls
`updateSession()` after next-intl routing, and `updateSession()` calls
`supabase.auth.getClaims()`, updates the request cookies, and writes refreshed
cookies to the same composed response. No localStorage token or custom JWT
persistence was added.

## Fix

- Added `resolveAuthenticatedEntryPath()` which reuses the existing
  `resolveAuthEntry()` membership-aware canonical destination.
- Made `/[locale]` server-side auth-aware. Authenticated users redirect to
  `/home` (or the existing `/together/onboard` destination); unauthenticated
  users keep the existing public landing flow.
- Added the same server-side guard to `/[locale]/login` and
  `/[locale]/welcome`.
- Preserved the requested locale through `setLocale()` and next-intl
  `redirect()`.
- Used no client `useEffect` redirects and no token persistence changes.

## Regression coverage

- Unauthenticated `/vi` renders the existing public entry flow.
- Authenticated browser flow logs in with `.env.local` credentials, reaches
  `/vi/home`, reloads `/vi/home`, then opens `/vi`, `/vi/login`, and
  `/vi/welcome`; each final URL is `/vi/home` without another login.

## Verification

- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run test` — 131 files, 979 tests passed
- Prettier on the AUTH.2.1 touch set — passed
- `npx playwright test tests/e2e/auth-entry.smoke.spec.ts --project=chromium` — 4 passed
- `npm run e2e:auth-check` — 3 passed, including the direct `/vi` authenticated case

The repository-wide `npm run test:e2e` also ran, but its existing data/fixture
and unrelated UI-flow failures produced 30 failures, 3 skips, and 12 tests not
run; both AUTH.2.1 regression suites passed.

Repository-wide `npm run format:check` is also already red across 2,200 files;
the AUTH.2.1 touch set passes targeted Prettier verification.
