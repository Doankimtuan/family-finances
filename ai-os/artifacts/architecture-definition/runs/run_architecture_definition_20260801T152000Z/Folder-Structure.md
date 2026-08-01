---
document: Folder Structure
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Folder Structure

## Target tree (implementation blueprint)

```text
/
  app/
    (product)/
      home/
      money/
      plan/
      inbox/
      together/
      health/          # secondary full page via Home chip
    api/
      v1/
        [...routes]/route.ts
    auth/              # confirm/signout adapters
    layout.tsx
  modules/
    shared-kernel/
    tenancy/
      domain/
      application/
      infrastructure/
    ledger/
      domain/
      application/
      infrastructure/
    plan/
      domain/
      application/
      infrastructure/
    inbox/
      domain/
      application/
      infrastructure/
    health/
      domain/
      application/
      infrastructure/
    platform/
      supabase/
      observability/
      jobs/            # outbox publisher hooks
  components/          # shared UI primitives only (no domain writes)
  proxy.ts
  package.json
  ai-os/               # control plane — do not import from product modules
```

## Dependency rules (enforced by lint/CODEOWNERS later)

1. `app/**` may import `ui-adapters` paths and `modules/*/application` public API only.  
2. `modules/*/infrastructure` may import Supabase; domain must not.  
3. No imports from `ai-os/**` into product modules.  
4. No `ledger` → `plan|inbox|health` imports.  
5. No `plan` → `inbox|health` imports.  
