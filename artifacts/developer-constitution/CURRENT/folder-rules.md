---
document: Folder Rules
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

# Folder Rules

## Mandatory tree

```text
/
  app/                    # App Router routes, layouts, API adapters
  features/               # Feature UI composition (Feature layer)
  shared/
    ui/                   # Primitives only (HeroUI wrappers + tokens)
    patterns/             # AppViewport, BottomNav, AmountField, …
    hooks/
    lib/
    utils/
  modules/                # Bounded contexts (Architecture SoT)
    shared-kernel/
    tenancy/
    ledger/
    plan/
    inbox/
    health/
    platform/
  providers/              # App-wide React providers (or re-export from shared)
  styles/                 # Global CSS / token entry (Tailwind)
  types/                  # Shared ambient / cross-cutting types (no domain leakage)
  supabase/               # Migrations and DB config
  tests/                  # Unit, integration, e2e
  artifacts/              # Frozen documentation SoTs only
  archive/
    legacy-v1/            # Retired legacy application (read-only)
```

## Forbidden / constrained paths

| Path | Rule |
|------|------|
| Root `components/` | Must not grow. Legacy stub only. Migrate to `shared/ui`. New files forbidden. |
| `archive/legacy-v1/` | Read-only reference. No product imports. |
| Retired control-plane trees | Must not be created or referenced for implementation. |
| Duplicate `hooks/`, `utils/`, `providers/` scattered per feature | Forbidden. Share via `shared/` or top-level `providers/`. |

## Ownership

- Only `shared/ui` may contain reusable UI primitives.
- Feature-specific UI belongs in `features/*`.
- Domain logic belongs in `modules/*/domain` and `modules/*/application`.
- Pages in `app/**` stay thin.

## Sprint 1 bootstrap note

`features/`, `providers/`, `styles/`, `types/`, and `shared/ui` may be empty until Sprint 1 day-0. Emptiness is not a license to invent alternate trees.
