---
document: Visual Language
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
# Visual Language

## Direction: ViNha Calm Ledger (inherited)

Minimal · Calm · Premium · Friendly · Human · Financial · Modern 2026.

## Inspiration (philosophy only — do not copy)

Monzo · Copilot Money · Apple Wallet · Apple Health · Wise · Linear · Raycast · Notion (interaction quality only).

## Avoid

Enterprise · Corporate · Dashboard-heavy · Material-looking · Bootstrap-looking · Ant Design-looking · Rose Bloom pink · AI-purple · beige-brass craft defaults.

## Color

Cool stone/zinc neutrals + single **deep teal** accent. Semantic credit/debit/warn/danger are secondary — never the brand. Overspend never color-alone.

## Typography

**Geist** via `next/font`. Tabular figures for money. Mono only for IDs/debug. Not Inter-as-default. Not Fraunces / Instrument Serif.

## Iconography

**Phosphor** only (`@phosphor-icons/react`). One stroke weight globally. No emoji chrome. No second icon library.

## Charts

Recharts with minimal ink. Health narrative > flashy viz. Accessible text summaries.

## Empty / loading / error

Empty: next action. Loading: skeletons matching zones. Error: human recovery; never silent money failure.

## Dark mode

First-class from day one via `next-themes` + semantic tokens. Page theme lock inside the app viewport.
