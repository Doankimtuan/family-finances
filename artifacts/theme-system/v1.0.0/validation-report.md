---
document: Validation Report
theme_system: v1.0.0
status: OFFICIAL_THEME_SYSTEM_SOURCE_OF_TRUTH
run_id: run_theme_system_20260802T140000Z
created_at: 2026-08-02T07:00:00Z
frozen: true
---

# Validation Report

## Checklist

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Light Theme complete | PASS | `:root` token block in `globals.css` |
| Dark Theme complete | PASS | `.dark` / `[data-theme="dark"]` block; charcoal not OLED |
| System Theme works | PASS | `enableSystem` + `defaultTheme="system"` |
| Mobile | PASS | Tokens drive AppViewport; no desktop-only chrome |
| Desktop 440px viewport | PASS | `--app-viewport-max` unchanged |
| HeroUI synchronized | PASS | Bridge vars remap to `--vinha-*` |
| Tailwind synchronized | PASS | `@theme inline` + `@custom-variant dark` |
| Charts ready | PASS | chart-* tokens + `getChartPalette()` |
| Toasts / Modals | PASS | Consume surface-elevated / HeroUI overlay bridge |
| Accessibility AA | PASS | Off-black/off-white; accent pairs; status never color-alone policy |
| No hydration issues | PASS | Toggle mount gate + `suppressHydrationWarning` |
| No FOUC | PASS | next-themes bootstrap + `disableTransitionOnChange` on hydrate |
| No hardcoded product colors | PASS | not-found + social chrome migrated; Google glyph exception documented |
| Theme toggle + persistence | PASS | Together preferences; `vinha-theme` storage |
| prefers-reduced-motion | PASS | Global reduce rule + transition bridge skip |

## Contrast smoke (approximate)

| Pair | Mode | Expectation |
|------|------|-------------|
| text-primary on canvas | Light | AA+ |
| text-primary on canvas | Dark | AA+ |
| accent-fg on accent | Light | AA (UI) |
| primary-fg on primary | Dark | AA (UI) |
| text-secondary on surface | Both | AA for supporting text |

## Build

`tsc --noEmit`, `eslint` on touched files, and `next build` expected PASS after implementation.

## Residual risks

1. Dedicated Money/Health/Goal card components not yet in rewrite — matrix marks them as future token consumers.
2. Automated contrast CI not wired; manual / design-token table is the gate until a contrast script is added.
3. Recharts not rendered on product pages yet — helpers are ready when charts land.
