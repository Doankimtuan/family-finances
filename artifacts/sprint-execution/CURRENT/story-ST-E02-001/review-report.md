# ST-E02-001 — Review Report

## Frontend

- Welcome uses EmptyState + shared Button; no raw HeroUI outside wrappers/patterns.
- Splash uses `useEffectEvent` for stable resolve callback.

## Architecture

- Session resolve in `modules/tenancy/application`; Supabase via platform clients.
- Unconfigured Auth fails closed to welcome (not inventing mock session).

## QA

- Unit covers configured/unconfigured/signed-in paths.
- E2E: landing→welcome, CTAs visible, splash→welcome when signed out.

## Verdict

**APPROVED** — freeze story.
