# Implementation Order — sprint-001

## Across stories

Strict sequence (see [story-order.md](./story-order.md)):

1. `ST-E01-001` — DONE  
2. `ST-E01-003` — DONE  
3. `ST-E01-002` — DONE  
4. `ST-E02-001` — DONE  
5. `ST-E02-002` — DONE  
6. `ST-E02-003` — DONE  
7. `ST-E02-004` — DONE (Google Login + Apple Login)  
8. `ST-E02-005` — DONE (Account Linking)  
9. `ST-E02-006` — **NEXT** (Sign-out + delete)  

## Within each residual auth story (layering)

1. **Auth config** — Supabase Google/Apple providers; redirect URLs; linking policy (`ST-E02-005`)
2. **Domain / application** — `StartOAuthSignIn`, linking error maps, `SignOut` / `DeleteAccount`
3. **Adapters** — Supabase Auth OAuth / link / sign-out under tenancy/platform
4. **Server Actions / routes** — OAuth start; confirm reuse; sign-out adapter
5. **UI** — OAuth-first Login per Screen Blueprints v1.1.0; Pattern v1 shells
6. **Routing / i18n** — `messages/{en,vi}` auth keys for Google/Apple/linking
7. **Integration** — proxy session refresh unchanged; no guest
8. **Tests** — unit + Playwright per [quality-gates.md](./quality-gates.md)
9. **Review** — Story DoD in [definition-of-done.md](./definition-of-done.md)

## Avoid

- Rebuilding email baseline stories (`ST-E02-002` / `003`) unless regression
- Inventing guest mode or duplicate profiles
- Parallel multi-story work
