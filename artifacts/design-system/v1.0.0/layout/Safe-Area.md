---
document: Safe Area
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
# Safe Area Rules

- Pad bottom nav for home indicator (`env(safe-area-inset-*)`)
- TopAppBar respects notch/status insets
- All safe-area math inside AppViewport, not outer canvas
