---
document: Error Handling
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Error Handling

## Domain errors

Typed codes in shared-kernel (`ValidationError`, `Forbidden`, `Conflict`, `ClosedMonth`, …).

## Mapping

Domain → Action/API envelope (`code`, `message`, `request_id`).

## UX

Human messages; closed month routes to correction path; never silent money failure.
