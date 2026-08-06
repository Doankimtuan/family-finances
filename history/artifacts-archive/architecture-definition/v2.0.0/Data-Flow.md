---
document: Data Flow
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Data Flow

## Capture expense (happy path)

UI → Action adapter → `ledger.commands.recordTransaction` → DB → `plan.commands.syncPlacement` → auto movement OR `inbox.commands.enqueueReview` → UI Inbox.

## Home read

RSC → `ledger.queries.realPosition` + `plan.queries.planPulse` + `inbox.queries.openCount` (+ `health.queries.chip`) → render.
