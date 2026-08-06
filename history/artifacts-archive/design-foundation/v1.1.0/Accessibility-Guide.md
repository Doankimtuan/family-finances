---
document: Accessibility Guide
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
# Accessibility Guide

Expands REQ-019 and React Aria (via HeroUI).

## Requirements

1. Keyboard paths: capture, Inbox resolve, Month Ritual  
2. Visible focus rings (`--color-focus-ring`)  
3. Labels on inputs; errors via `aria-describedby`  
4. No color-alone for overspend, jar state, nav active  
5. Touch targets ≥44×44px  
6. Contrast WCAG AA minimum  
7. `prefers-reduced-motion` honored  
8. Modal focus trap inside application viewport  

## Screen readers

Inbox badge name includes count. Charts have text summaries. Decorative icons `aria-hidden`.

## Testing

Playwright keyboard paths (AC-019). Contrast in light and dark inside 440px viewport.
