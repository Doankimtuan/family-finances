# ViNha Design System — Canonical Reference

Home is the visual north star. This document turns the approved Home design
into app-wide rules. **Any new UI or redesign must first read this document
and inspect the current Home implementation before introducing new visual
patterns.** Add a new pattern only when an existing one genuinely does not fit
the use case — never introduce page-specific colors, shadows, radii, spacing,
button styles, or cards without a strong reason.

Same product DNA, different composition per screen. Do not copy Home's layout
onto other screens; reuse its system.

## 1. Product visual direction

Premium fintech + warm + modern + calm Gen-Z energy ("Calm Household
Finance"). Deep teal is the brand anchor and is valuable because it is
selective. Neutral warm-stone surfaces carry the content; semantic color is
reserved for financial meaning and attention. See also
`artifacts/design-system-evolution/CURRENT/visual-direction.md`.

## 2. Surface hierarchy (semantic tokens)

Use these Tailwind/`--vinha-*` tokens; never raw hex in feature code.

| Role                | Token(s)                                                                  | Use                                                                 |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Base / canvas       | `bg-canvas`                                                               | Page background; content sits directly on it                        |
| Surface             | `bg-surface` + `border-border-subtle`                                     | Grouped content cards (`Card tone="elevated"`)                      |
| Elevated            | `bg-surface-elevated` + `shadow-(--elevation-1..2)`                       | Popovers, tooltips, stronger separation                             |
| Hero / accent       | `bg-linear-to-b from-hero to-hero-deep text-hero-fg` (`Card tone="hero"`) | The single most important fact on a screen — **max one per screen** |
| Attention           | `Card tone="warning"` (`bg-warning/10 border-warning/30`)                 | Review-required / pending — not an error                            |
| Error / destructive | danger tokens + `StatusAlert` danger                                      | Actual failures and destructive actions only                        |
| Interactive         | `bg-surface-hover` on hover/press                                         | Hover/pressed states, chips, quiet controls                         |

Hero tokens (`hero`, `hero-deep`, `hero-fg`, `hero-muted`) are theme-aware:
deep teal in light mode, richer elevated teal in dark mode.

## 3. Card philosophy

> Cards group one coherent concept or meaningful interaction — never wrap
> every piece of content.

- One "story" per card: Home's Dòng tiền card holds comparison → trend →
  breakdown because they answer one question.
- Prefer `Section` (plain, surface, emphasized) for non-card grouping;
  prefer rows and dividers inside cards over nested cards.
- Shared tones in `shared/patterns/card.tsx`: `default`, `interactive`,
  `metric`, `soft`, `highlighted`, `warning`, `elevated`, `hero`.
  Feature code must not re-declare card CSS; pick a tone and override only
  padding/layout via `className`.
- Card radius is always `--radius-card` (12px). Never invent radii.

## 4. Typography

| Role                   | Implementation                                                         |
| ---------------------- | ---------------------------------------------------------------------- |
| Screen title / context | `Heading` level 1, compact (Home: greeting, `text-base font-semibold`) |
| Section title          | `Heading` level 3 `text-sm font-semibold text-text-primary`            |
| Subsection / label     | `Text size="sm" tone="secondary"` (`font-medium`)                      |
| Hero financial value   | `Balance size="hero"` (36px, semibold, tabular, `tracking-tight`)      |
| Primary value          | `Amount` / `Balance` (`text-lg`–`text-xl`)                             |
| Signed movement        | `FinancialDeltaValue` (`text-lg` semibold tabular + tone)              |
| Body / secondary       | `Text` base/sm; metadata xs `tone="muted"`                             |

Financial numbers are always: tabular numerals, `tracking-tight`, formatted
via `shared/i18n/formatters`, privacy-masked through `FinancialValue` /
`Balance` / `Amount`. Never style currency ad hoc per screen.

## 5. Financial data semantics

- **Current-state values** (balances, portfolio value, remaining principal):
  neutral `text-text-primary`. Never green/red just for being positive.
  Real ledger balance → `Balance`; intentions/magnitudes → `Amount`.
- **Positive movement** (income, gain, positive net flow):
  `FinancialDeltaValue` / success tone + directional icon
  (`FinancialDeltaBadge`).
- **Negative movement** (expense, loss, negative delta): danger tone +
  directional icon.
- **Attention / review required** (uncategorized, pending inbox, maturity):
  warning treatment (`Card tone="warning"`, warning pill). Do not overload
  expense red for warnings.
- **Accessibility**: color is never the only cue — pair tone with an icon,
  arrow, label, or badge text.
- Do not fabricate metrics; progress/deltas must come from real data.

## 6. Spacing

Use the `--space-*` scale (4/8/12/16/24/32) with intent:

- **Tight (4–8)**: icon↔label, label↔value.
- **Normal (12–16)**: content inside a component/card padding (`p-3`–`p-4`).
- **Group (12)**: tightly related surfaces (hero → net strip).
- **Section (20–24)**: between major screen modules.
- **Screen (16–20)**: page-level top/bottom rhythm (`Page` gutters).

Avoid one-off values; the page should read as deliberate vertical rhythm like
Home.

## 7. Radius

`--radius-control` (10px) for controls/pills-squared, `--radius-card` (12px)
for cards, `--radius-overlay` (16px) for sheets/modals, `rounded-full` for
pills/badges/segmented tracks. No other radii.

## 8. Elevation

| Level           | Token                 | Use                                      |
| --------------- | --------------------- | ---------------------------------------- |
| None            | `shadow-none`         | Flat sections, plain rows                |
| Subtle          | `--elevation-1`       | Standard cards (`elevated` tone), strips |
| Raised          | `--elevation-2`       | Hero card, floating overlays             |
| Floating/sticky | blur + border + scrim | `BottomActionBar`, sticky headers        |

Light mode: shadow + border + tonal difference together. Dark mode: rely on
surface lightness steps (`canvas → surface → surface-elevated`) + borders +
restrained shadows — not bigger black shadows.

## 9. Color rules

- Brand teal (`accent`/`primary`/hero tokens) for: primary actions, selected
  states, the hero surface, navigation emphasis. Not for every icon/divider.
- Semantic tokens only: `success`, `danger`, `warning`, `info`, and the
  money/domain aliases (`income`, `expense`, `savings`, `debt`, …).
- Text: `text-primary`/`secondary`/`muted`; on hero use `text-hero-fg` /
  `text-hero-muted`.
- Light mode must not become an all-white blur: white cards + hairline
  borders + elevation on the warm canvas, anchored by the teal hero.
- Dark mode is intentional: charcoal (never pure black), visible borders,
  AA secondary text, richer teal accent surfaces.

## 10. Action hierarchy

- **Primary** (`Button variant="primary"`): the single most important action
  in context (Add Transaction, Save, Confirm). One per screen state.
- **Secondary** (`variant="secondary"`): important but not dominant.
- **Tertiary / ghost** (`variant="tertiary"` / text links): low-emphasis
  navigation.
- **Destructive**: dedicated destructive semantics; never a standard primary.
- Sticky/persistent actions use `BottomActionBar` (safe-area aware, blurred
  surface, never overlaps bottom navigation). Do not force sticky actions on
  every screen.

## 11. Navigation affordances

- Inline text navigation → trailing chevron (`ACTION_ICONS.forward`).
- Row/list navigation → consistent trailing chevron position, right-aligned.
- Back navigation → `TopAppBar` back pattern (`ArrowLeft01Icon`).
- Interactive cards → `Card tone="interactive"` lift/press feedback; add an
  arrow only when the whole card navigates.

## 12. Lists and rows

Row language (see Home spending rows, `TransactionRow`):

`[leading IconContainer] [primary label + secondary/progress] [value column]`

- Values right-aligned in a `--financial-number-column-width` column,
  tabular; percentage/metadata under the amount (`xs`, muted).
- Separate rows with `divide-y divide-divider`; padding `py-3`, first/last
  flush.
- Hover/pressed states on interactive rows; disabled rows use
  `--opacity-disabled`.
- Category identity via `IconContainer` tone + `categoryVisualFor`; category
  color is a controlled accent, not a row background.

## 13. Progress

Use shared `Progress`: thin track (`h-1`–`h-1.5`), semantic or category tone
fill, always backed by a real ratio; accessible label even when hidden.
Never decorative.

## 14. Attention / insight pattern

- Quiet info → plain row/`StatusAlert` info.
- Recommendation/insight → inline rich text with semantic icon+amount
  (Home spending insight).
- Review required → `Card tone="warning"` + icon + explanation + one action
  (Home Inbox pending, uncategorized amber pill
  `border-warning/30 bg-warning/10 text-warning`).
- Warning vs error stays distinct; normal pending items never look like
  emergencies.

## 15. Empty states

Compact, friendly, actionable: icon + short title + one sentence + optional
CTA (`EmptyState`, Home day-zero trio). No large illustrations by default.

## 16. Forms (direction for future migrations)

Grouped field cards on canvas, shared form primitives own
labels/validation/states; money via `MoneyInput`/`AmountField`, numbers via
`NumberField`, select/date/time via HeroUI controls; sticky submit through
`BottomActionBar` with one primary + one escape; destructive action placed
away from the primary. Forms share tokens/spacing — never a separate admin
look. Do not change financial behavior when restyling.

## 17. Motion

**Philosophy**: motion exists only where it improves feedback, continuity, or
comprehension. Subtle, calm, responsive, premium, fast. Rule of thumb: if
removing the motion does not reduce clarity, feedback, or continuity, do not
add it.

Allowed shared patterns (tokens from `shared/motion` — never inline
durations/easings/distances):

- **Press feedback** — `--press-scale` (0.98) on buttons/cards/rows via the
  shared control styles; already built into `Button`/`Card interactive`.
- **Fade / small translate** — content entering after load or state change:
  `MotionReveal`, `HomePeriodData` crossfade. Displacement ≤ `distance.sm`.
- **Crossfade** — privacy mask ↔ value (`FinancialValue`), icon state swaps
  (privacy toggle). Opacity only.
- **Selection transition** — segmented control selected thumb slides via
  `layoutId` (Home period control is the reference); chips/tabs use the CSS
  color transition.
- **Progress transition** — shared `Progress` animates `scaleX` from previous
  ratio; never animate a value's digits.
- **Sheet/dialog/overlay motion** — owned by HeroUI; never stack Motion on
  top of it.

Durations: `instant` (press) → `fast` (most UI) → `normal` (rare). Easing:
`standard` for entrances/moves. Reduced motion (`useMotionPolicy`) degrades
everything to instant state changes or opacity-only; low-end devices disable
non-essential motion. Never add: loops, bounce, staggered card cascades,
digit-counting financial numbers, entrance delays that block interaction.

## 18. Charts

Recharts + chart tokens (`chart-positive/negative/grid`): solid = income,
dashed = expense; minimal grid; legend inline with the section heading;
tooltip on elevated surface. States must distinguish loaded / zero / sparse /
no-data; never fabricate or interpolate activity.

## 19. Headers and screen composition

- Headers are space-efficient: compact title row, context+title, or
  detail (back + title + action). Large hero headers only when justified —
  above-the-fold space belongs to product information.
- Screen roles: **Dashboard** (hero + summary + grouped modules — Home),
  **List** (compact header + filters + grouped rows), **Detail** (header +
  status card + info sections + actions), **Form** (grouped fields +
  persistent action), **Management** (summary + list + create action),
  **Empty/new-user** (context + empty state + first action).

## 20. Responsive policy

Desktop stays constrained to the centered ~440px mobile column
(`AppViewport`). Never introduce multi-column desktop dashboards as the
default. Verify substantial UI at 390/440/768/1280, light + dark.

## 21. Iconography

Hugeicons Free Stroke Rounded via `AppIcon`; semantic registries
(navigation/finance/action/utility/category) for stable concepts; persist
`iconKey` only. Sizes `xs/sm/md/lg`, consistent stroke; `IconContainer`
(tones) for leading identity icons. No second icon family, no emoji, no SVG
in data.

## 22. Skeleton loading

Skeletons must mirror the loaded screen, not act as generic gray rectangles:

- Same component hierarchy, card/surface boundaries, radii, spacing, and
  major vertical rhythm as the loaded state; typography footprints matched by
  sized bones (e.g. hero balance ≈ `h-9`, section titles `h-4`).
- Compose skeletons from the real layout structure — see
  `home-dashboard-skeleton.tsx`, shared by Home route loading and the
  period-switch state. When a screen's layout changes, its skeleton changes
  in the same commit.
- Placeholders mimic layout only. Never fake values, colors (no teal hero
  bones), or brand treatment; do not guess pending/attention states.
- Animation: subtle opacity `animate-pulse` from the shared `Skeleton`
  primitive, disabled under `prefers-reduced-motion`. No high-contrast
  shimmer, no full-screen sweeping gradients; dark-mode bones use
  `--color-skeleton` so they never flash bright.
- Loading exists only while genuinely loading — no fake timers, no
  artificial delays. Resolve with the existing fade (e.g.
  `HomePeriodData`) to minimize visible recomposition.

## 23. Persistent quick actions

Two distinct patterns — choose by role, not by taste:

- **Repeated high-frequency actions** → `FloatingAction`: a compact pill
  (rounded-full, primary variant, `min-h-12`, elevation-2) that floats at the
  trailing edge above the bottom navigation at any scroll position and docks
  into the flow at the content end. The zone is pointer-transparent; only the
  control intercepts touches. Never gray/disabled-looking, never pulsing.
- **Form/confirm submits** → `BottomActionBar`: full-width sticky footer with
  one primary + one escape. Do not use it for navigation-grade quick actions,
  and do not force sticky actions onto screens that don't need them.

**Add Transaction is the canonical global quick action**: always exposed as
the `FloatingAction` pill on Home (`home-capture-action`), reachable without
scrolling, above the nav, safe-area-safe (the shell owns insets), and visible
in both themes. It stays available during period switching (it does not
depend on dashboard data) and is disabled only when offline. Do not move it
back into page flow or duplicate it per section.

## Do / Don't

**Do**: consume `Card` tones, `Section`, `Balance`/`Amount`/
`FinancialDelta*`, `Progress`, `StatusBadge`, `BottomActionBar`,
`FloatingAction`, `SectionHeader`, the shared `Skeleton`; map meaning to the
surface table above; keep one hero and one primary action per screen.

**Don't**: raw hex/arbitrary values in features; re-declared card/button
CSS; nested card soup; teal on every accent; green/red for static balances;
warning color for harmless info; new radii/shadows/spacing scales; separate
visual language for forms or admin-ish screens.
