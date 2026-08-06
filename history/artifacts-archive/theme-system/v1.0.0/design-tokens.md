---
document: Design Tokens
theme_system: v1.0.0
status: OFFICIAL_THEME_SYSTEM_SOURCE_OF_TRUTH
run_id: run_theme_system_20260802T140000Z
created_at: 2026-08-02T07:00:00Z
frozen: true
---

# Design Tokens

Runtime values: [`styles/globals.css`](../../../styles/globals.css). TypeScript IDs: [`shared/theme/tokens.ts`](../../../shared/theme/tokens.ts).

## Surfaces

| Token | Light | Dark | Role |
|-------|-------|------|------|
| canvas-outer | `#F5F5F4` | `#111113` | Desktop decorative canvas |
| canvas | `#FAFAF9` | `#141416` | Viewport background |
| surface | `#FFFFFF` | `#1C1C1F` | Cards / panels |
| surface-elevated | `#FFFFFF` | `#27272B` | Sheets / dialogs |
| surface-hover | `#F5F5F4` | `#232326` | Hover wash |

Dark uses deep charcoal — not OLED `#000` / `#09090B`.

## Borders

| Token | Light | Dark |
|-------|-------|------|
| border-subtle / divider | `#E7E5E4` | `#3F3F46` |
| border-strong | `#D6D3D1` | `#52525B` |

## Text

| Token | Light | Dark |
|-------|-------|------|
| text-primary | `#18181B` | `#F4F4F5` |
| text-secondary | `#52525B` | `#A1A1AA` |
| text-tertiary / text-muted | `#71717A` | `#71717A` |
| placeholder | `#A1A1AA` | `#71717A` |
| disabled | `#A1A1AA` | `#52525B` |

## Brand / actions

| Token | Light | Dark |
|-------|-------|------|
| primary / accent | `#0F766E` | `#2DD4BF` |
| primary-hover | `#0D9488` | `#5EEAD4` |
| primary-fg / accent-fg | `#FAFAFA` | `#111113` |
| accent-strong | `#134E4A` | `#5EEAD4` |
| secondary | `#F5F5F4` | `#27272B` |
| secondary-fg | `#18181B` | `#F4F4F5` |
| inverse / inverse-fg | ink ↔ paper | paper ↔ ink |

## Status

| Token | Light | Dark |
|-------|-------|------|
| success | `#047857` | `#34D399` |
| warning | `#B45309` | `#FBBF24` |
| danger | `#BE123C` | `#FB7185` |
| info | `#0369A1` | `#38BDF8` |

## Money / domain

| Token | Maps to |
|-------|---------|
| credit / income | success family |
| debit / expense | neutral ink (not danger — spending ≠ error) |
| saving | accent |
| installment | warning |

## Health

| Token | Role |
|-------|------|
| health-excellent | Top band |
| health-good | Healthy |
| health-warning | Caution (always with text/icon) |
| health-critical | Critical (always with text/icon) |

## Charts

| Token | Role |
|-------|------|
| chart-ink | Axes / labels |
| chart-grid | Gridlines |
| chart-positive / negative / neutral | Directional series |
| chart-series-real | Real ledger (accent) |
| chart-series-intention | Intention plan (muted) |

## Feedback

| Token | Role |
|-------|------|
| skeleton | Loading bones |
| overlay / backdrop | Modal scrims |
| focus-ring | `:focus-visible` |

## Non-color tokens (unchanged)

Spacing, radius, motion (150–250ms), elevation, z-index, opacity, viewport (`--app-viewport-max: 440px`) — see Design Foundation tokens. Theme system does not fork them.
