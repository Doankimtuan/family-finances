# ST-E02-004 — Architecture Review

## Placement

- Application: `modules/tenancy/application/start-oauth-sign-in.ts`
- Thin Server Action: `startOAuthAction` in login route folder
- Callback: existing `app/auth/confirm` (`exchangeCodeForSession`)

## Security

- IdP secrets stay in Supabase dashboard (not in app env).
- Fail closed when Supabase unconfigured.
- `redirectTo` is app-origin `/auth/confirm` (client-supplied origin + fixed path).

## Session

- OAuth and email sessions both land in SSR cookies after confirm / password sign-in.
- Proxy `getClaims()` refresh unchanged.

## Verdict

**APPROVED** — compatible with Architecture Authentication Flow v2.1.0.
