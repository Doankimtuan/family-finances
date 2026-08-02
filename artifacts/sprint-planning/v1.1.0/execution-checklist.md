# Execution Checklist — sprint-001

Use during implementation. Check items only when evidence exists.

## Pre-flight

- [ ] Read `ai-implementation-contract.md`
- [ ] Confirm `.env.local` Supabase Auth keys (before E02-002)
- [ ] Confirm working tree base: bootstrap + localization already on branch

## ST-E01-001

- [ ] AppViewport 440px verified
- [ ] Tokens + next-themes verified
- [ ] No archive imports
- [ ] `/en` + `/vi` smoke
- [ ] Gaps closed if any
- [ ] Gates green → next story

## ST-E01-003

- [ ] Auth primitive inventory complete
- [ ] Missing `shared/ui` wrappers added only as needed
- [ ] Unit smoke green
- [ ] Gates green → next story

## ST-E01-002

- [ ] Product chrome (BottomNav + TopAppBar) verified locale-aware
- [ ] Auth layout without BottomNav ready/verified
- [ ] a11y targets verified
- [ ] Gates green → next story

## ST-E02-001

- [ ] Splash + Welcome routes
- [ ] Auth layout applied
- [ ] `messages/{en,vi}/auth.json` filled
- [ ] Landing → Welcome (no `/home` bypass)
- [ ] Tests green
- [ ] Gates green → next story

## ST-E02-002

- [ ] Env verified or STOP
- [ ] Login + confirm screens
- [ ] Session establishment
- [ ] Unauthenticated / membership fail-closed gates
- [ ] Playwright login happy path
- [ ] i18n complete
- [ ] Gates green → next story

## ST-E02-003

- [ ] Register + forgot-password screens
- [ ] Supabase signUp / reset flows
- [ ] Links from login; confirm reuse
- [ ] Tests + i18n
- [ ] Gates green → next story

## ST-E02-004

- [ ] Google + Apple providers configured
- [ ] OAuth-first Login UI
- [ ] `signInWithOAuth` + `/auth/confirm` exchange
- [ ] Tests + i18n
- [ ] Gates green → next story

## ST-E02-005

- [ ] Linking policy + conflict UX
- [ ] No duplicate profiles (BR-02b)
- [ ] Gates green → next story

## ST-E02-006

- [ ] Sign-out adapter
- [ ] Delete-account path + confirm
- [ ] Gates green

## Sprint exit

- [ ] Success criteria demo passed ([success-criteria.md](./success-criteria.md))
- [ ] Sprint DoD: AppViewport + login session works (email + OAuth-first)
