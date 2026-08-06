---
document: Security
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Security

- SSR session refresh via proxy  
- RLS on all tenant tables  
- Admin gates audited  
- CSP + scoped rate limits (Decision Board security mods)  
- PII redaction in logs  
- Service role restricted to platform jobs  
