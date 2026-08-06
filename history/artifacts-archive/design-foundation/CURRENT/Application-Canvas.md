---
document: Application Canvas
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
# Application Canvas

## Model

```text
┌──────────── Desktop / Tablet browser ────────────┐
│  decorative canvas (--color-canvas-outer)         │
│         ┌────── App Viewport 440px ──────┐       │
│         │ top context                     │       │
│         │ scrollable screen content       │       │
│         │ bottom nav (5 IA)               │       │
│         │ overlays/sheets/toasts (here)   │       │
│         └─────────────────────────────────┘       │
└───────────────────────────────────────────────────┘
```

## Rules

- Maximum application width: **440px** (recommended lock)  
- Viewport centered horizontally on desktop  
- Outer background is decorative only — never place primary UI there  
- Navigation, dialogs, sheets, overlays, toasts are **constrained to the application viewport**  
- No full-width desktop dialogs  
- No edge-to-edge desktop layouts  
- Treat every screen as if rendered inside a modern smartphone  

## Implementation pattern (intent)

`shared/patterns/AppViewport` wraps product shell. Portals for modals must target the viewport root, not `document.body` full browser (unless visually clipped to viewport bounds).
