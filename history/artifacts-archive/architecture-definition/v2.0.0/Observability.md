---
document: Observability
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Observability

- `request_id` propagation Actions/API/workers  
- Structured logs with `household_id`  
- Sentry (or equiv) for exceptions  
- OTel traces when facade/workers enabled  
- Product analytics separate from ops  
