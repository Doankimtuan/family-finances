---
document: Design Tokens
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
# Design Tokens

Inherited from v1.0.0 with canvas/viewport additions. CSS variables + Tailwind v4 mapping intent.

## Naming

Semantic first (`--color-accent`). Modes via `.dark` / `[data-theme="dark"]`.

## Color (semantic)

| Token | Role | Light | Dark |
|-------|------|-------|------|
| `--color-canvas-outer` | Desktop decorative canvas | stone-100/200 | zinc-950 |
| `--color-canvas` | Inside viewport bg | stone-50 | zinc-950 |
| `--color-surface` | Panels | white | zinc-900 |
| `--color-surface-elevated` | Sheets/dialogs | white | zinc-800 |
| `--color-border-subtle` | Dividers | stone-200 | zinc-700 |
| `--color-text-primary` | Body | zinc-900 | zinc-50 |
| `--color-text-secondary` | Supporting | zinc-600 | zinc-400 |
| `--color-accent` | Brand CTA | deep teal ~#0F766E | teal-400 |
| `--color-accent-fg` | On accent | off-white | zinc-950 |
| `--color-danger` | Destructive | rose-700 | rose-400 |
| `--color-warning` | Warn | amber-700 | amber-400 |
| `--color-success` | Success | emerald-700 | emerald-400 |
| `--color-credit` / `--color-debit` | Money direction | semantic | paired |
| `--color-focus-ring` | Focus | accent | accent |

No Rose Bloom pink. No purple brand.

## Viewport tokens

| Token | Value |
|-------|-------|
| `--app-viewport-max` | 440px |
| `--app-viewport-min` | 320px |
| `--app-viewport-band-max` | 480px |
| `--app-viewport-tablet-optional` | 640px (not default) |

## Spacing (4px base)

`--space-0`…`--space-16` as v1.0.0 (0,4,8,12,16,20,24,32,40,48,64). Page gutter `--space-4`.

## Radius

`--radius-sm` 6 · `--radius-md` 10 · `--radius-lg` 12 · `--radius-xl` 16 · `--radius-full` avatars only.

## Elevation

0 border-only · 1 sticky · 2 popover · 3 modal/sheet (viewport-scoped).

## Typography

`--font-sans` Geist · `--font-mono` IDs only · text scale xs–3xl · money: `tabular-nums`.

## Motion

`--duration-fast` 150ms · `--duration-normal` 200ms · `--duration-slow` 250ms · `--duration-celebrate` ≤600ms · `--ease-standard` cubic-bezier(0.16, 1, 0.3, 1).

## Breakpoints

sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536 — **centering/spacing only**.

## Z-index (within viewport stacking context)

base 0 · sticky 10 · nav 20 · dropdown 30 · overlay 40 · modal 50 · toast 60.
