---
document: Design Rules
developer_constitution: v1.1.0
status: OFFICIAL_IMPLEMENTATION_CONSTITUTION
run_id: run_developer_constitution_20260802T151500Z
created_at: 2026-08-02T15:15:00Z
board: Developer Constitution Board
frozen: true
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
design_foundation_sot: artifacts/design-foundation/CURRENT
design_system_sot: artifacts/design-system/CURRENT
screen_blueprints_sot: artifacts/screen-blueprints/CURRENT
implementation_plan_sot: artifacts/implementation-plan/CURRENT
rewrite_readiness_sot: artifacts/rewrite-readiness/CURRENT
---

# Design Rules

## Source of visual truth

Use Design Foundation v1.1.0 and Design System v1.0.0 only (`artifacts/.../CURRENT`). Do not follow superseded historical packs for layout or chrome.

## Tokens

1. Use **Design Tokens** exclusively.
2. Never hardcode colors, spacing, radius, shadow, typography, or animation values in feature code.
3. Every visual value must originate from the Design System / token CSS variables.
4. Consume tokens through their canonical Tailwind utility (`rounded-md`, `bg-accent`) rather than re-wrapping a CSS variable in an arbitrary-value bracket when a plain utility already resolves to the same value — see [Coding Standards / tailwind-policy.md](../../coding-standards/CURRENT/tailwind-policy.md) for the full canonical-vs-arbitrary decision tree.
4. Map tokens into HeroUI theme; do not ship default HeroUI marketing chrome unmodified.

## UI kit

1. HeroUI v3 only.
2. Phosphor icons only.
3. No Lucide, no MUI, no other kits.

## Canvas

1. `shared/patterns/AppViewport` wraps the product shell at **440px** max width.
2. Bottom navigation: Home | Money | Plan | Inbox | Together. Health via Home chip.
3. No sidebar. No desktop multi-column product chrome.
4. Modal/sheet portals target the viewport root.

## Component IDs

Implement Design System component specs and Screen Blueprint inventories. Do not invent parallel primitives that duplicate `shared/ui`.
