---
document: State Flow
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# State Flow

## Server

RSC fetch via queries → serialize minimal props.

## Client

TanStack Query cache keys namespaced by household; invalidate on command success.

## Ephemeral

Zustand for wizard/modals only.
