---
document: Favicon Guidelines
branding: v1.0.0
status: OFFICIAL_BRAND_SOURCE_OF_TRUTH
run_id: run_branding_20260802T133600Z
created_at: 2026-08-02T06:40:00Z
frozen: true
---

# Favicon Guidelines

## Source

[`assets/svg/favicon.svg`](./assets/svg/favicon.svg) — Cradle & Seed mark on a rounded-square teal plate (`rx` ≈ 22% of canvas, unlike the app icon which ships full-bleed square since browsers, unlike OS launchers, do not auto-mask corners).

## 16×16 concept

At 16px the mark's Cradle & Seed construction compresses to a clean, recognizable silhouette — this is intentional and validated in [icon-decision.md](./icon-decision.md). No internal detail is expected or needed to survive at this size; the plate's rounded corners plus the mark's flat base are the only two shapes that must render cleanly.

- Plate: solid `#0F766E`, corner radius scaled so it reads as "rounded square," not "circle" (over-rounding at 16px collapses to a dot).
- Mark: solid `#FAFAFA`, centered, occupying ~60% of the plate's width.

## 32×32 concept

Same construction; at this size the floating seed/coin detail (the "growth/finance" detail) becomes clearly visible on a sharp display, rewarding closer inspection (e.g. pinned-tab hover, browser history) without being necessary for recognition.

## SVG concept

Modern browsers (Chrome, Firefox, Safari 16+, Edge) render `favicon.svg` directly and pick the correct raster size automatically; it is referenced first in `<link rel="icon">` order, with the raster PNG/ICO fallbacks after it for older user agents. Because the source is vector, the favicon never looks soft or pixel-doubled on high-DPI displays or when a browser renders it larger than 32px (e.g. bookmark bar tooltips on some platforms).

## Files produced (see export-specifications.md for the full matrix)

| File | Purpose |
|---|---|
| `public/favicon.svg` | Primary, modern browsers |
| `public/favicon-16x16.png` | Legacy raster fallback |
| `public/favicon-32x32.png` | Legacy raster fallback, retina tab |
| `public/favicon.ico` | Multi-resolution (16/32/48) for IE/old Edge and OS-level shortcuts |

## Recognition rule

The favicon must remain identifiable as ViNha even when it is the only ViNha surface visible (e.g. a single open browser tab among 20 others). Because the plate color (`#0F766E`) is distinct from the neutral grays/blues most browser-chrome and competing finance-tool favicons use, color alone gives a strong first-pass recognition signal before shape registers — this is deliberate and is the same reasoning Design Tokens already applied to `--color-accent` as the one brand-carrying hue in the product.
