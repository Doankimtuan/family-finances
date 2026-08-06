# Dependency Graph — Sprint 0 Bootstrap

**Run:** `run_sprint0_bootstrap_20260801T234900Z`  
**Scope:** Root product graph only (`archive/` and `ai-os/` excluded from runtime)

## Layers

```text
┌─────────────────────────────────────────────────────────┐
│  app/  (Next.js App Router — pages, layouts, API)       │
└───────────────────────┬─────────────────────────────────┘
                        │ imports
┌───────────────────────▼─────────────────────────────────┐
│  providers/  features/  shared/{ui,patterns,hooks,lib}   │
└───────┬───────────────────────┬─────────────────────────┘
        │                       │
┌───────▼────────┐    ┌─────────▼─────────────────────────┐
│  modules/*     │    │  Approved UI / state packages     │
│  application   │    │  HeroUI, Phosphor, Motion,        │
│  (future)      │    │  next-themes, RHF, TanStack, etc. │
└───────┬────────┘    └───────────────────────────────────┘
        │
┌───────▼────────┐
│  platform      │
│  Supabase SSR  │
└────────────────┘
```

## Runtime edges (declared today)

| Consumer | Package | Edge type | Status |
|----------|---------|-----------|--------|
| `app/**` | `next`, `react`, `react-dom` | framework | Active |
| (planned) providers | `@tanstack/react-query` | server state | Declared, unwired |
| (planned) providers | `next-themes` | theme | Missing |
| (planned) providers | `@supabase/ssr`, `@supabase/supabase-js` | backend | Declared, unwired |
| (planned) `shared/ui` | `@heroui/react`, `@heroui/styles` | UI | Missing |
| (planned) `shared/ui` | `tailwind-variants` | variants | Missing |
| (planned) icons | `@phosphor-icons/react` | icons | Missing |
| (planned) motion | `motion` | animation | Missing |
| (planned) forms | `react-hook-form`, `zod`, `@hookform/resolvers` | forms | Partial (zod only) |
| (planned) charts | `recharts` | charts | Missing |
| (planned) dates | `date-fns` | util | Missing |
| (planned) UI state | `zustand` | client state | Declared, unwired |

## Build / style edges

| Consumer | Package | Edge type |
|----------|---------|-----------|
| PostCSS | `@tailwindcss/postcss`, `tailwindcss` | CSS pipeline |
| Next build | `typescript`, `@types/*` | compile |
| Fonts | `geist` (planned) | typography |

## Test edges

| Consumer | Package | Edge type | Status |
|----------|---------|-----------|--------|
| `npm test` | `vitest`, `jsdom`, Testing Library | unit | Partial |
| `npm run test:e2e` | `@playwright/test`, `playwright` | e2e | Partial |

## Quality / DX edges

| Consumer | Package | Edge type | Status |
|----------|---------|-----------|--------|
| ESLint | `eslint`, `eslint-config-next`, `eslint-plugin-unused-imports` | lint | Broken (plugin missing) |
| Prettier | `prettier`, `eslint-config-prettier` | format | Missing |
| Git hooks | `husky`, `lint-staged` | pre-commit | Missing |

## Forbidden edges (must remain zero)

| From | To | Rule |
|------|----|------|
| Product code | `archive/**` | Constitution |
| Product code | `ai-os/**` | Constitution |
| `shared/ui` | Second UI kit | Design Foundation |
| Domain modules | UI packages | Architecture |

## Post-bootstrap target graph

```text
app/layout → providers/app-provider
  → theme-provider (next-themes)
  → query-provider (@tanstack/react-query)
  → supabase-provider (@supabase/ssr)
  → toast-provider / modal-provider

app/(product)/layout → shared/patterns/AppViewport
  → BottomNavigation (@phosphor-icons/react)
  → TopAppBar
  → children (route stubs)

shared/ui/* → @heroui/react + tokens + tailwind-variants
shared/patterns/* → shared/ui
styles/* → tailwindcss + @heroui/styles + ViNha tokens
```
