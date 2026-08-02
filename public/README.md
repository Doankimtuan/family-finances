# Rewrite scaffold

Architecture v2.0.0 skeleton only. No legacy implementation copied.
Retired run: run_legacy_retirement_20260801T160000Z

Static assets. Legacy favicons archived under archive/legacy-v1/public.

## Brand assets

`favicon.svg`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico`, `apple-touch-icon.png`,
`icon-192.png`, `icon-512.png`, `maskable-512.png`, and `manifest.webmanifest` are generated from
the Cradle & Seed brand pack at `artifacts/branding/CURRENT/`. Do not hand-edit these files — change
the SVG masters under `artifacts/branding/CURRENT/assets/svg/` and re-run
`node scripts/generate-brand-assets.mjs`.
