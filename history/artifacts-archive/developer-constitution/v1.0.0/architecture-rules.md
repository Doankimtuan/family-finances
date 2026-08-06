---
document: Architecture Rules
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

# Architecture Rules

## Bounded contexts (immutable map)

Required modules (Architecture Definition):

- `modules/shared-kernel`
- `modules/tenancy`
- `modules/ledger`
- `modules/plan`
- `modules/inbox`
- `modules/health`
- `modules/platform`

Each context (except shared-kernel/platform as specified) follows:

```text
domain/ → application/ → infrastructure/
```

## Dependency rules

1. `app/**` may import `features/*`, `shared/*`, and `modules/*/application` public APIs only.
2. `features/**` may import `shared/*` and `modules/*/application` public APIs only.
3. `modules/*/infrastructure` may import Supabase; **domain must not**.
4. No UI (app/features/shared) may import Supabase clients for data access.
5. No `ledger` → `plan|inbox|health` imports.
6. No `plan` → `inbox|health` imports.
7. No circular imports.
8. No cross-feature imports (`features/a` ↛ `features/b`). Features communicate through `shared` or application services.

## API rules

Every API endpoint / Server Action that mutates or returns domain data **must** have:

1. Request DTO
2. Response DTO
3. Validation (Zod)
4. Authorization
5. Error mapping
6. Audit logging (sensitive operations)

Never expose database entities / raw rows directly to clients.

## Database rules

1. Database access through the **repository / infrastructure layer** only.
2. RLS must remain enabled. No bypass for product paths.
3. Prefer additive migrations under `supabase/`.
4. Align with Technical Specification and strangler continuity of live migrations.

## Deployable shape

Candidate B: single Next.js deployable. Do not split into microservices. Do not introduce a second UI shell.
