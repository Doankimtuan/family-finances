---
document: Logo Concepts
branding: v1.0.0
status: OFFICIAL_BRAND_SOURCE_OF_TRUTH
run_id: run_branding_20260802T133600Z
created_at: 2026-08-02T06:40:00Z
frozen: true
---

# Logo Concepts

ViNha's identity is a **mark + wordmark system**, never a lettermark icon. The brief explicitly rejects letters/text inside the icon, so the app icon, favicon, and all platform icons carry the Cradle & Seed mark alone (see [icon-decision.md](./icon-decision.md)); the wordmark exists only in contexts with room to set type (splash screen, marketing surfaces, email headers).

## System

| Lockup | Where used | Composition |
|---|---|---|
| Mark only | App icon, favicon, notification, adaptive icon, in-app "about" glyph | [`assets/svg/mark.svg`](./assets/svg/mark.svg), no plate |
| Mark + wordmark, horizontal | Splash screen, marketing headers, wide surfaces | Mark left, 12px (at 1x mark-height 32px scale) gap, "ViNha" set in Geist |
| Wordmark only | Narrow inline contexts (email subject strip, legal footer) | "ViNha" in Geist, sentence case, never all-caps, never letter-spaced |

## Wordmark rules

- Typeface: **Geist** (already the product typeface — see [`Design-Tokens.md`](../../design-foundation/CURRENT/Design-Tokens.md) `--font-sans`). No secondary display serif, no script, no condensed "fintech" grotesk.
- Casing: `ViNha` exactly — capital V, capital N, no space, no diacritics in the wordmark even though the product name derives from Vietnamese "Ví Nhà" (wallet/home). This matches how the product is already referenced across [Product-Definition](../../product-definition/CURRENT/Executive-Summary.md).
- Weight: Semibold (600) for lockups at brand scale; never bold/black (too shouty for the calm-adult voice) and never regular (too quiet to be a hero-level signal).
- Never stretch, skew, outline, drop-shadow, or apply a gradient fill to the wordmark.
- Minimum clear space around any lockup: the height of the mark, on all sides.

## Why no lettermark icon

A "V" or "N" glyph icon was considered and rejected during exploration (see [icon-exploration.md](./icon-exploration.md)): lettermarks read as generic SaaS branding at small sizes, don't survive a favicon's 16px canvas without heavy simplification, and directly violate the brief's "avoid letters" constraint. The Cradle & Seed mark carries 100% of the icon's brand recognition; the wordmark is only ever a secondary confirmation, never required for recognition.

## Color of the wordmark

- On light surfaces: `--color-text-primary` (near-black), not accent teal — the teal is reserved for the mark and for CTA affordances, keeping one hue doing one job (see [color-system.md](./color-system.md)).
- On the brand plate (teal background, e.g. splash): off-white (`--vinha-accent-fg` equivalent), matching the mark's fill in that context.
