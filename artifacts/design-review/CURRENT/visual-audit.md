---
document: Visual Audit
design_review: v1.0.0
status: DESIGN_REVIEW_V1
run_id: run_design_review_20260802T061600Z
created_at: 2026-08-02T06:17:22Z
board: Design Director
frozen: true
design_foundation_sot: artifacts/design-foundation/CURRENT
design_system_sot: artifacts/design-system/CURRENT
constitution_sot: artifacts/developer-constitution/CURRENT
---

# Visual Audit — Sprint 1 Surfaces

## Screens audited

| Screen | Path | Role |
|--------|------|------|
| Splash | `(auth)/splash` | Brand entry |
| Welcome | `(auth)/welcome` | Value + CTAs |
| Login | `(auth)/login` | Auth |
| Register | `(auth)/register` | Auth |
| Forgot password | `(auth)/forgot-password` | Auth |
| Auth confirm | `(auth)/auth/confirm` | Session bridge |
| Home / Money / Plan / Inbox / Together / Health | product stubs via `ProductStub` | IA shells |

Chrome: `AppViewport` 440px · `ChromeShell` · `TopAppBar` · `BottomNavigation` (5 tabs).

## Findings by criterion

### Hierarchy
- Auth titles often override Heading level-1 with `text-2xl`, flattening scale.
- Welcome reuses EmptyState for brand moment → feels like an empty product, not a welcome.
- Product stubs: lead + empty block; hierarchy OK but sparse (acceptable for stubs).

### Spacing / rhythm
- Auth shell uses `--space-5` gap when centered; form stacks use `--space-4` inconsistently vs OAuth `--space-3`.
- Product content padding `--space-4` is correct; empty py `--space-10` can feel abandoned without icon.

### Typography
- Geist tokens present; money tabular ready in Text.
- Bottom nav labels at `10px` — below comfortable reading / scanning speed.
- Auth H1 size inconsistent with Heading token scale.

### Alignment / balance
- Auth CTAs full-width inside shell — good thumb reach.
- Welcome CTA max-width `16rem` centers well; title/description max-width tight.

### Touch targets
- Buttons `min-h-11` — pass.
- IconButton lacks default min 44px unless callers add it.
- Nav tabs `min-h-11` — pass.

### Component density
- Not enterprise-dashboard; stubs correctly light.
- Dual chrome (top + bottom) both use blur + elevation-1 → slightly heavy for calm finance.

### Primary action visibility
- Login: OAuth secondary then email primary — OK but secondary buttons visually equal to each other; primary submit clear after form.
- Welcome: primary/secondary order correct.

### Dark mode / a11y
- Tokens defined for dark; focus-visible global rule present.
- Input wrapper under-tokenized → risk of HeroUI default contrast drift.
- Reduced-motion global gate present.

### Mobile / one-handed
- Bottom nav thumb zone good; 5-tab IA preserved.
- No sidebar (correct).
