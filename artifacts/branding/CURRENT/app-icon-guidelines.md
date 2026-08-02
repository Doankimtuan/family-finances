---
document: App Icon Guidelines
branding: v1.0.0
status: OFFICIAL_BRAND_SOURCE_OF_TRUTH
run_id: run_branding_20260802T133600Z
created_at: 2026-08-02T06:40:00Z
frozen: true
---

# App Icon Guidelines

All variants derive from the single Cradle & Seed master path in [icon-decision.md](./icon-decision.md). Nothing below redraws the mark — every platform variant only changes canvas shape, safe-zone padding, and fill color.

## iOS App Icon

- Source: [`assets/svg/app-icon.svg`](./assets/svg/app-icon.svg) — full-bleed square, `#0F766E` plate, `#FAFAFA` mark.
- Deliver as a **full square with square corners** — iOS applies its own continuous-corner (squircle) mask at render time. Never pre-round the corners or add a shadow/bevel; iOS adds its own subtle system shadow.
- Safe margin already built into the master grid (12.5% left/right) exceeds Apple's minimum, so the mark survives the squircle mask without clipping.
- Master export: 1024×1024 PNG, no alpha channel (App Store Connect requirement), no transparency.

## Adaptive Android Icon

Android composites two separate layers at runtime, each a full 108dp×108dp canvas, of which only the center ~66dp (safe zone, ~61%) is guaranteed visible after masking:

- **Background layer** — [`assets/svg/adaptive-background.svg`](./assets/svg/adaptive-background.svg): solid `#0F766E`, no mark, no detail near edges (Android may crop or apply parallax to this layer).
- **Foreground layer** — [`assets/svg/adaptive-foreground.svg`](./assets/svg/adaptive-foreground.svg): transparent canvas, `#FAFAFA` mark scaled to sit fully inside the 66dp safe zone with margin to spare, since Android launchers apply varying mask shapes (circle, squircle, rounded square, teardrop) per OEM.
- **Monochrome/themed layer** (Android 13+ Material You) — reuses [`assets/svg/monochrome.svg`](./assets/svg/monochrome.svg) with `currentColor`; the OS applies the user's wallpaper-derived tint.

## iOS/Android Notification Icon

- Source: [`assets/svg/notification.svg`](./assets/svg/notification.svg) — solid white silhouette, transparent background, no plate.
- Android status-bar icons must be a pure alpha-masked white shape (the OS ignores any color and renders the shape in the current status-bar tint) — the mark's flat single-mass silhouette satisfies this without modification.
- iOS notification icons inherit the app icon automatically; no separate asset required beyond the primary app icon.

## Favicon

Covered in full in [favicon-guidelines.md](./favicon-guidelines.md).

## Maskable Icon (PWA)

- Source: [`assets/svg/maskable.svg`](./assets/svg/maskable.svg) — full-bleed `#0F766E` square, mark scaled to fit within the W3C maskable-icon safe zone (a centered circle at 80% of the canvas diameter), with additional margin beyond the minimum so aggressive circular masks (e.g. some Android launchers) never clip the mark.
- Declared in the web manifest with `"purpose": "maskable"`, separate from the standard `"purpose": "any"` icon entry.

## PWA Icon

- Standard (non-maskable) manifest icons reuse [`assets/svg/app-icon.svg`](./assets/svg/app-icon.svg) exported at 192×192 and 512×512 PNG.
- Declared with `"purpose": "any"` in `public/manifest.webmanifest`.

## Splash Icon

- Centered mark (not the full plate) on the app's own `--vinha-canvas` background — never a busy illustration, never the plate square repeated as a giant tile.
- Matches the existing splash screen pattern already implemented at [`app/[locale]/(auth)/splash/splash-screen.tsx`](../../../app/[locale]/(auth)/splash/splash-screen.tsx); this brand pack supplies the mark asset only and does not modify that screen's implementation.

## Cross-platform summary

| Variant | File | Canvas | Plate | Mark fill |
|---|---|---|---|---|
| iOS app icon | `app-icon.svg` | Full square | `#0F766E` | `#FAFAFA` |
| Android adaptive background | `adaptive-background.svg` | 108dp square | `#0F766E` | none |
| Android adaptive foreground | `adaptive-foreground.svg` | 108dp square | transparent | `#FAFAFA` |
| Monochrome / themed | `monochrome.svg` | Mark only | none | `currentColor` |
| Notification | `notification.svg` | Mark only | none | `#FFFFFF` |
| Favicon | `favicon.svg` | Rounded-square | `#0F766E` | `#FAFAFA` |
| Maskable (PWA) | `maskable.svg` | Full square | `#0F766E` | `#FAFAFA` (safe-zone scaled) |
| PWA standard | `app-icon.svg` (re-exported) | Full square | `#0F766E` | `#FAFAFA` |
| Splash | `mark.svg` | Mark only | none (sits on `--vinha-canvas`) | `#0F766E` |
