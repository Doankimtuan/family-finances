---
document: Coding Rules
technical_specification: v2.0.0
status: OFFICIAL_IMPLEMENTATION_SPEC
run_id: run_technical_specification_20260801T153000Z
created_at: 2026-08-01T15:00:41Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
redesign_product: false
redesign_architecture: false
frozen: true
---

# Coding Rules

- No product/architecture redesign in PRs  
- New domain logic only in owning module  
- Zod at boundaries  
- Actions/API are adapters only  
- npm CI  
- TypeScript strict  
- Tests required for commands that move money or lock rituals  
