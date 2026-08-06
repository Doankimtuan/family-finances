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

# Architecture Decision Log

## ADR-001 — Select architecture candidate

- **Status:** Accepted (Frozen)
- **Decision:** Candidate B with modifications
- **Date:** 2026-08-01T14:53:32Z
- **Rejects:** A as target; C for now

## ADR-002 — Runtime shape for MVP

- **Status:** Accepted
- **Decision:** Single Next.js deployable calling application services
- **Consequence:** No separate Ledger/Plan services in MVP

## ADR-003 — API dual-surface strangler

- **Status:** Accepted
- **Decision:** New contracts go through shared services + `/api/v1` (or oRPC); Server Actions become adapters
- **Consequence:** Catalog existing Actions; stop new domain logic in route files

## ADR-004 — Data & auth platform

- **Status:** Accepted
- **Decision:** Keep Supabase Postgres + Auth SSR + RLS
- **Consequence:** Harden, don't replace

## ADR-005 — Package manager

- **Status:** Accepted
- **Decision:** npm standard for CI/product app
- **Consequence:** One lockfile policy in CI

## ADR-006 — Workers

- **Status:** Accepted (conditional)
- **Decision:** Optional until Health/insights/notifications need async; then managed worker + outbox
- **Consequence:** No mandatory broker for MVP

## Proposal-level decisions

### Candidate-A-Simple

**REJECT** — Insufficient as the 5-year architecture: weak seams for Inbox/Health/AI Phase-2, high risk of Actions/API sprawl continuing, under-invests in maintainability relative to Product Definition growth.

### Candidate-B-Balanced

**APPROVE WITH MODIFICATIONS** — Best balance of maintainability, DX, business fit, cost, and migration complexity while enabling future growth without premature microservices.

Modifications:
- MVP ships as a single Next.js deployable (A-style runtime) while enforcing B seams: bounded-context packages, application services, shared Zod contracts.
- Async workers are optional until Health/insights/notification load requires them; spike allowed, not mandatory for MVP cut.
- Typed API facade (/api/v1 or oRPC) is mandatory for new read models and any cross-client contracts; existing Server Actions may strangler-migrate, not big-bang delete.
- Candidate C service split is explicitly NOT authorized now; only allowed later via a new Architecture Decision Board if metrics/org demand.

### Candidate-C-Highly-Scalable

**REJECT** — Over-engineered for current household scale and team shape; high migration/ops cost; distributed Month Ritual risk. May be revisited only after B seams exist and load/org justify split.

