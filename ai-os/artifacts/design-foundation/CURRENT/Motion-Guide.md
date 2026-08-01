---
document: Motion Guide
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
# Motion Guide

## Intensity

Restrained (`MOTION_INTENSITY: 3` inherited). 150–250ms UI feedback. Celebration ≤600ms only for Month Ritual / goal / EMI.

## Rules

- Animate `transform` / `opacity` only  
- Motion must signal hierarchy, feedback, or state  
- No infinite loops on cards  
- No scroll-hijack chrome  
- Use `motion/react` in client leaves only  

## Reduced motion

`prefers-reduced-motion: reduce` → instant swaps; no celebration choreography.
