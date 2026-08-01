---
document: Developer Guidelines
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Developer Guidelines

## Getting started

1. Read Product Definition CURRENT  
2. Read Architecture Decision CURRENT  
3. Read this Architecture v2 CURRENT  
4. Place new code under `modules/*` + IA routes  

## Adding a command

1. Zod schema in BC application  
2. Domain validate  
3. Repo persist  
4. Emit event/outbox if needed  
5. Expose via Action adapter and/or `/api/v1`  
6. Add unit + contract/e2e as needed  

## Don't

- Import `ai-os` from product  
- Write SQL in React components  
- Bypass services from Actions long-term  
