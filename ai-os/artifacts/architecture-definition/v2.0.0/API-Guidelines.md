---
document: API Guidelines
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# API Guidelines

## Error envelope

```json
{ "error": { "code": "string", "message": "string", "details": {} }, "request_id": "uuid" }
```

## Auth

Bearer/session cookie via Supabase SSR; household membership required for household-scoped routes.

## Idempotency

`Idempotency-Key` required on mutating savings/transactions facade routes (per Decision Board mods).

## Naming

- Resources plural nouns: `/api/v1/accounts`, `/api/v1/inbox/items`  
- Commands as POST subresources when not CRUD  

## Prohibitions

- Business logic in route handlers  
- Returning jar sums labeled as `balance` without `intention` qualifier  
