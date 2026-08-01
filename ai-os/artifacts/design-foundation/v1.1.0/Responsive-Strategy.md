---
document: Responsive Strategy
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
# Responsive Strategy

## Policy

Supported viewports:

- **Mobile:** primary target (design source of truth)  
- **Tablet:** optional spacing scale only  
- **Desktop:** same mobile layout inside centered application viewport  

## Do not

- Introduce desktop-specific layout families  
- Swap bottom nav for sidebar at `lg`  
- Split panes on wide screens  
- Call the product “responsive-first” — it is **mobile-native**  

## Breakpoints

Use tokens (`sm/md/lg/…`) only to adjust spacing/type slightly or to center the viewport on large screens. Not to redesign structure.
