---
generated_by: Architecture Strategy Board
run_id: run_architecture_strategy_20260801T150000Z
created_at: 2026-08-01T14:51:36Z
product_sot: artifacts/product-definition/CURRENT
status: STRATEGY_ONLY
final_architecture_decision: false
implementation_architecture: false
---

# Technology Recommendation

## Guidance posture

Recommendations below are **board preferences for evaluation**, not ratified ADRs. Final choice belongs to a later Architecture Decision Board.

## Baseline preference (biased to Candidate B, compatible with A)

| Concern | Recommendation | Notes |
|---------|----------------|-------|
| Frontend framework | **Next.js App Router (React 19)** | Already in stack (16.1.6); RSC fits Home/Money |
| Backend framework | **Next server (Actions + Route Handlers) → evolve to app services** | Avoid greenfield Nest/Go for MVP unless choosing C now |
| Database | **Postgres via Supabase** | RLS aligns with household tenancy (BR-02a) |
| ORM / data access | **Supabase client + selective SQL; optional Drizzle for typed server repos** | Don't mandate Prisma rewrite for MVP |
| Authentication | **Supabase Auth SSR + proxy session refresh** | Keep; harden per Decision Board security overlays |
| State management | **RSC + TanStack Query + limited Zustand** | Server truth first; Zustand for ephemeral UI |
| API style | **A:** Actions-first · **B:** typed HTTP/RPC facade (`/api/v1` or oRPC) · **C:** per-service REST/gRPC | Product SoT forbids offline writes; online JSON/RPC fine |
| Validation | **Zod** (shared DTOs) | Keep |
| Testing | **Vitest/Jest unit · Playwright e2e · contract tests on services** | Align with Decision Board testing overlay |
| Deployment | **Vercel (or equivalent) for web · Supabase managed DB** | Simple ops for A/B |
| Infrastructure | **Managed first**; IaC (Terraform/Pulumi) when choosing C or multi-env rigor |
| Monitoring | **OpenTelemetry + vendor (e.g. Axiom/Datadog/Sentry)** | Product needs mutation/error visibility |
| Logging | **Structured JSON logs with request/household ids** | Never log secrets/PII raw |
| Analytics | **Product analytics (PostHog/etc.) separate from ops metrics** | KPIs: dual engagement, Inbox zero, ritual |
| Package manager | **npm or bun** (repo has both lock artifacts historically) — pick one as standard |
| Monorepo strategy | **A/B:** single app + `packages/*` domains · **C:** apps + services monorepo (Turborepo/pnpm) |
| Folder structure strategy | Slice by **bounded context + product surface**, not by V1 route hubs | e.g. `modules/plan`, `modules/inbox`, `app/(product)/...` |

## Mobile

Product SoT is web-first. Mobile Architect note: keep domain/API portable (Candidate B/C); do **not** invent React Native MVP unless roadmap changes.

## Explicit rejects for MVP (strategy advice)

- Microservices on day one (C immediate) without team/platform readiness  
- Replacing Supabase Auth mid-rewrite  
- Offline-first local DB (conflicts with BR-15 / offline writes ban)  
