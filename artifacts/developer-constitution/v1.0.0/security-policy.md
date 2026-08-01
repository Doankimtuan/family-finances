---
document: Security Policy
developer_constitution: v1.0.0
status: OFFICIAL_IMPLEMENTATION_CONSTITUTION
run_id: run_developer_constitution_20260801T230000Z
created_at: 2026-08-01T16:38:51Z
board: Developer Constitution Board
frozen: true
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
design_foundation_sot: artifacts/design-foundation/CURRENT
design_system_sot: artifacts/design-system/CURRENT
screen_blueprints_sot: artifacts/screen-blueprints/CURRENT
implementation_plan_sot: artifacts/implementation-plan/CURRENT
rewrite_readiness_sot: artifacts/rewrite-readiness/CURRENT
---

# Security Policy

1. Validate every input with Zod (client UX + server enforcement).
2. Never trust client data for authorization or amounts.
3. Permission checks are **server-side** (RLS + application authz).
4. Secrets remain server-only (env vars not exposed to client bundles).
5. Audit sensitive operations (money mutations, membership changes, ritual close).
6. Idempotency keys required on money-mutating APIs per Technical Specification.
7. No RLS bypass in product code paths.
8. No logging of secrets, tokens, or full payment credentials.
