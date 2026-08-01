---
document: Token Pack README
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
# Token Pack

Faithful expansion of Design Foundation v1.1.0. Semantic-first CSS variables (`--color-accent`, not raw teal in product UI).

## Rules

- One canonical ID per role (see `tokens.json`)
- Light/dark pairs for colors
- Map into HeroUI / `@heroui/styles` — do not ship default HeroUI marketing chrome unmodified
- Viewport max **440px** (`--app-viewport-max`)

## Files

color · typography · spacing · radius · elevation · motion · animation · border · shadow · icon · chart · theme · dark-mode · breakpoints · z-index · opacity · tokens.json
