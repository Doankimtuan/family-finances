# Sprint Goals — sprint-001 (S1)

## Primary goal

Deliver **Shell + Auth** so a returning user can establish a Supabase Auth session inside the 440px AppViewport with Calm Ledger chrome.

## Exit criteria (SoT)

From `artifacts/implementation-plan/CURRENT/sprints/S1.md`:

> AppViewport + login session works

## Demo script (SoT)

> Open app → Welcome → Login → session established → shell chrome visible at 440px

## Goals broken down

1. **Confirm shell foundation (E01)** — AppViewport, tokens, BottomNav/TopAppBar, `shared/ui` meet Story DoD; close gaps only; do not rebuild bootstrap.
2. **Auth entry (E02)** — Splash + Welcome per Screen Blueprints; landing no longer bypasses auth into `/home`.
3. **Session (E02)** — Login + confirm; SSR session via existing Supabase clients + `proxy.ts` refresh; unauthenticated product gates; AC-002 fail-closed membership stub for money actions (no S2 onboard UI).
4. **Account recovery path (E02 P1)** — Register + forgot password per blueprints.
5. **i18n** — All new user-facing strings in `messages/{en,vi}`; `auth.json` filled from blueprint copy.
6. **Quality** — Each story passes gates before the next starts; Sprint DoD satisfied.

## Non-goals

- Household create/join / onboard ≤3 (S2)
- Ledger writes, jars, inbox resolve
- Approvals / AI / offline write queue
