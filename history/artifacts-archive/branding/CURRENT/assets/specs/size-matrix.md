# Size Matrix

Quick-reference export matrix. Full rationale in [export-specifications.md](../../export-specifications.md).

| Platform | Asset | Size(s) | Source |
|---|---|---|---|
| Web | Favicon (SVG) | vector | `assets/svg/favicon.svg` |
| Web | Favicon (PNG) | 16, 32 | `assets/svg/favicon.svg` |
| Web | Favicon (ICO) | 16/32/48 bundle | `assets/svg/favicon.svg` |
| Web / iOS | Apple touch icon | 180 | `assets/svg/app-icon.svg` |
| PWA | Standard manifest icon | 192, 512 | `assets/svg/app-icon.svg` |
| PWA | Maskable manifest icon | 512 | `assets/svg/maskable.svg` |
| iOS | App Store master | 1024 | `assets/svg/app-icon.svg` |
| Android | Adaptive background | 108dp (432px @4x) | `assets/svg/adaptive-background.svg` |
| Android | Adaptive foreground | 108dp (432px @4x) | `assets/svg/adaptive-foreground.svg` |
| Android | Monochrome/themed | 108dp (432px @4x) | `assets/svg/monochrome.svg` |
| Android | Notification | 24dp (96px @4x) | `assets/svg/notification.svg` |
| Any | Splash mark | vector, sized in layout | `assets/svg/mark.svg` |

## Safe-zone reference

See [safe-zones.svg](./safe-zones.svg) for a visual overlay of the mark against the maskable (80% diameter) and Android adaptive (66/108 ≈ 61% diameter) safe-zone circles used to derive the scale factors in each asset.
