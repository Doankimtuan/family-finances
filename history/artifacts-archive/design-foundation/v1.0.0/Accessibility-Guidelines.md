---
document: Accessibility Guidelines
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Accessibility Guidelines

Expands Product REQ-019 and principle *Accessible by default*.

## Requirements

1. Keyboard paths for **capture**, **Inbox resolve**, **Month Ritual**  
2. Visible focus rings using `--color-focus-ring`  
3. Labels on all inputs; errors linked via `aria-describedby`  
4. Do not use color alone for overspend, jar state, or nav active  
5. Touch targets ≥44×44px  
6. Contrast WCAG AA minimum for text and essential controls (AAA target for primary money figures where feasible)  
7. `prefers-reduced-motion` honored  
8. `prefers-reduced-transparency` / solid fallbacks if any glass used (glass not default)  

## Focus order

Logical: chrome → primary content → primary CTA → secondary. Modals trap focus; restore on close.

## Screen readers

- Inbox badge: accessible name with count  
- Charts: text summary  
- Decorative icons: `aria-hidden`  

## Testing

Playwright a11y keyboard paths per Tech Spec AC-019. Manual contrast check in light and dark.
