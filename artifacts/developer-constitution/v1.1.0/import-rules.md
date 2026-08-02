---
document: Import Rules
developer_constitution: v1.1.0
status: OFFICIAL_IMPLEMENTATION_CONSTITUTION
run_id: run_developer_constitution_20260802T151500Z
created_at: 2026-08-02T15:15:00Z
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

# Import Rules

## Allowed edges

```text
app/**          → features/*, shared/*, modules/*/application
features/*      → shared/*, modules/*/application
shared/patterns → shared/ui, shared/hooks, shared/lib, shared/utils
shared/ui       → @heroui/*, tokens, @phosphor-icons/react, tailwind-variants
modules/*/application     → modules/*/domain, shared-kernel (as allowed)
modules/*/infrastructure  → modules/*/domain, Supabase, platform
modules/*/domain          → shared-kernel types only (no infrastructure, no UI)
```

## Forbidden edges

1. Circular imports.
2. `features/A` → `features/B`.
3. `app|features|shared` → `modules/*/infrastructure` or Supabase.
4. `modules/*/domain` → UI, React, Next, Supabase.
5. Any product code → `archive/legacy-v1/**`.
6. Barrel-file abuse that re-exports entire domains across boundaries.

## Import style (alias usage, relative-import depth, grouping)

Mechanical import-style detail (mandatory `@/` alias usage, maximum relative-import depth of 2, import grouping order, no unused imports) is covered in [Coding Standards / import-policy.md](../../coding-standards/CURRENT/import-policy.md). That document adds style detail only — it does not change the boundary graph above.

## Enforcement intent

Future lint / CODEOWNERS / CI path rules must encode this graph. Until then, PR checklist is binding.
