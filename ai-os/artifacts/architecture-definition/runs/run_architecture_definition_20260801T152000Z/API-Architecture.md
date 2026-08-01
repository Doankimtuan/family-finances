---
document: API Architecture
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# API Architecture

## Styles

1. **Internal UI:** Server Actions → application services  
2. **Facade:** `GET/POST /api/v1/...` Zod-validated  

## Guidelines (normative)

See `API-Guidelines.md`.

## Versioning

`/api/v1` locked for Architecture v2. No Candidate C service URLs.
