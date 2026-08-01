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

# Architecture Principles

1. Product Definition v2 is SoT; architecture serves Home/Money/Plan/Inbox/Together and BR-01 real≠virtual.
2. Bounded contexts: Tenancy, Real Ledger, Intention Plan/Inbox, Insight/Health — enforced as module seams.
3. One domain path for mutations: UI adapters (Actions) and HTTP facade call the same application services.
4. Online-first money mutations; offline writes forbidden (BR-15).
5. Strangler over big-bang; expand/contract data changes.
6. Security: RLS tenancy non-negotiable; admin elevation remains app-layer.
7. Observability is part of the architecture, not an afterthought.
8. No microservices until a future Architecture Decision Board authorizes C-style split.
