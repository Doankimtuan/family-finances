---
document: Desktop Strategy
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
# Desktop Strategy

## Principle

Desktop is **not** another platform. Desktop is a larger canvas.

The experience must feel like **holding a phone in the middle of a monitor**.

## Rules

1. Keep content centered  
2. Limit application width to **440px** (allowed band 420–480px)  
3. Preserve mobile proportions, spacing, navigation, and interactions  
4. **No sidebar navigation**  
5. **No enterprise layouts**  
6. **Do not stretch forms**  
7. **Do not create dashboard layouts**  
8. **Do not create multi-column desktop pages**  
9. Background outside the viewport is decorative canvas only  
10. All overlays constrained to the application viewport  

## Optional width

**640px** is reserved for rare tablet-style experiences only if a future Product decision requires it. Default remains **440px**.

## Forbidden (explicit)

Side/top desktop nav (supersedes Design Foundation v1.0.0). Full-width desktop dialogs. Edge-to-edge desktop content.
