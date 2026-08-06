---
document: Authorization Matrix, Rate Limiting, Jobs
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

# Authorization Matrix, Rate Limiting, Jobs

## Authorization Matrix

| Command class | Partner | Admin | RLS |
|---------------|:-------:|:-----:|:---:|
| Ledger/Plan/Inbox daily | ✓ | ✓ | member |
| Policy update | ✓ | ✓ | member + audit |
| Assumptions update | view | ✓ | member + audit |
| Service aggregates | — | system | service role |

## Rate Limiting

Auth endpoints + sensitive mutations first (Architecture Decision / Decision Board).

## Background Jobs (optional M3)

`RecomputeHealth`, notification fan-out — consume outbox; never bypass BR-14/15.
