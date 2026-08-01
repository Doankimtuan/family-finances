---
document: Motion Guidelines
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Motion Guidelines

`MOTION_INTENSITY: 3` — fluid but restrained. Motion must communicate hierarchy, feedback, or state — never decoration for its own sake.

## Allowed

- 150–250ms opacity/transform on feedback and panels  
- Sheet/dialog enter/exit  
- Subtle press on buttons  
- Celebration ≤600ms on **Month Ritual complete**, **goal hit**, **EMI complete** only  

## Forbidden

- Infinite loops on cards  
- Parallax / scroll-hijack as product chrome  
- Custom cursors  
- Em-dash kinetic type tricks  
- Motion that delays capture  

## Reduced motion

If `prefers-reduced-motion: reduce`: no celebration choreography; instant state swaps; opacity optional only.

## Implementation note

Motion isolated in client leaves (`'use client'`). Prefer CSS or `motion/react` for UI; no `window.scroll` listeners.
