---
document: Dark Theme Preview
theme_system: v1.0.0
status: OFFICIAL_THEME_SYSTEM_SOURCE_OF_TRUTH
run_id: run_theme_system_20260802T140000Z
created_at: 2026-08-02T07:00:00Z
frozen: true
---

# Dark Theme Preview

**Feel:** deep charcoal, soft lifted surfaces, tinted elevation — not OLED black, not neon fintech.

## Palette snapshot

```
Canvas outer  #111113   Canvas  #141416   Surface  #1C1C1F
Elevated      #27272B   Hover   #232326
Text          #F4F4F5   Secondary #A1A1AA  Muted   #71717A
Accent        #2DD4BF   On-accent #111113
Success       #34D399   Warning  #FBBF24   Danger  #FB7185
```

## Surfaces

- Hierarchy: canvas → surface → elevated (each step lifts ~1 stop).
- Atmosphere: soft teal wash at top, charcoal vignette at bottom.
- Elevation shadows tinted black at 28–50% opacity (not harsh).

## Controls

- Primary CTA: teal-400 fill on charcoal fg — high contrast without glare.
- Fields: surface fill, zinc borders, muted placeholders.
- Inverse (Apple OAuth chrome): paper-on-charcoal via `inverse` tokens.

## Eye comfort

- Avoids `#000` / `#FFF` extremes.
- Accent desaturated relative to marketing neon teals.
- Reduced-motion: theme switch skips the 200ms fade.

## Accessibility notes

- Primary text `#F4F4F5` on `#141416` — AA+.
- Teal accent on dark surfaces checked for large text / UI chrome.
- Warning amber on dark needs accompanying text (never color-alone).
