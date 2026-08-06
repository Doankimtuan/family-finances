---
document: Developer Handbook
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

# Developer Handbook

## Sources of truth

1. Product Definition `artifacts/product-definition/CURRENT`  
2. Architecture Definition `artifacts/architecture-definition/CURRENT`  
3. This Technical Specification `v2.0.0`  

## Build order

M0 IA routes → M1 modules → M2 `/api/v1` + Action adapters → M3 workers optional  

## Coding Rules

See `Coding-Rules.md` + Architecture Coding/Naming standards.

## Implementation Contracts

Every REQ-ID must cite module command/query in PR description.
