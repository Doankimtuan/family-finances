# Implementation Order — sprint-001

## Across stories

Strict sequence (see [story-order.md](./story-order.md)):

1. `ST-E01-001`
2. `ST-E01-003`
3. `ST-E01-002`
4. `ST-E02-001`
5. `ST-E02-002`
6. `ST-E02-003`

## Within each story (layering)

Apply in order; skip layers that are N/A for verify stories:

1. **Database / Auth config** — env, Supabase Auth project (E02); no inventing ledger migrations for email/password session
2. **Domain / application** — tenancy session helpers, membership fail-closed checks (E02-002)
3. **Repository / adapters** — Supabase Auth adapters under `modules/platform` or `modules/tenancy` per Architecture
4. **Server Actions / API** — login, register, reset; auth inside each action
5. **Hooks** — client session readers if required by blueprint
6. **UI** — Screen Blueprints + Design System only; `shared/ui` only
7. **Routing / i18n** — `app/[locale]/…`; `messages/{en,vi}/*.json`
8. **Integration** — proxy session refresh; layout composition
9. **Tests** — unit + Playwright where applicable
10. **Review** — Architecture + Story DoD

## Avoid

- Circular imports between layout and domain
- Calling Server Actions without auth checks
- Product BottomNav on auth routes
- Hardcoded user-facing English/Vietnamese outside catalogs
- Imports from `archive/`
