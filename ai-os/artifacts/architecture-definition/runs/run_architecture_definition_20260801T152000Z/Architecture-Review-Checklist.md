---
document: Architecture Review Checklist
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Architecture Review Checklist

## PR / design review

- [ ] Touches correct owning module  
- [ ] No new forbidden dependency edges  
- [ ] No domain logic in `app/**` routes beyond adapters  
- [ ] Zod at boundary  
- [ ] Error envelope / request_id on API  
- [ ] RLS/tenant scope considered  
- [ ] Real≠virtual labeling OK  
- [ ] Tests at appropriate layer  
- [ ] No offline write  
- [ ] No microservice split sneak-in  
- [ ] Observability fields present on money commands  
