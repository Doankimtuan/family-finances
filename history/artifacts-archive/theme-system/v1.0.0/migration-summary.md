---
document: Migration Summary
theme_system: v1.0.0
status: OFFICIAL_THEME_SYSTEM_SOURCE_OF_TRUTH
run_id: run_theme_system_20260802T140000Z
created_at: 2026-08-02T07:00:00Z
frozen: true
---

# Migration Summary

## What changed

| Area | Change |
|------|--------|
| `styles/globals.css` | Full semantic token expansion (surfaces, brand, status, money, health, charts, overlays); charcoal dark; `@custom-variant dark`; theme-transition CSS |
| `providers/theme-provider.tsx` | Explicit themes list + intentional transition bridge |
| `shared/patterns/theme-toggle.tsx` | **New** — System / Light / Dark |
| `shared/patterns/together-preferences.tsx` | **New** — preferences card |
| `shared/theme/*` | **New** — token IDs + chart color helpers |
| Together page | Hosts preferences (theme + locale) |
| `social-button.tsx` | Chrome → semantic tokens |
| `app/not-found.tsx` | Palette utilities → semantic tokens |
| `shared/ui/skeleton.tsx` | Uses `skeleton` token |
| i18n `settings` / `a11y` | Appearance copy EN + VI |

## What did not change

- Product Definition, Architecture, Technical Spec, frozen Design Foundation / Design System packs (not mutated).
- Business logic / domain modules.
- Navigation IA.
- Phosphor as in-app icon set; Cradle & Seed brand mark remains identity-only.

## Hardcoded color exceptions

| Location | Why allowed |
|----------|-------------|
| Google glyph SVG fills (`#4285F4` etc.) | Third-party brand IP — not product theme |
| Branding SVG assets under `artifacts/branding/**` and `public/*` icons | Static brand masters (teal plate) |

## For future contributors

1. Never add `bg-zinc-*` / `text-teal-*` / raw hex in `app/` or `shared/` product UI.
2. Prefer `bg-surface`, `text-text-primary`, `bg-accent`, `border-border-subtle`, …
3. Charts: `import { getChartPalette } from "@/shared/theme"`.
4. New status UI: use `success` / `warning` / `danger` / `info` or health-* tokens + non-color cue.
