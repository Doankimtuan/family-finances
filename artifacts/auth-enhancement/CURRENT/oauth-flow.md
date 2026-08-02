---
document: OAuth Flow
pack: auth-enhancement
version: v1.0.0
status: AUTHENTICATION_STRATEGY_V2
run_id: run_auth_enhancement_20260802T014240Z
created_at: 2026-08-02T01:42:40Z
frozen: true
sot_untouched: true
---

# OAuth Flow (Google + Apple)

## Intent

Specify Supabase-compatible Google and Apple sign-in for the Next.js rewrite, reusing the existing confirm adapter where possible.

## Prerequisites (Supabase dashboard)

| Item | Requirement |
|------|-------------|
| Auth → Providers → Google | Enabled; Web client ID + secret from Google Cloud Console |
| Auth → Providers → Apple | Enabled; Services ID, Secret Key (`.p8`), Key ID, Team ID |
| URL configuration | Site URL = app origin; Redirect URLs include `{origin}/auth/confirm` (and local/preview variants) |
| Email provider | Remains enabled for register / forgot / password users |
| Automatic linking | Enable when product accepts same verified email → one user (see [account-linking.md](./account-linking.md)) |

Apple web Sign in requires the Apple Services ID return URL to match Supabase’s callback host (`https://<project-ref>.supabase.co/auth/v1/callback`), not only the app confirm route. The app allowlists `/auth/confirm` as the **client** redirect after Supabase finishes the provider hop.

## Client start (application)

Proposed tenancy application command (future implementation — not built in this board run):

```ts
// Conceptual — do not implement in this freeze
startOAuthSignIn({ provider: "google" | "apple", redirectTo: `${origin}/auth/confirm` })
// → supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: false } })
```

Rules:

- Prefer browser OAuth redirect (PKCE) for web MVP.
- Fail closed if Supabase env is unconfigured (same as email auth).
- Pass `redirectTo` pointing at locale-less `/auth/confirm` (existing adapter).
- Optional `next` query for post-login destination must remain path-safe (existing confirm rules).

Native Apple `signInWithIdToken` is out of scope for web-first MVP; may be a later mobile story.

## Provider hop

```mermaid
sequenceDiagram
  participant Browser
  participant App as NextApp
  participant SB as SupabaseAuth
  participant IdP as GoogleOrApple

  Browser->>App: Tap Continue with Google or Apple
  App->>SB: signInWithOAuth
  SB->>IdP: Authorize
  IdP->>SB: Authorization response
  SB->>Browser: Redirect to /auth/confirm?code=...
  Browser->>App: GET /auth/confirm
  App->>SB: exchangeCodeForSession(code)
  App->>Browser: Set SSR cookies; redirect /home or next
```

## Callback reuse

Existing [`app/auth/confirm/route.ts`](../../../app/auth/confirm/route.ts):

1. If `code` present → `exchangeCodeForSession(code)`.
2. Else OTP `token_hash` + `type` (email confirm / recovery) unchanged.
3. Success → `/{locale}/home` or safe `next`.
4. Failure → `/{locale}/auth/confirm?status=error&code=…`.

OAuth needs **no separate callback route** if redirect URLs and PKCE are configured correctly. Confirm UI copy may need a generic “Could not complete sign-in” variant for OAuth failures (blueprint delta).

## Failure UX

| Case | User-visible outcome |
|------|----------------------|
| User cancels IdP | Return to Login; no session; calm message optional |
| Invalid/expired code | Confirm error UI → Continue to Login |
| Provider misconfigured | Fail closed Alert on Login or Confirm `unconfigured` / `unknown` |
| Linking conflict | See [account-linking.md](./account-linking.md); do not invent a second profile |

## Screen Blueprint deltas (proposal only)

Do **not** edit `artifacts/screen-blueprints/CURRENT` in this freeze.

### `auth.login`

Replace information hierarchy with:

1. Continue with Google  
2. Continue with Apple  
3. Divider  
4. Continue with Email (email, password, submit)  
5. Register link  
6. Forgot password link  

Primary actions: OAuth continues + email Sign in. Components: Button (OAuth + submit), Input (email path), Alert, Text, Divider. Guest CTA forbidden.

### `auth.welcome`

Keep Login / Register CTAs; Login lands on OAuth-first screen. Optional label polish: “Continue” language aligned with Login (not required for freeze).

### `auth.register`

Remain email+password. Note in blueprint: users may instead Continue with Google/Apple on Login (provider creates account). No guest.

### `auth.confirm`

Purpose expands: email magic/confirm **and** OAuth PKCE exchange result UI (errors). Success path still usually redirects away before UI.

### `flow.auth-onboard-home`

Alt path: Login → OAuth → confirm exchange → home/onboard (parallel to email/password).

## Technical Specification deltas (proposal only)

| Area | Proposal |
|------|----------|
| Page specs | Document OAuth start from `/login`; callback `/auth/confirm` |
| `modules/tenancy` | Commands: `startOAuthSignIn`, keep `signInWithPassword` / `signUpWithPassword` |
| Security specs | List Google/Apple providers; redirect allowlist; PKCE only |
| Env / ops | Dashboard secrets stay in Supabase; app keeps public URL + publishable key only |

## i18n (proposal)

Add keys under `auth.login` for Google / Apple / divider / continueWithEmail; keep en/vi parity. No copy changes in this freeze.
