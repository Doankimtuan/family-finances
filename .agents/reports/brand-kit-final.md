# ViNha Woven Path brand-kit implementation

## Chosen concept

The new identity is **Woven Path**: two equal rounded paths interlock around a clear central opening. The mark represents household money held together—two people coordinating with clarity, stability, and a shared way forward. It avoids a literal home, wallet, piggy bank, currency symbol, or lettermark, while retaining a strong silhouette at small sizes.

The concept was developed as a premium 3×3 brand-system board and then reduced into a clean vector system for product use. The generated reference board is `artifacts/branding/CURRENT/assets/brand-board.png`.

## Why it fits Family Finance

Woven Path matches the existing product direction of premium fintech, warm modern surfaces, deep teal as a selective brand anchor, and calm confidence. The mark uses the existing deep-teal/hero palette with a warm stone secondary band in light contexts and off-white/hero-muted geometry on the teal app plate in dark contexts. The central opening gives the identity visual breathing room rather than implying a bank, crypto exchange, accounting tool, or children’s finance product.

## Assets and components

| Asset or component        | Location                                                                                                                                                                              | Role                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Reusable in-app mark      | `shared/patterns/brand-mark.tsx`                                                                                                                                                      | Canonical two-tone `BrandMark` component with `mark`, `soft`, and `plate` variants |
| Decorative auth watermark | `shared/patterns/auth-house-glow.tsx`                                                                                                                                                 | Uses both canonical geometry bands                                                 |
| Primary vector mark       | `artifacts/branding/CURRENT/assets/svg/mark.svg` and `public/mark.svg`                                                                                                                | Full-color mark-only source                                                        |
| App icon                  | `artifacts/branding/CURRENT/assets/svg/app-icon.svg` and `public/app-icon.svg`                                                                                                        | Square teal plate treatment                                                        |
| Favicon                   | `artifacts/branding/CURRENT/assets/svg/favicon.svg` and `public/favicon.svg`                                                                                                          | Simplified small-size source                                                       |
| Monochrome                | `artifacts/branding/CURRENT/assets/svg/monochrome.svg` and `public/monochrome.svg`                                                                                                    | Single-color use                                                                   |
| Maskable                  | `artifacts/branding/CURRENT/assets/svg/maskable.svg` and `public/maskable.svg`                                                                                                        | Adaptive platform safe-area treatment                                              |
| Raster exports            | `public/favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `favicon.ico`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `maskable-512.png`, `monochrome-512.png` | Browser, PWA, Apple touch, adaptive, and monochrome outputs                        |
| Reproducible generator    | `scripts/generate-brand-assets.mjs`                                                                                                                                                   | Regenerates every public/export asset from SVG masters                             |
| Reference and evidence    | `artifacts/branding/CURRENT/assets/brand-board.png`, `brand-validation-sheet.png`                                                                                                     | Brand strategy board and rendered size-check sheet                                 |

## Locations updated

Root metadata in `app/layout.tsx` now references both the favicon and app-icon SVG treatments. `public/manifest.webmanifest` exposes the full-color, maskable, and monochrome PWA icons. Welcome, authentication, splash, system fallback, and auth-glow surfaces inherit the new mark through the shared `BrandMark` source; no old visible logo copy remains in those reachable component references. The shared barrel exports both geometry paths, and the BrandMark unit test now protects the new vector contract.

## Documentation updated

The canonical governance section was added to `.agents/design-system.md`, including concept, usage, minimum-size, light/dark, monochrome, favicon, and header-sizing rules. The canonical asset pack is documented in `artifacts/branding/CURRENT/README.md`, and `public/README.md` now points to the Woven Path SVG masters and permanent generator.

## Validation

| Check                        | Result                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Favicon output               | Confirmed 16×16, 32×32, and 48×48 PNGs plus a 3-size PNG-backed ICO                                                              |
| Small-size visual check      | Passed; the simplified mark remains a coherent linked silhouette at all three requested sizes                                    |
| Monochrome check             | Passed; the central opening and overall mark remain readable in one color                                                        |
| English Welcome light mode   | Passed at 390px; mark remains compact and legible on the warm canvas                                                             |
| English Welcome dark mode    | Passed at 390px; teal plate and hero-muted geometry remain legible without relying on a gradient                                 |
| English Register light/dark  | Loaded successfully in remote Chromium validation                                                                                |
| Authenticated English Home   | Loaded successfully in light and dark mode at 390px; the existing compact Home shell and header were preserved                   |
| Desktop shell                | Existing authenticated Home validation confirmed the centered 440px shell remains intact; no oversized brand hero was introduced |
| i18n                         | Untouched; Vietnamese visual validation was intentionally not run per the brief                                                  |
| `npm run lint`               | Passed                                                                                                                           |
| `npm run typecheck`          | Passed                                                                                                                           |
| `npm run build`              | Passed; all routes compiled successfully                                                                                         |
| Focused tests                | Passed: `brand-mark.test.ts` and `shared-visual-foundation.test.tsx`, 10 tests total                                             |
| Formatting / diff whitespace | Passed after formatting the focused code, docs, and generator files                                                              |

The brand-browser subsystem was unavailable for the interactive browser tool during this run, so the real Chromium checks were executed through the project’s existing remote Playwright setup instead. Temporary validation scripts were removed after use. Existing unrelated worktree changes were left untouched.
