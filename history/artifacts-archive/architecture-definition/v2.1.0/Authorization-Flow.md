---
document: Authorization Flow
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Authorization Flow

## Layers

1. **AuthN** — Supabase session  
2. **RLS** — `is_household_member(household_id)`  
3. **App gates** — Admin-only assumptions/policies per Product Permission Matrix  
4. **Audit** — Partner-visible on material policy changes  

## Flow

Action/API → resolve AuthContext (tenancy) → authorize command → repo (RLS) → result
