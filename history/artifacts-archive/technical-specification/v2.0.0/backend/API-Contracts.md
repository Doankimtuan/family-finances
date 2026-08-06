---
document: API Contracts
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

# API Contracts

## Envelope

Success: `{ "data": ..., "request_id": "..." }`  
Error: `{ "error": { "code", "message", "details" }, "request_id" }`

## Representative contracts

| Method | Path | Module | Notes |
|--------|------|--------|-------|
| GET | `/api/v1/home/summary` | facade→ledger+plan+inbox(+health) | Home read model |
| GET | `/api/v1/inbox/items` | inbox | Open items |
| POST | `/api/v1/inbox/items/{id}/resolve` | inbox | Resolve to jar |
| GET | `/api/v1/accounts` | ledger | |
| POST | `/api/v1/transactions` | ledger | Idempotency-Key |
| GET | `/api/v1/jars` | plan | Intention only |
| POST | `/api/v1/month-ritual/approve` | plan | |
| GET | `/api/v1/health` | health | |

Server Actions mirror the same commands for UI.
