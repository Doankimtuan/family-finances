---
document: CI/CD
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# CI/CD

## Pipeline

1. `npm ci`  
2. lint + typecheck  
3. unit/contract tests  
4. build  
5. (main) Playwright smoke  
6. deploy preview/prod  
7. Supabase migrations gated  

## Package manager

**npm only** in CI.
