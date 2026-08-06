---
document: Design Language
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Design Language

## Spacing Philosophy

4px base unit. Comfortable daily-app density (`VISUAL_DENSITY: 5`). Generous between major Home zones; tighter inside forms and Inbox cards. Prefer consistent vertical rhythm over one-off magic numbers.

## Layout Philosophy

Mobile-first. Content max width constrained on desktop (comfortable reading, not full-bleed dashboards). Split layouts only when both columns earn space (e.g. Plan list + detail). Anti-center bias is mild: product chrome stays predictable (`DESIGN_VARIANCE: 4`).

## Grid System

- Mobile: single column, 16px page gutter  
- Tablet: 8-column mental grid  
- Desktop: 12-column; primary content ~8 cols; utility optional  
- Nav chrome owned by app shell; surfaces own page content  

## Density

Daily app: `py` section rhythm medium. Lists use dividers or sparse cards — not cockpit packing. Numbers and money rows stay scannable with tabular figures.

## Elevation

Prefer 1px borders and soft dividers over stacked shadows. Elevation tokens reserved for dialogs, sheets, and sticky chrome. Shadows tinted to surface hue — never pure black blobs.

## Radius

One soft scale: controls ~8–12px; cards ~12px; mobile bottom sheets larger top radius. No mixed sharp/pill systems without a documented rule.

## Border Style

Hairline neutral borders (`border-subtle`). Stronger borders only for focus rings and destructive emphasis. Avoid double hairlines on every list row.

## Responsive Strategy

- Bottom primary nav on small viewports  
- Same five IA labels on desktop (side or top)  
- Capture optimized for thumb reach  
- Cards/lists collapse to single column <768px  
- Safe-area padding for bottom nav  

## Internationalization Considerations

- en/vi string catalogs via platform i18n  
- Locale from household when member  
- Money format by household locale  
- Layout must tolerate Vietnamese string length (+~20–30%)  
- No hard-coded sentence order that breaks translation  

## Dark Mode Strategy

First-class token pairs from day one. Page theme lock: entire product stays in chosen theme; no mid-scroll light/dark flips. Respect `prefers-color-scheme` with optional manual toggle in Together/preferences.
