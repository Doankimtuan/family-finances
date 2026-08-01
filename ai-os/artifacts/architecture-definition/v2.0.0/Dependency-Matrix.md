---
document: Dependency Matrix
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Dependency Matrix

Legend: `X` means row **may depend on** column. Blank = forbidden.

| from \ to | shared-kernel | tenancy | ledger | plan | inbox | health | app-shell | api-facade | ui-adapters | platform |
|---|---|---|---|---|---|---|---|---|---|---|
| shared-kernel | · |  |  |  |  |  |  |  |  |  |
| tenancy | X | · |  |  |  |  |  |  |  |  |
| ledger | X | X | · |  |  |  |  |  |  |  |
| plan | X | X | X | · |  |  |  |  |  |  |
| inbox | X | X | X | X | · |  |  |  |  |  |
| health | X | X | X | X | X | · |  |  |  |  |
| app-shell | X |  |  |  |  |  | · |  | X | X |
| api-facade | X | X | X | X | X | X |  | · |  | X |
| ui-adapters | X | X | X | X | X | X |  |  | · | X |
| platform | X |  |  |  |  |  |  |  |  | · |

## Validation

- **Cyclic dependencies:** none detected  
- **Forbidden edges checked:** 10 documented anti-edges  
- **Edge count allowed:** 33  
