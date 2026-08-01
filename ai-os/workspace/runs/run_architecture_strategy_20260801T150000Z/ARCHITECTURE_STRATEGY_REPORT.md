---
generated_by: Architecture Strategy Board
run_id: run_architecture_strategy_20260801T150000Z
created_at: 2026-08-01T14:51:36Z
product_sot: artifacts/product-definition/CURRENT
status: STRATEGY_ONLY
final_architecture_decision: false
implementation_architecture: false
---

# Architecture Strategy Report

## Mandate

Serve **Product Definition v2.0.0 OFFICIAL SoT**. Architecture follows product contexts (Tenancy, Real Ledger, Intention Plan, Insight) and IA (Home / Money / Plan / Inbox / Together). Legacy V1 code is evidence, not destiny.

## Legacy snapshot (current)

| Area | Today |
|------|-------|
| App | Next.js 16.1.6 App Router + React 19.2.3 |
| Auth/DB | Supabase SSR (`proxy.ts`) + Postgres/RLS |
| Mutations | Server Actions dominant + some `app/api` Route Handlers |
| Client state | TanStack Query + Zustand |
| Validation | Zod |
| UI | Tailwind 4 + Radix/shadcn-style |
| Domains | `lib/*` modules (jars, server, supabase, …) colocated with `app/*` routes |
| Control plane | `ai-os/` co-located (not product runtime) |

## Strategic findings

1. **Product rewrite needs clearer module boundaries** — V1 hubs map poorly to Home/Money/Plan/Inbox/Together; domain logic is usable but IA coupling is high.
2. **Dual mutation surfaces** (Actions + API routes) increase contract sprawl — Strategy Decision Board already flagged this.
3. **Bounded contexts exist in knowledge** (ledger vs jars vs tenancy) but are not enforced as deployable/module seams.
4. **5-year needs** from Product SoT: partner collaboration, Inbox scale, Health/insights, Phase-2 AI assist, Future wealth/offline-read — without offline writes.
5. **Keep what works:** Supabase RLS tenancy, SSR session proxy, Zod, RSC-friendly Next — unless a candidate explicitly replaces them.

## Analysis dimensions covered

Module/domain boundaries · BCs · FE/BE · API · DB · cache · authn/z · events · state · errors · observability · deploy · scale · maintainability · DX · testing · CI/CD · security

## Explicit non-actions

- **No final architecture selection** in this run  
- **No implementation architecture** (no folder trees as binding SoT, no ADR ratification)  
- Stop after strategy pack  

See sibling documents for candidates, tech options, trade-offs, migration, risks, and a non-binding recommendation summary.
