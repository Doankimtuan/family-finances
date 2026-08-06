---
document: Light Theme Preview
theme_system: v1.0.0
status: OFFICIAL_THEME_SYSTEM_SOURCE_OF_TRUTH
run_id: run_theme_system_20260802T140000Z
created_at: 2026-08-02T07:00:00Z
frozen: true
---

# Light Theme Preview

**Feel:** bright, soft, warm stone neutrals, deep teal accent — Calm Ledger.

## Palette snapshot

```
Canvas outer  #F5F5F4   Canvas  #FAFAF9   Surface  #FFFFFF
Text          #18181B   Secondary #52525B  Muted   #71717A
Accent        #0F766E   On-accent #FAFAFA
Success       #047857   Warning  #B45309   Danger  #BE123C
```

## Surfaces

- Outer desktop wash: soft teal + stone atmosphere gradients.
- Viewport: warm off-white (`#FAFAF9`), not pure white.
- Cards: white surface + hairline `border-subtle` + elevation-1.

## Controls

- Primary CTA: teal fill, off-white label, subtle elevation.
- Secondary / fields: white surface, stone borders, muted placeholders.
- Focus: 2px teal ring (`focus-ring`).

## Charts (when present)

- Real series: accent teal
- Intention series: stone muted
- Positive/negative: emerald / rose (never color-alone for overspend)

## Accessibility notes

- Body text on canvas ≈ zinc-900 on stone-50 — WCAG AA.
- Accent `#0F766E` on white meets AA for large/UI text; primary buttons use accent-fg on accent.
- Status colors always paired with icon or text (Design Foundation).
