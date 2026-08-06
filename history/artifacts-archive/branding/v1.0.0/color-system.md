---
document: Color System
branding: v1.0.0
status: OFFICIAL_BRAND_SOURCE_OF_TRUTH
run_id: run_branding_20260802T133600Z
created_at: 2026-08-02T06:40:00Z
frozen: true
design_tokens_sot: artifacts/design-foundation/CURRENT/Design-Tokens.md
---

# Color System

The brand palette **formalizes and extends** the color system already shipped in [`styles/globals.css`](../../../styles/globals.css) and frozen in [`Design-Tokens.md`](../../design-foundation/CURRENT/Design-Tokens.md) — "ViNha Calm Ledger": deep teal accent on cool stone/zinc neutrals. This document does not introduce a new hue; it names the brand roles, adds the two brand-only additions (Secondary and Surface-brand tint), and maps every value to its existing CSS variable so implementation stays a single source of truth.

## Why teal, still

Teal sits between the trust of blue (banking, but avoided as "corporate") and the warmth of green (growth, without reading as "money-green" cliché or a stock-ticker green). It is deliberately **desaturated** relative to typical fintech neon-blue/purple — see `DD-02` in [`Design-Decision-Log.md`](../../design-foundation/v1.0.0/Design-Decision-Log.md): "Deep teal on cool stone/zinc — Trust/calm; reject pink/purple/beige-brass." This brand pack ratifies that decision rather than revisiting it.

## Brand roles

| Role | Light | Dark | CSS variable | Notes |
|---|---|---|---|---|
| Primary / Accent | `#0F766E` | `#2DD4BF` | `--vinha-accent` / `--color-accent` | Mark fill on light, CTA, focus ring |
| Primary-on-accent | `#FAFAFA` | `#09090B` | `--vinha-accent-fg` / `--color-accent-fg` | Mark fill on brand plate, text on CTA |
| Secondary (brand-only, new) | `#134E4A` (teal-900) | `#5EEAD4` (teal-300) | new: `--vinha-accent-strong` | Splash headline tint, pressed/active states — same hue family, never a second competing color |
| Neutral / Surface | `#FAFAF9` canvas → `#FFFFFF` surface | `#09090B` canvas → `#18181B` surface | `--vinha-canvas`, `--vinha-surface` | Stone/zinc ladder, unchanged from Design Tokens |
| Success | `#047857` | `#34D399` (emerald-400) | `--vinha-success` | Goal hit, ritual complete |
| Warning | `#B45309` | `#FBBF24` (amber-400) | `--vinha-warning` | Overspend flag — always paired with text/icon, never color-alone (`Accessibility-Guide.md`) |
| Error | `#BE123C` | `#FB7185` (rose-400) | `--vinha-danger` | Destructive actions only |
| Border | `#E7E5E4` subtle / `#D6D3D1` strong | `#3F3F46` / `#52525B` | `--vinha-border-subtle` / `--vinha-border-strong` | Unchanged |
| Text | `#18181B` primary / `#52525B` secondary / `#71717A` muted | `#FAFAFA` / `#A1A1AA` / `#71717A` | `--vinha-text-*` | Unchanged |

## Money-direction pair (unchanged, cited for completeness)

`--vinha-credit` `#047857` (same as success — money in) · `--vinha-debit` `#27272A` (neutral ink — money out, deliberately *not* red, so everyday spending never looks like an error state).

## Light mode

```
canvas-outer #F5F5F4 → canvas #FAFAF9 → surface #FFFFFF → surface-elevated #FFFFFF
accent #0F766E on accent-fg #FAFAFA
text-primary #18181B / text-secondary #52525B / text-muted #71717A
```

## Dark mode

```
canvas-outer #09090B → canvas #09090B → surface #18181B → surface-elevated #27272A
accent #2DD4BF on accent-fg #09090B
text-primary #FAFAFA / text-secondary #A1A1AA / text-muted #71717A
```

## App icon plate colors

| Asset | Plate fill | Mark fill |
|---|---|---|
| iOS / primary app icon | `#0F766E` (light accent, fixed — app icons don't theme-switch with OS dark mode by default) | `#FAFAFA` |
| Android adaptive background layer | `#0F766E` | — (background layer carries no mark) |
| Android adaptive foreground layer | transparent | `#FAFAFA` |
| Monochrome / themed icon (Android 13+, iOS 18+ tinted) | transparent | `currentColor` (OS-applied tint) |
| Maskable / PWA | `#0F766E` | `#FAFAFA` |

Rationale for a fixed teal plate rather than a dark-mode-swapped plate: app icons sit on the home screen alongside icons from every other app and OS wallpaper — swapping the plate color by system theme would make the icon inconsistent across a user's own device. Only in-app surfaces and the monochrome/themed icon variants respond to dark mode.

## Explicitly avoided

- Saturated fintech blue/purple gradients (already banned — "No Rose Bloom pink. No purple brand." per `Design-Tokens.md`).
- Neon or high-chroma green (reads as "stock gain," a trading signal we exclude by brief).
- Warm cream + terracotta pairing (a common AI-generated-design default; explicitly avoided per design-taste guardrails).
- Pure black/white "enterprise" mono palette (reads corporate, not warm/human).

## Accessibility

Accent-on-canvas and text-on-surface pairs already meet WCAG AA per [`Accessibility-Guide.md`](../../design-foundation/CURRENT/Accessibility-Guide.md); the brand pack introduces no new text/background combination — `--vinha-accent-strong` (Secondary) is reserved for non-text decorative/pressed-state use only, so it carries no independent contrast requirement.
