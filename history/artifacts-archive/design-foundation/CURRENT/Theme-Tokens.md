---
document: Theme Tokens
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
# Theme Tokens

## Provider

`next-themes` at app-shell level. Default: system preference. Manual toggle in Together/preferences.

## HeroUI mapping

Map ViNha semantic CSS variables into HeroUI theme / `@heroui/styles` customization so primitives inherit Calm Ledger — do not ship default HeroUI marketing chrome unmodified.

## Light / dark

Every semantic token has a pair. Hierarchy parity across modes. Off-black / off-white — avoid pure `#000` / `#fff`.

## Page theme lock

Theme applies to the application viewport and outer canvas together. No mid-scroll theme flips per section.
