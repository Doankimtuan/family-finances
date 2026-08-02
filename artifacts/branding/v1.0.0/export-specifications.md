---
document: Export Specifications
branding: v1.0.0
status: OFFICIAL_BRAND_SOURCE_OF_TRUTH
run_id: run_branding_20260802T133600Z
created_at: 2026-08-02T06:40:00Z
frozen: true
---

# Export Specifications

All masters are SVG-first (see [`assets/svg/`](./assets/svg/)); every raster below is a lossless export of one of those masters at a fixed pixel size. No raster is ever hand-edited — regenerate from the SVG if a size is wrong.

## Master → export map

| Master SVG | Exports to `public/` | Sizes | Format |
|---|---|---|---|
| `assets/svg/favicon.svg` | `favicon.svg` | vector (any) | SVG |
| `assets/svg/favicon.svg` | `favicon-16x16.png` | 16×16 | PNG |
| `assets/svg/favicon.svg` | `favicon-32x32.png` | 32×32 | PNG |
| `assets/svg/favicon.svg` | `favicon.ico` | 16, 32, 48 (multi-res) | ICO |
| `assets/svg/app-icon.svg` | `apple-touch-icon.png` | 180×180 | PNG (no alpha) |
| `assets/svg/app-icon.svg` | `icon-192.png` | 192×192 | PNG |
| `assets/svg/app-icon.svg` | `icon-512.png` | 512×512 | PNG |
| `assets/svg/app-icon.svg` | App Store master (kept in `assets/`, not shipped to `public/`) | 1024×1024 | PNG, no alpha |
| `assets/svg/maskable.svg` | `maskable-512.png` | 512×512 | PNG |
| `assets/svg/adaptive-foreground.svg` | Android Studio asset pipeline input (not a `public/` file) | 108dp / 432px @4x | PNG or kept as SVG for Android Studio's adaptive icon tool |
| `assets/svg/adaptive-background.svg` | Android Studio asset pipeline input | 108dp / 432px @4x | PNG or SVG |
| `assets/svg/monochrome.svg` | Android Studio monochrome layer input | 108dp / 432px @4x | SVG preferred (vector drawable) |
| `assets/svg/notification.svg` | Android `res/drawable` (native shells only; not applicable to the current Next.js web app) | 24dp / 96px @4x | PNG or vector drawable |
| `assets/svg/mark.svg` | Referenced by splash screen, docs, marketing | vector (any) | SVG |

## `public/` file list (this implementation)

```
public/
  favicon.svg
  favicon-16x16.png
  favicon-32x32.png
  favicon.ico
  apple-touch-icon.png
  icon-192.png
  icon-512.png
  maskable-512.png
  manifest.webmanifest
```

Android native adaptive-icon and notification-icon exports are not produced as `public/` web assets in this pass — this is a Next.js web app, and Android/iOS native shells (if built later) should re-export from the same `assets/svg/adaptive-*.svg` and `assets/svg/notification.svg` masters at that time; the vector source is already spec-complete for that future work.

## Sizing rationale

| Size | Why |
|---|---|
| 16, 32 | Browser tab / bookmark favicon standard |
| 48 (in .ico) | Windows shortcut / legacy IE fallback bundled inside the multi-res `.ico` |
| 180 | Apple touch icon (iOS home-screen bookmark), Apple's current single required size |
| 192, 512 | W3C manifest `"purpose": "any"` minimum + recommended sizes for PWA install prompts and Android home-screen shortcuts |
| 512 (maskable) | W3C manifest `"purpose": "maskable"` recommended size |
| 1024 | Apple App Store Connect required master, kept for future native App Store submission |

## Format rules

- PNG exports: no interlacing, sRGB color profile, 8-bit color depth.
- `apple-touch-icon.png` and the 1024 App Store master must have **no alpha channel** (flatten onto the `#0F766E` plate) — both Apple pipelines reject transparency.
- All other PNGs (icon-192, icon-512, maskable-512, favicon rasters) keep alpha where the source SVG has transparent regions (e.g. `favicon.svg`'s rounded-corner cutout).
- `.ico` bundles 16/32/48 in one file, generated from the same `favicon.svg` master at each size — never a separate hand-drawn ICO.

## Regenerating exports

`scripts/generate-brand-assets.mjs` (repo root) rasterizes every `public/` file in this table directly from the SVG masters using `sharp`, and writes the 1024 App Store master to `artifacts/branding/CURRENT/assets/exports/`. Run `node scripts/generate-brand-assets.mjs` after any master SVG edit — never hand-edit a PNG or the `.ico`.

## Manifest wiring

`public/manifest.webmanifest` declares `icon-192.png` and `icon-512.png` with `"purpose": "any"`, plus `maskable-512.png` with `"purpose": "maskable"`, per [app-icon-guidelines.md](./app-icon-guidelines.md). Next.js metadata (`app/layout.tsx`) references `favicon.svg`, `apple-touch-icon.png`, and the manifest via the standard `metadata.icons` / `metadata.manifest` fields — implementation detail lives in the app icon guidelines, not duplicated here.
