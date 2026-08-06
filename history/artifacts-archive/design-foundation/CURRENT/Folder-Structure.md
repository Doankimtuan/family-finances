---
document: Folder Structure
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
# Folder Structure

```text
/
  app/
    (product)/
      home/ money/ plan/ inbox/ together/ health/
    api/v1/
    auth/
    layout.tsx          # providers + AppViewport shell
  shared/
    ui/                 # HeroUI primitives + tokens
    patterns/           # AppViewport, BottomNav, AmountField, …
    hooks/
    lib/
    utils/
  modules/
    shared-kernel/
    tenancy/ ledger/ plan/ inbox/ health/
    platform/
  components/           # LEGACY alias → migrate to shared/ui (do not grow)
  tests/
  supabase/
  artifacts/
  ai-os/
```

Bounded contexts remain per Architecture Definition. Design System owns `shared/` conventions only.
