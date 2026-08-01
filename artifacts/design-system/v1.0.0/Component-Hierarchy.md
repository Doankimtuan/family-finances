---
document: Component Hierarchy
design_system: v1.0.0
status: OFFICIAL_DESIGN_SYSTEM_SOURCE_OF_TRUTH
run_id: run_design_system_20260801T190000Z
created_at: 2026-08-01T16:12:23Z
board: Design System Generator
design_foundation: v1.1.0
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Component Hierarchy

```text
Primitive (shared/ui)
  → Foundation (shared/ui)
    → Feedback (shared/ui + Toast host pattern)
      → Containers (shared/patterns)
        → Navigation / Financial / Composite (shared/patterns)
          → Feature UI (modules/*)
            → Screens (app/(product)/*)
```

Ownership: `shared/` = generic presentational only. Domain data from module application APIs.
