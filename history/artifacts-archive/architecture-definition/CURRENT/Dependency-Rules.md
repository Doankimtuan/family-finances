---
document: Dependency Rules
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Dependency Rules

1. Depend inward: adapters → application → domain.  
2. Use only allowed Dependency Matrix edges.  
3. Domain layer: pure TypeScript.  
4. No cyclic imports (validated acyclic).  
5. No duplicated write paths: all writes through owning BC services.  
6. `ai-os` is not a product dependency.  
