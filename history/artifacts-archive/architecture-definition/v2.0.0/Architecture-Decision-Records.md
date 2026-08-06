---
document: Architecture Decision Records
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Architecture Decision Records

## Incorporated from Architecture Decision Board

See `artifacts/architecture-decision/CURRENT` ADRs 001–006.

## ADR-ADv2-001 — Module physical layout

**Decision:** `modules/{tenancy,ledger,plan,inbox,health,shared-kernel,platform}`  
**Status:** Accepted  

## ADR-ADv2-002 — Plan may depend on ledger; reverse forbidden

**Decision:** Enforce Dependency Matrix  
**Status:** Accepted  

## ADR-ADv2-003 — Inbox owns ReviewItem abstraction

**Decision:** Strangle `jar_review_queue` behind inbox module  
**Status:** Accepted  

## ADR-ADv2-004 — API v1 facade mandatory for new read models

**Decision:** Per Architecture Decision modifications  
**Status:** Accepted  
