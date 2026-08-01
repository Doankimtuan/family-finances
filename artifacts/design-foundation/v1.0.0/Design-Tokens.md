---
document: Design Tokens
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Design Tokens

CSS custom properties + Tailwind v4 mapping intent. Values are foundation locks; implementation may refine hex within the same roles without changing personality.

## Naming Conventions

- Semantic first: `--color-accent`, not `--color-teal-700` in product UI  
- Scale tokens allowed under primitives: `--color-teal-700`  
- Prefix: `--vn-` optional; prefer unprefixed semantic in app theme  
- Modes: light default; dark under `.dark` or `[data-theme="dark"]`  

## Color Tokens (semantic)

| Token | Role | Light intent | Dark intent |
|-------|------|--------------|-------------|
| `--color-canvas` | Page background | cool stone-50 | zinc-950 |
| `--color-surface` | Panels | white/stone-0 | zinc-900 |
| `--color-surface-elevated` | Sheets/dialogs | white | zinc-800 |
| `--color-border-subtle` | Dividers | stone-200 | zinc-700 |
| `--color-text-primary` | Body/titles | zinc-900 | zinc-50 |
| `--color-text-secondary` | Supporting | zinc-600 | zinc-400 |
| `--color-accent` | Brand CTA/active | deep teal ~#0F766E | teal-400 |
| `--color-accent-fg` | On accent | off-white | zinc-950 |
| `--color-danger` | Destructive | rose-700 | rose-400 |
| `--color-warning` | Warn overspend | amber-700 | amber-400 |
| `--color-success` | Safe success | emerald-700 | emerald-400 |
| `--color-credit` | Money in | teal/emerald semantic | paired |
| `--color-debit` | Money out | neutral emphasis or rose soft | paired |
| `--color-focus-ring` | Focus | accent @ high contrast | accent |

Primitives (reference): stone/zinc scale + teal scale. **No** Rose Bloom pink SoT. **No** purple brand.

## Spacing Tokens

Base 4px.

| Token | px |
|-------|-----|
| `--space-0` | 0 |
| `--space-1` | 4 |
| `--space-2` | 8 |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-5` | 20 |
| `--space-6` | 24 |
| `--space-8` | 32 |
| `--space-10` | 40 |
| `--space-12` | 48 |
| `--space-16` | 64 |

Page gutter mobile: `--space-4`. Section gaps: `--space-8`–`--space-12`.

## Radius Tokens

| Token | px | Use |
|-------|-----|-----|
| `--radius-sm` | 6 | chips, small controls |
| `--radius-md` | 10 | inputs, buttons |
| `--radius-lg` | 12 | cards |
| `--radius-xl` | 16 | sheets (top) |
| `--radius-full` | 9999 | avatars only (not default buttons) |

## Elevation Tokens

| Token | Use |
|-------|-----|
| `--elevation-0` | flat / border only |
| `--elevation-1` | sticky header subtle |
| `--elevation-2` | popover / menu |
| `--elevation-3` | modal / sheet |

Shadows tinted to canvas; low opacity.

## Typography Tokens

| Token | Size / weight intent |
|-------|----------------------|
| `--font-sans` | Geist, system fallbacks |
| `--font-mono` | Geist Mono / ui-monospace (IDs only) |
| `--text-xs` | 12 |
| `--text-sm` | 14 |
| `--text-base` | 16 |
| `--text-lg` | 18 |
| `--text-xl` | 20 |
| `--text-2xl` | 24 |
| `--text-3xl` | 30 |
| `--font-normal` | 400 |
| `--font-medium` | 500 |
| `--font-semibold` | 600 |
| `--leading-tight` | 1.2 |
| `--leading-normal` | 1.5 |
| `--tracking-tight` | -0.02em |

Money: `font-variant-numeric: tabular-nums`.

## Animation Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--duration-fast` | 150ms | hover/active |
| `--duration-normal` | 200ms | panels |
| `--duration-slow` | 250ms | sheet |
| `--duration-celebrate` | ≤600ms | ritual/goal/EMI only |
| `--ease-standard` | cubic-bezier(0.16, 1, 0.3, 1) | UI |

Honor `prefers-reduced-motion: reduce` → durations 0 / opacity only.

## Breakpoint Tokens

| Token | px |
|-------|-----|
| `--bp-sm` | 640 |
| `--bp-md` | 768 |
| `--bp-lg` | 1024 |
| `--bp-xl` | 1280 |
| `--bp-2xl` | 1536 |

## Z-index Rules

| Token | Value | Layer |
|-------|-------|-------|
| `--z-base` | 0 | content |
| `--z-sticky` | 10 | sticky headers |
| `--z-nav` | 20 | primary nav |
| `--z-dropdown` | 30 | menus |
| `--z-overlay` | 40 | scrim |
| `--z-modal` | 50 | dialog/sheet |
| `--z-toast` | 60 | snackbar |
| `--z-max` | 70 | a11y emergency only |

No arbitrary `z-50` spam outside this scale.
