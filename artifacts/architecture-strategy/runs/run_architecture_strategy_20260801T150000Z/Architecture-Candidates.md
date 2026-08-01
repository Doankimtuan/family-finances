---
generated_by: Architecture Strategy Board
run_id: run_architecture_strategy_20260801T150000Z
created_at: 2026-08-01T14:51:36Z
product_sot: artifacts/product-definition/CURRENT
status: STRATEGY_ONLY
final_architecture_decision: false
implementation_architecture: false
---

# Architecture Candidates

## Candidate A — Simple (Evolve the modular monolith)

**Shape:** Remain a single Next.js deployable. Re-slice UI by product IA. Keep Supabase as BaaS (Auth+Postgres+RLS). Concentrate domain logic in clear packages inside the repo (`tenancy`, `ledger`, `plan`, `inbox`, `health`). Prefer Server Actions for app mutations; keep minimal Route Handlers for read APIs already used by the dashboard.

**Benefits**
- Fastest path to MVP IA rewrite
- Lowest ops burden
- Preserves working auth/RLS investment
- Team already fluent

**Trade-offs**
- Harder to scale independent workloads (insights/AI later)
- API-for-mobile still secondary
- Risk of UI↔domain leakage without discipline

**Complexity:** Low  
**Migration cost:** Low–Medium (re-nav + package seams; strangler Inbox over review queue)  
**Long-term maintainability:** Medium (depends on package discipline)  
**Operational cost:** Low  
**Learning curve:** Low  

**Best if:** Small team, MVP urgency, one web client for 1–2 years.

---

## Candidate B — Balanced (Modular monolith + explicit application services + optional workers)

**Shape:** Same Next+Supabase core as A, but enforce **hexagonal-ish application services** per bounded context (commands/queries). Introduce a thin **BFF/API layer** (`/api/v1` or tRPC/oRPC) shared by web and future clients. Extract **async jobs** (Health scoring, insight generation, notification fan-out) to a worker (Supabase Edge Functions, Inngest, Trigger.dev, or a small Node worker) with an outbox/events table.

**Benefits**
- Matches Product SoT contexts cleanly
- Ready for Phase-2 AI/approvals without rewriting MVP
- Better testability at service boundaries
- Controlled path to multi-client

**Trade-offs**
- More upfront design than A
- Worker/event infra to run and observe
- Slightly higher cognitive load

**Complexity:** Medium  
**Migration cost:** Medium (service extraction + event outbox + API facade; strangler from Actions)  
**Long-term maintainability:** High  
**Operational cost:** Medium  
**Learning curve:** Medium  

**Best if:** Plan for 3–5 years on one primary cloud, Phase-2 AI/Inbox load, possible second client.

---

## Candidate C — Highly Scalable (Service-oriented product platform)

**Shape:** Split deployables by bounded context over 5 years: **Identity/Tenancy**, **Ledger**, **Plan/Inbox**, **Insight/AI**, each with own API and data ownership (still Postgres initially via schemas or separate DBs). Edge BFF for web. Event bus (e.g. queue + pub/sub) for cross-context integration. CDN + regional read replicas as needed. Mobile BFF optional.

**Benefits**
- Independent scale/release for insights/AI and ledger
- Strongest isolation for security blast radius
- Clearest long-term team scaling

**Trade-offs**
- Highest complexity and migration cost from V1
- Distributed transactions / saga complexity around Month Ritual & allocations
- Overkill for current household scale if adopted immediately

**Complexity:** High  
**Migration cost:** High  
**Long-term maintainability:** High *if* platform investment sustained; otherwise brittle  
**Operational cost:** High  
**Learning curve:** High  

**Best if:** Multi-team, multi-client, heavy async insight/AI, growth beyond single-app ops within ~2 years.

---

## Mapping to Product Definition contexts

| Context | Candidate A | Candidate B | Candidate C |
|---------|-------------|-------------|-------------|
| Tenancy | module | module + services | Identity service |
| Real Ledger | module | module + services | Ledger service |
| Intention Plan / Inbox | module | module + services + jobs | Plan/Inbox service |
| Insight / Health | module (sync) | worker jobs | Insight service |
