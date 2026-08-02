---
document: Design Rationale
branding: v1.0.0
status: OFFICIAL_BRAND_SOURCE_OF_TRUTH
run_id: run_branding_20260802T133600Z
created_at: 2026-08-02T14:25:00Z
frozen: true
---

# Design Rationale — Cradle & Seed

## The three-second test

Shown the app icon alone, with no wordmark and no app-store listing, a first-time viewer should form the impression "this is a modern household finance app I can trust" — not "this is a bank," not "this is a trading app," not "this is a generic productivity tool." Cradle & Seed passes this because:

1. **The silhouette is warm and protective.** The cradle's sweeping, continuous curves create a protective "vessel" or "pocket" (representing the wallet/ví and the home/nhà), matching the calm/soft register the brief asks for.
2. **The silhouette is grounded yet airy.** The flat-bottomed outer curve of the cradle signals stability and trust, while the open top and floating seed provide breathing room and hope.
3. **The silhouette is growth-forward without being aggressive.** The seed/coin represents potential, savings, and long-term planning, suspended safely inside the cradle. It avoids stock-chart arrows or piggy banks, keeping the tone premium and editorial.

## Why this survives five years

The mark contains zero elements that depend on a current design trend:

- No gradient mesh, no glass/blur effect, no 3D bevel — all popular in 2024–2026 app-icon trends and all liable to look dated as soon as the next OS visual language ships.
- No skeuomorphic material (leather, metal, paper) — those cycle in and out roughly every 5–7 years.
- Flat, single-fill geometric shapes are the one app-icon style that has remained legible and "current" across every major OS redesign of the last decade (iOS 7 flat redesign through iOS 18 tinted/glass modes, Material Design through Material You) — because the *shape* carries the identity, not the *rendering treatment* applied to it.
- The mark is deliberately simple enough to be re-rendered under any future OS treatment (glass, tinted, monochrome, dynamic color) without redesign — see the monochrome and themed-icon variants in [app-icon-guidelines.md](./app-icon-guidelines.md), which already prove this out today.

## Why not a more literal home/family symbol

A literal roofline house, a family-of-figures glyph, or a heart shape were all considered in the symbol-exploration phase (see [icon-exploration.md](./icon-exploration.md)) and rejected because each directly violates an explicit brief constraint ("avoid houses copied literally," "avoid finance clichés") and each is heavily used across existing budgeting apps (a literal house-roof glyph in particular is one of the most common finance-app icons in the App Store today, undermining "uniqueness"). Cradle & Seed keeps the *emotional* territory (home, shelter, togetherness, growth) while inventing its own geometric vocabulary.

## Why the color decision was "extend," not "invent"

The product already has a live, shipped, tested color system (Calm Ledger teal on stone/zinc), reviewed and scored 7.8/10 in the most recent [Design Review](../../design-review/CURRENT/design-score.md). Inventing a separate "brand" palette that diverges from the in-product palette would create two competing visual identities for the same app — the single most common failure mode in consumer app branding (a marketing site/app icon that doesn't look like the product it advertises). This pack instead treats the brand as the *outermost expression* of the same system already in `styles/globals.css`, which is also why the brand is easy to keep in sync going forward: one accent token, one place it's defined.

## Open risk accepted

The mark's negative space gaps are 2px and 3px wide at the 32px master scale. At extremely small sizes (e.g., 16px favicon), these gaps compress but remain mathematically distinct and render cleanly on high-DPI displays. This is an accepted tradeoff, not an oversight — see [icon-decision.md § Validation at target sizes](./icon-decision.md): legibility at the smallest size always outranks a story detail.
