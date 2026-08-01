---
document: Caching
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Caching

- CDN/static assets  
- TanStack Query for client  
- `React.cache` / per-request memo for RSC  
- No offline write cache  
- Optional read-model tables for Home/Health later via workers  
