---
document: Security Review
pack: auth-enhancement
version: v1.0.0
status: AUTHENTICATION_STRATEGY_V2
run_id: run_auth_enhancement_20260802T014240Z
created_at: 2026-08-02T01:42:40Z
frozen: true
sot_untouched: true
---

# Security Review — Authentication Strategy v2

## Scope

Review OAuth, session, refresh tokens, account linking, logout, delete account, token rotation, and protected routes for compatibility with Supabase Auth SSR as used by this rewrite.

Baseline code (not modified by this board):

- [`proxy.ts`](../../../proxy.ts) + [`modules/platform/supabase/update-session.ts`](../../../modules/platform/supabase/update-session.ts) — claim refresh
- [`app/auth/confirm/route.ts`](../../../app/auth/confirm/route.ts) — PKCE / OTP exchange
- [`modules/tenancy/application/assert-money-action-allowed.ts`](../../../modules/tenancy/application/assert-money-action-allowed.ts) — money gate
- Email password paths (S1) — fail closed when unconfigured

## OAuth

| Control | Requirement |
|---------|-------------|
| Protocol | Supabase-hosted OAuth + PKCE; app does not store IdP client secrets |
| Secrets | Google/Apple secrets live in Supabase dashboard only |
| Redirect allowlist | Strict Site URL + Redirect URLs; only app-owned paths (`/auth/confirm`) |
| `next` param | Allow only same-origin relative paths (existing confirm sanitization) |
| CSRF / state | Rely on Supabase PKCE/state; do not roll custom state stores |
| Provider buttons | Do not pass tokens through query strings into product pages |
| Fail closed | Unconfigured env → no OAuth start; same pattern as password |

## Session

| Control | Requirement |
|---------|-------------|
| Storage | HTTP cookies via `@supabase/ssr` server + browser clients |
| Server trust | Authorize with `getUser()` / validated claims — not raw client `getSession()` alone for money |
| Parity | OAuth and password sessions are indistinguishable to product gates |
| Locale | Confirm adapter sets cookies then redirects into locale routes |

## Refresh token

| Control | Requirement |
|---------|-------------|
| Refresh path | `updateSession` on proxy using `getClaims()` continues to apply to OAuth sessions |
| Rotation | Supabase-managed refresh token rotation; app must not persist refresh tokens in `localStorage` |
| Leakage | No logging of access/refresh tokens; PII redaction in logs (existing Security Specs) |

## Account linking

| Control | Requirement |
|---------|-------------|
| Policy | `BR-02b` — one user per verified email when linking supported |
| Auto-link | Enable in project only with product acceptance of merge behavior |
| Manual link | Authenticated `linkIdentity` only; verify session first |
| Conflicts | Fail closed; never silent data merge across two `auth.users` ids |
| Enumeration | Linking errors must not reveal other users’ household data |

See [account-linking.md](./account-linking.md).

## Logout

| Control | Requirement |
|---------|-------------|
| Gap today | Rewrite has **no** sign-out route (legacy had `app/auth/signout`) |
| Required | Server-side `supabase.auth.signOut()` + cookie clear; redirect to Login/Welcome |
| Scope | Global sign-out for web MVP (all sessions) unless product later specifies local-only |
| OAuth | Sign-out clears Supabase session; IdP session may persist (expected); next OAuth may skip consent |

Proposed adapter: `app/auth/signout` route or Server Action under tenancy — story `ST-E02-006`.

## Delete account

| Control | Requirement |
|---------|-------------|
| Gap today | Not implemented in rewrite |
| Auth deletion | Use Supabase Admin API or documented user deletion flow with service role **only on server**; never expose service role to client |
| Data | Cascade or explicit deletion of membership/ledger per future data policy; must not leave orphaned PII contrary to product rules |
| Confirmation | Destructive UX with explicit confirm; re-auth step recommended for password users; recent OAuth session acceptable if within short window |
| Provider | Deleting Auth user does not delete Google/Apple accounts at IdP |

Story coverage under `ST-E02-006` (or split later); security review mandates design before implementation.

## Token rotation

| Control | Requirement |
|---------|-------------|
| Access JWT | Short-lived; refreshed via Supabase SSR helpers |
| Provider secrets | Apple `.p8` / Google client secret rotation is ops runbook (dashboard), not app code |
| Publishable key | Rotatable; update env; fail closed if invalid |

## Protected routes

| Surface | Gate |
|---------|------|
| Proxy | Refresh only — **does not** redirect unauthenticated users (by design today) |
| Product layouts / pages | Redirect unauthenticated → Login (e.g. money) |
| Money actions | `assertMoneyActionAllowed` — auth + active membership (`REQ-002`) |
| Auth screens | Reachable without session; if session exists, splash/entry may send to Home |
| Server Actions | Authenticate inside each action (existing engineering rule); OAuth does not change this |
| Guest | Forbidden — no bypass routes |

## Threat notes

1. **Open redirect** — Keep `next` sanitization on confirm; extend tests when OAuth lands.
2. **Account takeover via linking** — Only link verified emails; prefer Supabase automatic linking settings that require verification.
3. **Duplicate user split-brain** — Highest product risk if auto-link off; treat as P0 config + conflict UX.
4. **XSS session theft** — Existing CSP + no token-in-JS-storage policy remains mandatory.

## Technical Specification deltas (proposal only)

Extend `security/Security-Specs.md` with:

- Google + Apple OAuth via Supabase  
- PKCE callback `/auth/confirm`  
- Identity linking / `BR-02b`  
- Sign-out + delete-account server adapters  
- Refresh via proxy `getClaims()` (unchanged)  
- No guest mode  

## Verdict

Authentication Strategy v2 is **compatible with Supabase Auth SSR** if: providers and redirect URLs are configured correctly, confirm exchange remains the sole OAuth callback, linking policy is enforced, and logout/delete gaps are closed before calling account lifecycle complete.
