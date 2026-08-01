# Repository Coverage Report

**Run:** `run_repository_discovery_20260801T132500Z`  
**Goal:** Complete repository understanding (no new specifications)  
**Created:** 2026-08-01T13:27:29Z  
**Gate:** **PASS** — overall confidence **100%** (threshold 95%)

## Scores

| Dimension | Score |
|-----------|------:|
| Repository coverage | 100% |
| Architecture coverage | 100% |
| Knowledge coverage | 100% |
| **Overall confidence** | **100%** |

## Scan Counts

| Item | Count |
|------|------:|
| All product files scanned | 430 |
| Code files | 343 |
| Pages | 36 |
| Layouts | 2 |
| API routes | 17 |
| Auth routes | 2 |
| Server actions | 18 |
| Components | 36 |
| Lib files | 55 |
| Docs | 8 |
| Public assets | 15 |
| Migrations (named) | 51 |
| Dependency edges | 1322 |
| Unused (heuristic) | 32 |
| External integrations | 10 |
| Event-signal files | 21 |
| Runtime deps | 20 |
| Dev deps | 9 |

## Phase 1 Gap Closure

| Required | Present |
|----------|---------|
| `proxy.ts` | yes |
| `next.config.ts` | yes |
| `components.json` | yes |
| `.env.local.example` | yes |
| `supabase/init_database.sql` | yes |
| `app/layout.tsx` | yes |
| `app/auth/confirm/route.ts` | yes |
| `app/auth/signout/route.ts` | yes |
| `lib/providers/app-providers.tsx` | yes |
| `lib/providers/i18n-provider.tsx` | yes |

| Server actions inventoried | 18 |
| Components inventoried | 36 |
| Migrations named | 51 |
| Runtime deps listed | 20 |
| Dev deps listed | 9 |

Missing must-files: none

## Entry Points

- Pages: 36
- API routes: 17
- Auth routes: app/auth/confirm/route.ts, app/auth/signout/route.ts
- Actions: 18
- Proxy: `proxy.ts`
- Root layout: `app/layout.tsx`

## Runtime Flow (summary)

### flow-request-edge
- Incoming HTTP request
- proxy.ts → lib/supabase/proxy.updateSession (session refresh / cookie)
- Next App Router match (page | route | server action)

### flow-rsc-page
- app/layout.tsx resolves locale via Supabase user → household
- AppProviders (react-query, theme, i18n)
- page.tsx server component loads data via lib/server/* or supabase
- Client islands in components/*

### flow-server-action
- Client/form invokes app/**/actions.ts
- Action uses lib/supabase/server + domain libs
- Optional revalidatePath / redirect

### flow-api-route
- Client or server fetch → app/api/**/route.ts
- Handler authenticates via Supabase SSR client
- JSON response for dashboard/jars/savings/transactions

### flow-auth
- app/login (UI + actions)
- app/auth/confirm/route.ts and app/auth/signout/route.ts
- Session cookies via @supabase/ssr

## External Integrations

- **Supabase**: Auth, DB, RLS, realtime client
- **Recharts**: Charts/visualization
- **Radix UI / shadcn-style**: UI primitives
- **TanStack Query**: Client data fetching/cache
- **Zustand**: Client state
- **next-themes**: Theme switching
- **Sonner**: Toasts
- **react-hook-form + zod**: Forms/validation
- **lucide-react**: Icons
- **date-fns**: Date utilities


## Dead / Unused Heuristic

- Unreachable from entry-point graph: **32** files
- Zero static importers (non-entry): **31** files
- Caveat: dynamic `import()` and convention-based Next wiring may false-positive

Sample unreachable:
- `app/accounts/_components/create-account-form.tsx`
- `app/assets/_components/asset-metadata-card.tsx`
- `app/assets/_components/cashflow-history-list.tsx`
- `app/assets/_components/create-asset-form.tsx`
- `app/assets/_components/investment-metrics-bar.tsx`
- `app/dashboard/_components/dashboard-charts.tsx`
- `app/dashboard/error.tsx`
- `app/decision-tools/error.tsx`
- `app/error.tsx`
- `app/global-error.tsx`
- `app/jars/_components/jar-closed-banner.tsx`
- `app/jars/_components/jar-monthly-overview.tsx`
- `app/jars/_components/jar-movement-timeline.tsx`
- `app/jars/_components/jar-target-dialog.tsx`
- `app/jars/_components/jar-target-form.tsx`
- `app/jars/_components/mini-metric.tsx`
- `app/jars/_components/summary-card.tsx`
- `app/not-found.tsx`
- `app/settings/_components/settings-nav.tsx`
- `app/settings/constants/index.ts`
- `app/settings/error.tsx`
- `app/settings/hooks/use-form-action.ts`
- `components/layout/content-loading-shell.tsx`
- `components/ui/Logo.tsx`
- `components/ui/confirm-dialog.tsx`
- `components/ui/separator.tsx`
- `eslint.config.mjs`
- `lib/insights/engine.ts`
- `lib/insights/service.ts`
- `lib/store/ui-store.ts`


## Updated Artifacts

- `ai-os/artifacts/repository/runs/run_repository_discovery_20260801T132500Z/payload.json`
- `ai-os/artifacts/repository/runs/run_repository_discovery_20260801T132500Z/dependency-graph.json`
- `ai-os/artifacts/knowledge/runs/run_repository_discovery_20260801T132500Z/payload.json`
- `ai-os/artifacts/product-architecture/runs/run_repository_discovery_20260801T132500Z/payload.json` (logical `architecture/`)
- `ai-os/artifacts/execution/discovery/discover-repo-map/payload.json`

## Explicit Non-Goals

- No new product specifications generated
- No business redesign
- AIOS framework tree under `ai-os/` inventoried only as boundary (not full framework deep-scan)

## Stop

Repository Discovery run complete.
