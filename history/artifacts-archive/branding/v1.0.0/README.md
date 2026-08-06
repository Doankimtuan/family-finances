---
document: README
branding: v1.0.0
status: OFFICIAL_BRAND_SOURCE_OF_TRUTH
run_id: run_branding_20260802T133600Z
created_at: 2026-08-02T06:40:00Z
board: Brand & Icon Design
frozen: true
design_foundation_sot: artifacts/design-foundation/CURRENT
design_system_sot: artifacts/design-system/CURRENT
product_sot: artifacts/product-definition/CURRENT
---

# ViNha Brand Identity `v1.0.0`

**Status:** `OFFICIAL_BRAND_SOURCE_OF_TRUTH`
**Board:** Brand & Icon Design
**Scope:** Brand mark, app icon system, favicon, color system. No product IA, navigation, or component changes — see [Design Foundation](../../design-foundation/CURRENT/README.md) and [Design System](../../design-system/CURRENT/tokens/README.md) for those.

## Design read

Modern household finance OS · calm / warm / trustworthy / minimal · not a bank, not a trading app · symbol direction: **Home Nest + Harmony** · color: extends the shipped **Calm Ledger** teal, not a new hue.

## Selected concept

**Cradle & Seed** — a thick, protective rounded cradle (representing the home, shelter, and shared household) holding a floating seed/coin at its center (representing growth, financial planning, and potential). See [icon-decision.md](./icon-decision.md) for construction and [icon-exploration.md](./icon-exploration.md) for the concepts it was scored against.

## Documents

1. [brand-strategy.md](./brand-strategy.md)
2. [brand-personality.md](./brand-personality.md)
3. [logo-concepts.md](./logo-concepts.md)
4. [icon-exploration.md](./icon-exploration.md)
5. [icon-decision.md](./icon-decision.md)
6. [color-system.md](./color-system.md)
7. [favicon-guidelines.md](./favicon-guidelines.md)
8. [app-icon-guidelines.md](./app-icon-guidelines.md)
9. [export-specifications.md](./export-specifications.md)
10. [design-rationale.md](./design-rationale.md)

## Assets

SVG-first masters live in [`assets/svg/`](./assets/svg/); size/safe-zone diagrams in [`assets/specs/`](./assets/specs/). Production files consumed by the app live in [`public/`](../../../public/) — see [export-specifications.md](./export-specifications.md) for the mapping.

## Boundaries

- Does not modify [Design Foundation](../../design-foundation/CURRENT/) or [Design System](../../design-system/CURRENT/) packs — it consumes their tokens (`--vinha-accent`, Geist, radius scale) and adds brand-only layers on top.
- Does not touch in-product UI icons (Phosphor stays the in-app icon set per [`UI-Technology-Decision.md`](../../design-foundation/CURRENT/UI-Technology-Decision.md)). The brand mark is app-identity only (icon, favicon, splash) — never used as an inline UI icon.
- Does not introduce a second brand hue, gradients-as-identity, or skeuomorphic detail.
