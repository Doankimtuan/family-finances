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

# Architecture Decision

## Selected architecture (ONE)

**Candidate-B-Balanced — Balanced Modular Monolith + Application Services + Optional Workers**

**Verdict:** APPROVE WITH MODIFICATIONS

### Modifications (binding)

1. MVP ships as a single Next.js deployable (A-style runtime) while enforcing B seams: bounded-context packages, application services, shared Zod contracts.
2. Async workers are optional until Health/insights/notification load requires them; spike allowed, not mandatory for MVP cut.
3. Typed API facade (/api/v1 or oRPC) is mandatory for new read models and any cross-client contracts; existing Server Actions may strangler-migrate, not big-bang delete.
4. Candidate C service split is explicitly NOT authorized now; only allowed later via a new Architecture Decision Board if metrics/org demand.

### Why this wins the balance

| Criterion | Assessment |
|-----------|------------|
| Maintainability | High — service seams + shared contracts |
| Scalability | Adequate — workers when needed; not distributed chaos |
| Simplicity | Medium — more than A, far less than C; MVP stays one deployable |
| Developer Experience | High for current Next/Supabase team |
| Business Fit | Aligns with Product Definition contexts & MVP→Phase-2 roadmap |
| Cost | Low–medium managed ops |
| Migration Complexity | Medium — strangler from V1 |
| Future Growth | Clear path to AI/Inbox load; C only if later justified |

### Proposal verdicts

| Proposal | Decision |
|----------|----------|
| Candidate A Simple | **REJECT** as target architecture |
| Candidate B Balanced | **APPROVE WITH MODIFICATIONS** ← **SELECTED** |
| Candidate C Highly Scalable | **REJECT** for now |

### Explicit non-selection

Candidate A may inform **MVP delivery tactics** (single deployable, fast IA) but is **not** the locked architecture. Candidate C is **not** approved.
