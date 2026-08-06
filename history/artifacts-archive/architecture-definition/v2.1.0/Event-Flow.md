---
document: Event Flow
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Event Flow

## Domain events (in-process)

Examples: `TransactionRecorded`, `ReviewItemCreated`, `ReviewItemResolved`, `MonthRitualApproved`, `SavingsMaturityDue`.

## Outbox (optional M3)

Persist event → worker publishes → health/notification handlers.

## Rules

- Plan emits review items; does not call health directly for scoring sync in MVP (health may query).  
- AI Phase-2 must not emit ledger mutations without explicit command path.  
