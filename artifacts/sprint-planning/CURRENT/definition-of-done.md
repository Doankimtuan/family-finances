# Definition of Done — sprint-001 (Auth Strategy v2)

Source baseline: `artifacts/implementation-plan/CURRENT/definition-of-done/DoD.md`.  
This pack adds **auth-specific** Story DoD for Google Login, Apple Login, and Account Linking. Unrelated product stories keep the baseline DoD only.

## 1. Baseline Story DoD (all S1 stories)

- [ ] Implements referenced Screen Blueprint(s) (hierarchy, actions, states)
- [ ] Uses Design System components only (HeroUI via `shared/ui` / Pattern v1)
- [ ] AppViewport 440px; no sidebar; mobile-native
- [ ] Listed AC checked and evidenced
- [ ] No guest mode / anonymous product access
- [ ] No import from `archive/legacy-v1`
- [ ] i18n: all new strings in `messages/{en,vi}` with key parity
- [ ] Quality gates green for the story

## 2. Story DoD — `ST-E02-004` Google Login + Apple Login

- [ ] Login hierarchy official: Continue with Google → Continue with Apple → divider → Continue with Email → Register → Forgot
- [ ] **Google:** `StartOAuthSignIn({ provider: "google" })` → PKCE → `/auth/confirm` → session cookies
- [ ] **Apple:** `StartOAuthSignIn({ provider: "apple" })` → PKCE → `/auth/confirm` → session cookies
- [ ] Email password path still works on same screen
- [ ] Fail closed when Supabase / provider unconfigured (Alert; no fake session)
- [ ] Auth chrome: no BottomNav; `#app-viewport-root` present
- [ ] AC-002a evidenced; REQ-002a cited
- [ ] Unit + Playwright smoke (OAuth buttons/chrome; IdP happy path may be env-gated)
- [ ] Dashboard: Google + Apple providers enabled; redirect allowlist includes `/auth/confirm`

## 3. Story DoD — `ST-E02-005` Account Linking

- [ ] Same verified email across providers resolves to one `auth.users.id` when Supabase linking supports it (`BR-02b`)
- [ ] No duplicate app profiles / memberships created for linked identities
- [ ] Conflict / linking-disabled errors map to stable UI codes (fail closed)
- [ ] Ops note: automatic linking policy recorded (B-ENV-05 resolved or STOP)
- [ ] AC-002b evidenced; REQ-002a / BR-02b cited
- [ ] Unit tests for conflict code mapping; e2e checklist for linking (may be manual)

## 4. Story DoD — `ST-E02-006` Sign-out + delete (auth lifecycle)

- [ ] Server `SignOut` clears SSR cookies; user lands on Login/Welcome
- [ ] Delete-account server path + confirm UX (service role never on client)
- [ ] Post-logout: no product money access without re-auth
- [ ] AC-002a lifecycle evidenced

## 5. Sprint DoD (S1 after Auth Strategy v2)

- [ ] Demo: Open app → Welcome → Login → **Google or Apple or Email** session → shell at 440px
- [ ] Email baseline stories (`ST-E02-001`…`003`) remain accepted
- [ ] Google Login, Apple Login, Account Linking DoD above complete
- [ ] No open P0 defects on committed auth stories
- [ ] Acceptance mapping 100% for `AC-002`, `AC-002a`, `AC-002b` on delivered stories
- [ ] Unauthenticated money mutations fail closed (`AC-002`)
- [ ] No guest mode shipped
