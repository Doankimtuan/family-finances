---
document: Backend Layers
technical_specification: v2.0.0
status: OFFICIAL_IMPLEMENTATION_SPEC
run_id: run_technical_specification_20260801T153000Z
created_at: 2026-08-01T15:00:41Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
redesign_product: false
redesign_architecture: false
frozen: true
---

# Backend Layers

## Application Layer

Use-case commands/queries per module; Zod I/O; orchestration; authorize via tenancy AuthContext.

## Domain Layer

Entities/VOs/domain services; invariants (Active jar, closed month, positive amounts, installment completion).

## Infrastructure Layer

Supabase repositories; outbox; optional worker handlers under platform.

## Transactions

One DB transaction per command when single-aggregate; Month Ritual uses explicit plan workflow calling ledger commands for corrections only.
