---
document: Component Architecture
design_foundation: v1.1.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_mobile_design_system_20260801T180000Z
created_at: 2026-08-01T16:01:24Z
board: Mobile Experience & Design System Board
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
inherits: v1.0.0
supersedes_clauses: desktop-nav-layout-ui-kit
frozen: true
---
# Component Architecture

## Layering (mandatory)

```text
Primitive Components  (shared/ui — HeroUI wrappers/tokens)
        ↓
Composite Components  (shared/patterns)
        ↓
Feature Components    (modules/*/… or feature UI colocated)
        ↓
Screens               (app/(product)/*)
```

**Never build screens directly from raw markup** without composing through these layers.

## Ownership

| Location | Owns |
|----------|------|
| `shared/ui` | Generic primitives only |
| `shared/patterns` | Cross-feature composites (AppViewport, BottomNav, AmountField, ConfirmMoneyDialog, EmptyState, …) |
| `shared/hooks` | Shared UI hooks |
| `shared/lib` | `cn`, `tv`, theme helpers |
| `shared/utils` | Pure formatters (money tabular, locale) |
| `modules/*` | Feature-specific UI + domain |
| `app/(product)/*` | Route screens that compose only |

## Rules

- No duplicated components, variants, or tokens  
- No domain writes in `shared/`  
- Architecture `components/` is a **legacy alias** to migrate toward `shared/ui`  
- Feature modules must not re-skin HeroUI differently from `shared/ui`  
