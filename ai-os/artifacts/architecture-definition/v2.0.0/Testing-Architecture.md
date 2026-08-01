---
document: Testing Architecture
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Testing Architecture

| Layer | Tool | Scope |
|-------|------|-------|
| Domain/unit | Vitest | BC domain + application |
| Contract | Vitest/HTTP | `/api/v1` Zod contracts |
| E2E | Playwright | Home/Money/Plan/Inbox/Ritual |
| RLS | SQL tests | membership isolation |

Critical Product ACs must map to e2e or contract tests.
