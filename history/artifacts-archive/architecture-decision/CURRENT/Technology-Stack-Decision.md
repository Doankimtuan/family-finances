---
generated_by: Architecture Decision Board
run_id: run_architecture_decision_20260801T151000Z
created_at: 2026-08-01T14:53:32Z
status: FROZEN
architecture_decision: LOCKED
selected: Candidate-B-Balanced-Modified
product_sot: artifacts/product-definition/CURRENT
strategy_run: run_architecture_strategy_20260801T150000Z
---

# Technology Stack Decision

## Locked stack

| Concern | Decision |
|---------|----------|
| Frontend | Next.js App Router + React 19 |
| Backend | Next.js server (Server Actions + Route Handlers) with application-service layer per bounded context |
| Database | PostgreSQL via Supabase |
| Orm Data Access | Supabase client + SQL; Drizzle optional for typed server repositories (not mandatory rewrite) |
| Authentication | Supabase Auth SSR with proxy.ts session refresh |
| Authorization | Supabase RLS (is_household_member) + app-layer admin gates per Product Permission Matrix |
| Api Style | Zod-validated application commands/queries; HTTP JSON facade under /api/v1 (or oRPC equivalent) for read models and externalizable contracts; Server Actions allowed as UI adapters calling the same services |
| Folder Structure | Monorepo single app + packages/modules sliced by bounded context: tenancy, ledger, plan, inbox, health; app routes grouped by product IA (home, money, plan, inbox, together) |
| State Management | RSC as server truth; TanStack Query for client server-state; Zustand only for ephemeral UI state |
| Caching | HTTP/CDN caching for public assets; TanStack Query cache for client; server-side request memoization; no offline write cache; Future offline-read is out of scope for this decision |
| Infrastructure | Managed Supabase + Vercel (or equivalent Node host for Next); managed worker platform when workers enabled (e.g. Inngest/Trigger.dev/Edge Functions) |
| Deployment | Git-based preview + production deploys for web; Supabase migrations via controlled pipeline |
| Testing | Unit (Vitest) for domain/services; contract tests for API/facade; Playwright e2e for Home/Money/Plan/Inbox/Ritual critical paths |
| Monitoring | Error tracking (Sentry or equivalent) + OpenTelemetry traces/metrics when workers/API facade land |
| Logging | Structured JSON logs with request_id + household_id; PII redaction required |
| Package Manager | npm as the single standard (lockfile source of truth); discontinue dual bun/npm ambiguity for CI |
| Monorepo Strategy | Single repository; app at root (or apps/web later if needed); domain code in packages/* or modules/*; ai-os remains control-plane colocated but not product runtime |

## Locked product module map

| Bounded context | Module | Primary product surfaces |
|-----------------|--------|--------------------------|
| Tenancy | `tenancy` | Together, Auth |
| Real Ledger | `ledger` | Money |
| Intention Plan | `plan` | Plan, Month Ritual |
| Inbox | `inbox` | Inbox |
| Insight/Health | `health` | Home chip, Health |

## Forbidden by this freeze

- Immediate microservice split (Candidate C)
- Replacing Supabase Auth during rewrite
- Offline write stores
- Parallel competing domain implementations long-term (Actions bypassing services after strangler window)
