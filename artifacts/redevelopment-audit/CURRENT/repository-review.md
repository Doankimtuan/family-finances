# Repository Review

## Structure Observed

Top-level application structure:

- `app/`: Next.js App Router with locale segment, route groups, API routes, and global auth routes.
- `modules/`: bounded contexts and platform adapters.
- `shared/`: reusable UI, patterns, hooks, i18n helpers, theme, utils.
- `components/`: scaffold only.
- `providers/`: app-level client providers.
- `packages/`: scaffold only.
- `styles/`: global Tailwind v4 and HeroUI theme bridge.

Configuration:

- `package.json`: Next 16, React 19, HeroUI 3, Tailwind 4, next-intl, Supabase, React Query, Motion, Recharts, Phosphor icons.
- `next.config.ts`: next-intl plugin only.
- `postcss.config.mjs`: Tailwind v4 `@tailwindcss/postcss`.
- No standalone Tailwind config was found; Tailwind is configured through CSS.

## Clean Areas

- Route groups are cleanly separated into `(auth)`, `(invite)`, `(onboard)`, `(product)`, and `(system)`.
- Bounded contexts are visible under `modules/`.
- Providers are isolated from route files.
- `styles/globals.css` centralizes semantic tokens and bridges HeroUI variables.
- `APP_PATH` centralizes canonical in-app route constants.

## Structural Issues

| Issue | Severity | Redesign impact | Implementation effort |
|---|---|---:|---:|
| `archive/legacy-v1` remains in the repository. It is excluded from Tailwind source scanning, but its presence still increases audit/search noise. | Medium | Medium | Low |
| `components/` is scaffold-only while reusable components live in `shared/ui` and `shared/patterns`. This creates ambiguity about where new redesign components should go. | Medium | Medium | Low |
| `packages/` is scaffold-only. If no package boundary is planned for Phase B, it reads as unused architecture. | Low | Low | Low |
| Multiple `modules/*/{domain,infrastructure}` folders are `.gitkeep` placeholders. This makes context ownership look broader than implemented reality. | Low | Low | Low |
| `modules/shared-kernel` is scaffold-only and currently does not provide visible shared contracts. | Medium | Medium | Low |
| `app/api/v1` exists only as scaffold documentation. It should be called out as inactive during IA redesign. | Low | Low | Low |

## Readiness

Repository structure is generally clean and suitable for redesign planning. The main prep task is pruning or explicitly labeling scaffold/legacy surfaces so Phase B participants do not mistake placeholders for active architecture.

