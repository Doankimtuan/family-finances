---
document: Coding Standards
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Coding Standards

- TypeScript strict  
- No `any` in domain/application  
- Zod at boundaries  
- Functional domain where practical; explicit results over thrown generics  
- React: composition over boolean prop sprawl; follow project React guidance  
- Server-only modules marked; no leaking server clients to browser bundles  
