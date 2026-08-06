---
document: Backend Architecture
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Backend Architecture

## Application services

Each BC exports:

- `commands/*` — write use cases (Zod input → domain → repo → events/outbox)  
- `queries/*` — read models for Home/Money/Plan/Inbox/Health  

## Adapters

| Adapter | Role |
|---------|------|
| Server Actions | UI command/query adapters |
| `/api/v1/*` | HTTP JSON facade for read models + selected commands |
| Workers | Optional consumers of outbox |

## Transactionality

- Single DB transaction per command where possible  
- Month Ritual: explicit domain workflow in `plan` with ledger corrections only via ledger commands  
- Cross-context: process-manager in application layer, not distributed 2PC  
