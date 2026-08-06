---
document: Component: Card
design_system: v1.0.0
status: OFFICIAL_DESIGN_SYSTEM_SOURCE_OF_TRUTH
run_id: run_design_system_20260801T190000Z
created_at: 2026-08-01T16:12:23Z
board: Design System Generator
design_foundation: v1.1.0
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
tier: containers
component: Card
---
# Card

**Tier:** containers  
**Path:** `shared/patterns`  
**HeroUI base:** Card  
**Foundation:** Design Foundation v1.1.0 · AppViewport 440px · deep teal · Geist · Phosphor

## Purpose

Actionable or grouped unit

## When to use

Use when the screen needs this role within the mobile-native shell.

## When NOT to use

Do not wrap every Home metric; prefer KPIBlock zones

## Variants

default; size density md

## States

default, hover, active/pressed, focus-visible, disabled, loading (if async)

## Accessibility

- Keyboard reachable; visible focus (`color-focus-ring`)
- Touch target ≥44×44px for interactive controls
- Do not rely on color alone for status
- Labels / `aria-*` per React Aria / HeroUI defaults
- REQ-019 paths when used in capture, Inbox, or Month Ritual

## Interaction Rules

- Press feedback 150ms (`anim-press`)
- Destructive money flows require preview + confirm (Dialog)
- Offline: disable mutating actions; fail closed
- Overlays (if any) confined to AppViewport

## Composition Rules

- Compose only downward: primitives → foundation → patterns
- No domain writes in `shared/patterns`
- Screens import patterns, not raw HeroUI (except via shared/ui wrappers)

## Content Rules

- Calm adult voice; glossary terms (Jar, Inbox, ReviewItem, Month Ritual, Partner)
- One primary CTA per region


## Spacing Rules

- Use spacing tokens (`space-2`–`space-4` internal; `space-4` page gutter)
- Do not stretch to desktop browser width

## Token Usage

- Color: canvas/surface/text/accent (+ semantic as needed)
- Type: font-sans; money → tabular-nums
- Radius: radius-md controls; radius-lg cards
- Motion: duration-fast/normal

## Examples

```tsx
// Prop sketch — not production code
<Card /* variant="…" */ />
```

## Anti-patterns

- Second UI kit or Lucide icons
- Sidebar / multi-column desktop redesign
- Full-bleed desktop dialogs
- Jar amounts labeled as unlabeled Balance
- Silent money failure toasts without recovery
