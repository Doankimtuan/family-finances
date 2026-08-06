---
document: Shared Modules
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Shared Modules

## shared-kernel

IDs, Result/Error types, money primitives, zod helpers, logging context types — **no Supabase, no React**.

## platform

Supabase clients (server/browser), proxy session, observability sinks, outbox helpers.

## components/

Presentational UI only; no domain imports beyond DTO types.
