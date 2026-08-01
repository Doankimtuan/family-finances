---
document: Design Language
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
# Design Language

## Philosophy

**Mobile Native.** Design for the phone first. Desktop never gets an independent layout language.

## Spacing

4px base scale. Comfortable daily-app density. Preserve mobile gutters (`--space-4`) inside the application viewport on all breakpoints. Do not stretch spacing to fill desktop width.

## Layout

Single-column content inside **Application Viewport (440px)**. Border-first hierarchy. Soft radius. Minimal elevation. No dashboard grids. No multi-column desktop pages unless a future Product decision explicitly requires it (none today).

## Grid

One column. Section stacks. Lists and cards share the phone width. Split list/detail is forbidden on desktop as a separate layout — use push navigation / sheets as on mobile.

## Density

Thumb-friendly. One primary question per screen. Progressive disclosure for advanced controls.

## Elevation & borders

Prefer hairline borders and soft dividers over stacked shadows. Elevation reserved for sheets, dialogs, sticky chrome — all clipped to the app viewport.

## Radius

Soft system: controls ~10px, cards ~12px, sheet tops ~16px. One scale only.

## Responsive (see Responsive-Strategy)

Breakpoints may scale spacing slightly. They must not fork layout families.
