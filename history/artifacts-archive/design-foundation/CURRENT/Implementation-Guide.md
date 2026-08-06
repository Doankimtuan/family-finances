---
document: Implementation Guide
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
# Implementation Guide

## Compose screens

1. Wrap product shell in `AppViewport` (440px)  
2. Use `BottomNav` for five IA items  
3. Build UI from `shared/ui` → `shared/patterns` → feature components  
4. Wire data via module application services / TanStack Query — never SQL in UI  
5. Forms: RHF + Zod shared with commands  

## Import rules

```text
app/**        → shared/patterns, shared/ui, modules/*/application (public)
shared/ui     → @heroui/react, tokens, phosphor
shared/patterns → shared/ui, shared/hooks
modules/**    → shared/*, not app/**
FORBIDDEN     → archive/legacy-v1, second UI kit, lucide (unless explicitly approved — default Phosphor only)
```

## CSS bootstrap (intent)

```css
@import "tailwindcss";
@import "@heroui/styles";
/* then ViNha semantic token overrides */
```

## Overlays

Portals must visually and hit-test within the application viewport.

## Do not

- `npm` install alternate component libraries  
- Stretch layouts with `max-w-7xl` content shells  
- Add desktop sidebars at breakpoints  
