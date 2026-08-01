---
document: Design Checklist
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
# Design Checklist

Gate before any UI PR.

## Mobile native

- [ ] Layout designed for phone first  
- [ ] Desktop uses centered **440px** viewport (not stretched)  
- [ ] Bottom nav present; **no sidebar**  
- [ ] Overlays confined to app viewport  
- [ ] Touch targets ≥44px  

## Product

- [ ] IA labels correct; Health not 6th primary tab  
- [ ] real≠virtual labeling intact  
- [ ] One primary question / CTA  

## System

- [ ] HeroUI only; Phosphor only  
- [ ] Tokens from Design Foundation  
- [ ] Geist + tabular money  
- [ ] Light/dark considered  
- [ ] Reduced motion honored  

## Forbidden patterns absent

- [ ] No enterprise dashboard  
- [ ] No multi-column desktop redesign  
- [ ] No full-bleed desktop dialogs  
- [ ] No second UI/icon library  
- [ ] No import from `archive/legacy-v1`  

If any box fails, do not merge.
