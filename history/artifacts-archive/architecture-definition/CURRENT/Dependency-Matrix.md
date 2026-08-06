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

| from \ to | shared-kernel | tenancy | ledger | savings | plan | inbox | health | app-shell | api-facade | ui-adapters | platform |
|---|---|---|---|---|---|---|---|---|---|---|---|
| shared-kernel | · |  |  |  |  |  |  |  |  |  |  |
| tenancy | X | · |  |  |  |  |  |  |  |  |  |
| ledger | X | X | · |  |  |  |  |  |  |  |  |
| savings | X | X | X | · |  |  |  |  |  |  | X |
| plan | X | X | X |  | · |  |  |  |  |  |  |
| inbox | X | X | X | X | X | · |  |  |  |  |  |
| health | X | X | X | X | X | X | · |  |  |  |  |
| app-shell | X |  |  |  |  |  |  | · |  | X | X |
| api-facade | X | X | X | X | X | X | X |  | · |  | X |
| ui-adapters | X | X | X | X | X | X | X |  |  | · | X |
| platform | X |  |  |  |  |  |  |  |  |  | · |

## Validation

- **Cyclic dependencies:** none detected
- **Forbidden edges checked:** documented anti-edges (including `savings ↛ inbox|plan|health`)
- **Edge count allowed:** updated for ledger-owned `savings` application module

## Savings anti-edges

- `savings` must not import `inbox`, `plan`, or `health`.
- `ledger` must not import `savings` (orchestration via `app` / `ui-adapters`).
- Inbox maturity acknowledgment never posts ledger txs inside inbox RPCs — `app` calls savings settle/renew commands after ack.
