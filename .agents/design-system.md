# Family Finance Design System — Canonical Reference

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

## 23. Entry, Authentication & Onboarding

The pre-product journey (`/` → login/register → onboarding → home) is one
product, not a set of standalone pages. Rules below govern Welcome, Login,
Register, Forgot Password, and the onboarding wizard. See
`.agents/auth-onboarding-ux.md` for the current screen flow and data notes.

### Journey structure

- The locale root (`/{locale}`) **is** the Welcome screen. There is no separate
  pass-through landing; `/welcome` renders the same component and stays valid
  as the splash/deep-link target. Never re-introduce an intermediate
  "Open app" screen between root and the auth actions.
- Welcome answers "what is this and why care" in seconds; Login/Register
  answer access; onboarding collects only what Home needs. Each screen moves
  the user forward with one obvious primary action.

### Welcome composition

- Value-first: headline states the product promise ("See where your family's
  money goes"), not "Welcome to <brand>". Brand identity lives in the compact
  `BrandMark` plate + wordmark row, not a hero logo moment.
- Visual anchor quotes Home: a `Card tone="hero"` preview (period label +
  illustrative balance + net pill) with an elevated spending-rows card peeking
  symmetrically behind it. The preview is decorative (`aria-hidden`), badged
  "Preview", and uses static illustration values — never real/fabricated user
  data or charts.
- CTA hierarchy is fixed: **Create account is primary, Log in is secondary**.
  Never give both equal weight on an acquisition screen.
- Up to three value rows (`IconContainer` + one short label each); no feature
  carousel, no marketing slides.
- Locale switcher (and only quiet foundation controls) may sit top-right.

### Auth screen family (Login / Register / Forgot Password)

- Siblings share `AuthScreenHeader` (back link → brand mark → h1 title +
  subtitle) and `AuthScreenShell align="start"`: top-anchored, left-aligned,
  compact — the same reading direction as Home. No centered marketing
  headers, no large unused top space, no card-in-page framing (content sits
  directly on canvas inside the single `max-w-[22rem]` column).
- Every auth screen offers a way back: header back link to Welcome (or to
  Login for Forgot Password), plus the existing footer cross-links.
- OAuth-first order (Google, Apple, `DividerWithText`, email form) is the
  shared structure; both social buttons stay `SocialButton`s with provider
  chrome.
- One primary action per screen state. Submit buttons keep their dimensions
  while pending (label swap to the `submitting` key); disable all actions
  while any submission is in flight; never replace the screen with a spinner.
- Field-level validation errors sit under their field via shared form
  primitives; server/action errors surface through the `StatusAlert` host with
  human, localized copy from `auth.<screen>.errors.*`. Password fields are
  `AuthTextField` with `revealable` + autocomplete attributes; Register adds a
  muted one-line requirement hint (`passwordHint`), not a permanent rule list.
- Register keeps only auth-critical fields (email, password, confirm, terms);
  profile/financial setup belongs to onboarding or later.

### Onboarding

- Two steps, one decision each: (1) household name — with a quiet
  `StatusAlert` info note that the user can start alone and invite later;
  (2) cash account name + starter Jar preset. No zero-input screens; no
  tutorial slides; invitation is never a blocking step.
- Progress is the shared thin `Progress` bar + "Step N of 2" label at the
  top — no large wizard chrome. Back is a tertiary text button (an escape,
  not a co-equal action); Continue/Finish is the single full-width primary.
- Single-choice selections use `ChoiceTileGroup` + `ChoiceTile role="radio"`
  with `IconContainer` leading icons and a group hint that reflects the
  current selection — never native radio inputs.
- Step transitions use `MotionStep` (direction-aware) from `shared/motion`;
  nothing else animates.
- Completion redirects to Home from the server action (no success ceremony).
  The finish → Home transition must stay visually continuous: same canvas,
  hero card, and surfaces. Day-zero Home shows real empty states — never seed
  fake data to make it look populated.

### Theme & responsive

- Light: warm canvas + white inputs with visible borders; primary teal CTA
  obvious. Dark: charcoal surfaces with visible input borders, AA text, and a
  clearly actionable primary — check every field state in both themes.
- All widths keep the centered mobile column (`AppViewport`); desktop never
  gets a separate wide auth layout.

## 24. Persistent quick actions

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

## 25. Financial Hub / Money screens

Money (`/money`) is the financial **inventory and management hub**. Home answers
"how are we doing"; Money answers "where is our money and what needs managing".
Same visual DNA as Home, different composition — never copy Home's hero, cash
flow chart, category analysis, Inbox, or Plan blocks onto Money.

### Composition (top → bottom)

1. Compact `TopAppBar` primary header (title + account count meta).
2. **Position hero group**: `Card tone="hero"` with the accessible-money total
   (sum of active liquid account balances only), a meta line (active account
   count, card debt when > 0), and the "View transactions" entry as a hero-fg
   link; attached (gap-3) **composition strip** — elevated card with a segmented
   allocation bar and a 2-column legend answering "where money sits". The strip
   is Money's analytics ceiling: no charts on the hub.
3. **Accounts section**: grouped account scan (existing scan list, initial rows
   capped, show-all toggle) plus credit cards with their utilization/due/attention
   treatment. Accounts stay the highest-priority drill-in.
4. **Module groups** — two dense `Card tone="elevated"` cards with divided rows:
   "Growing money" (Savings, Investments) and "Borrowed & owed" (Loans, Debts).
5. `FloatingAction` Add Transaction pill — the canonical global quick action,
   identical to Home's pill. Never duplicate it inside page flow.

### Module rows

- Anatomy: `IconContainer` + label + (attention pill **or** one quiet meta
  signal) + right-aligned tabular value + trailing chevron. Pick 1–2 supporting
  signals maximum; never icon+amount+badge+description+CTU stacks.
- Values are current-state magnitudes (savings principal, remaining loan
  principal, borrowed remaining) in neutral `text-text-primary`. Debt amounts
  are **never** auto-red. Investments show a holdings count, not a total —
  valuation totals and their coverage semantics stay on the Investments screens.
- Row states: `value` / `empty` ("None yet", still navigable) /
  `unavailable` (domain read failed — never render a fake zero).
- Attention: `warning` pill = review/due-soon/matured-savings;
  `attention` (danger) pill = overdue. Text always accompanies color.

### Aggregation integrity

No net-worth or "total money" invention on the hub. Each module row shows only
its own domain's existing aggregate (built by the domain's view model), loaded
through cheap reads (`listSavings`, `listDebts`, light `listLoanSummaries`,
holdings head-count). Heavy reads (full investment portfolio, per-loan
aggregates) must not run just to decorate hub rows.

### Empty & partial states

Compact inline empties per module row; a brand-new user still gets the full hub
skeleton (hero shows the account total, modules show "None yet"). No large
illustrations on the hub; the create action for each domain lives on its
destination screen (except Add Account, which stays in the accounts section
header).

### Density & motion

Money may run denser than Home: module rows `min-h-14`, tight legends, divided
lists instead of one-card-per-module. Motion budget: `MotionReveal` on the hero
group only; rows use shared hover/press feedback; no entrance cascades.

When redesigning Money child screens (savings/investments/loans/debts lists),
reuse this row language and attention semantics; see `.agents/money-ux.md` for
the hub's information architecture.

## 26. Account Management Flows

Accounts are the reference "Money resource flow" (list → create → detail →
edit → archive). Savings/loans/debts child screens should reuse these rules.

### List (owned by the Money hub)

The accounts scan lives on the Money hub (`/money/accounts` is a redirect);
never rebuild a standalone accounts index. Rows are the shared `AccountCard`
(identity icon + name/type + right tabular balance + compact ownership), with
credit cards structurally separate and initial rows capped behind a show-all
toggle. One create entry (section header action) opens the create sheet.

### Detail screen

- Identity lives in the `TopAppBar` detail header (back + account name + type
  subtitle + management action) — never duplicated inside the hero.
- The balance hero is `FinancialAccountHero`: `Card tone="hero"` with an
  on-hero icon chip (`border-white/25 bg-white/10`), the balance caption, the
  `Balance` hero value, and one quiet context row (ownership via
  `FinancialOwnershipBadge onHero`, zero-balance health note) under a
  `border-white/15` divider.
- One contextual primary action (`QuickAction` "Add transaction") directly
  under the hero; the shared capture destination also covers transfers, so no
  second transfer CTA is invented.
- Recent activity = compact `TransactionRow` preview + "View transactions"
  header link. Never recreate the transactions page inside detail.
- Read-only resources: no management trailing action, no capture CTA; the
  on-hero ownership row (including the former-member explanation) carries the
  reason — disabled-looking controls are never used as the only signal.

### Credit-account detail pattern

Credit accounts use the same detail shell but a distinct liability-first hero:
`Card tone="hero"` makes **current outstanding** the dominant labeled amount,
rendered with `Amount` rather than cash `Balance`. A compact utilization value
and real `Progress` track sit beside it; the supporting row pairs **available
credit** with **credit limit**. A quiet due-date line may sit below that row,
while ownership/read-only context stays on the hero surface through
`FinancialOwnershipBadge onHero`.

The next section is the current statement, using an elevated card for due date,
remaining statement payment, paid-vs-statement amounts, and payment progress.
The single primary `Pay card` action follows it; installments and a bounded card
activity preview remain secondary sections. Normal utilization stays accent-led;
warning/danger fills are reserved for the existing utilization thresholds and
actual due/overdue states. Card debt must never be colored like income or
presented as spendable cash.

### Create / Edit

- Both are sheets built from shared form primitives (`TextField`,
  `SelectField`, `AmountField`, `FinancialScopeField`) with RHF + zod and the
  canonical `SheetActionFooter` (one primary, one escape, pending label swap,
  no duplicate submit).
- Create question order is fixed: type → name → opening balance (or credit
  card settings) → ownership. Conditional fields appear only after type
  selection; ownership stays last.
- Opening balance is a current-state amount ("already in this account when
  tracking starts"), never framed as income. Edit never exposes balance —
  balance changes flow through transactions only. Edit offers name/type only
  (type locked for credit cards); ownership is server-controlled and not
  editable after creation.
- Archive is the destructive path: danger-styled row inside the management
  sheet → explicit confirm state with consequences, never adjacent to Save.

### Loading / errors

- Detail loading mirrors the composition (header bone → hero card with icon
  chip + balance bone + context row → capture bone → activity rows). List
  loading is the hub skeleton.
- Detail-not-found renders `StatusAlert` danger + a back link — no raw
  hand-styled buttons.

## 27. Investments flows

Investments are a valuation-first resource, not a trading terminal. Money hub
rules apply: the hub row shows a holdings head-count only; valuation totals and
coverage semantics live on the Investments screens.

### List (Money child screen family)

- Follows the hub's hero-group composition: `TopAppBar variant="detail"` (back
  to Money), then `Card tone="hero"` with the dominant **Estimated market
  value** (caption, hero value, quiet coverage note in `text-hero-muted`) and
  an attached (gap-3) `Card tone="elevated"` metric strip with the 2×2 grid
  (remaining basis, estimated PnL with semantic tone, realized, income) —
  semantic tones live on the light strip, never on the hero. Incomplete basis
  is the one warning alert; coverage notes stay quiet text, never amber.
- Allocation uses the hub's composition language — a full-width segmented
  strip + two-column legend — never a clipped donut; Recharts stays off list
  screens.
- Holdings are split by a two-option segmented control (Active / Closed with
  counts); search applies to both tabs, asset-class chips only to Active. Long
  lists are capped (8 rows) behind a show-all toggle, matching the hub scan
  cap rule.
- The create action is the screen's `FloatingAction` pill ("Add investment"),
  fixed above the bottom navigation; Convert is the holdings section-header
  action rendered as a compact bordered pill (the section's control language —
  same family as the tabs/chips, never a bare text link). Never bury
  create/convert at the end of a long list.
- Position cards are `Card tone="interactive"`: `IconContainer tone="investment"`
  - name/instrument left, current value right (or "No price yet"); a divided
    footer row pairs gain/loss (signed + tone, or a missing-basis warning badge,
    or "Insufficient data") with quantity + one-line freshness. Cost basis lives
    on the detail screen; rows never carry all metadata.
- `InvestmentValuationMeta variant="inline"` renders freshness as one quiet
  xs line (`Automatic · today`, `Price updated manually on 08/21`, `Stale (date)`,
  `No price yet`); the badge stack (`variant="badge"`, default) stays for detail
  screens. Manual copy is self-describing — never duplicate the "manual" label.
- Closed holdings are quiet `Card tone="soft"` rows with a neutral "Closed"
  badge — historical, resolved, still navigable.

### Holding detail

- Identity in the `TopAppBar` detail header; the hero is `Card tone="hero"`
  with the on-hero icon chip pattern, "Estimated market value" caption, the
  `Amount`-semantics hero value (never `Balance` — valuations are estimates),
  and a `border-white/15` context row: `FinancialOwnershipBadge onHero` +
  inline freshness in `text-hero-muted`. Closed holdings show the closed
  caption + "no current value" line instead of a value; gain/loss stays off the
  hero (calm hero, performance lives in the metrics grid).
- Actions: primary Buy (always when mutable — buying re-opens a position),
  secondary Sell + overflow (income; manual valuation only when the holding is
  not auto-priced). Closed hides Sell/overflow. Read-only shows no actions; the
  hero ownership row explains why.
- Activity history is one divided list inside `Card tone="elevated"` (never
  one-card-per-event): friendly label + date/quantity left, executed value
  right, realized P&L (semantic xs) and slippage beneath.

### Unit-price semantics (binding)

Pricing is **price per unit** in create/buy/sell/valuation; totals are always
derived (`quantity × unitPrice`, half-up). The only total-value exceptions are
BOND and `TOTAL_VALUE`-mode instruments, driven by
`resolveInvestmentPricingContract` — never a free-choice total field. Sell keeps
the visible MAX ("Sell all") affordance and shows units owned, per-unit price,
gross → net → realized preview, destination account, and deterministic
"Remaining after sale" units. Valuation update sheets show units owned, current
price context, and the derived value preview.

### Forms and overlays

- Operation sheets (buy/sell/income/valuation/convert) use `ActionSheetLayout`
  with `SelectField`/`CheckboxField` shared primitives and the canonical
  `SheetActionFooter` (one primary with pending label swap, one escape).
- The create wizard is three steps with the shared thin `Progress` +
  "Step N of 3" indicator, `ChoiceTileGroup` entry-mode tiles, `MotionStep`
  transitions, and `BottomActionBar` — matching the onboarding form language.

## 28. Loans / Installment flows

Loans are a repayment-management flow, not a generic CRUD resource. The screen
must make the current obligation and the next supported action legible without
inventing borrowing-health metrics or changing the ledger model.

### Hierarchy and surfaces

- Keep the Loan identity in the detail `TopAppBar`; use one compact
  `Card tone="hero"` for the current **Remaining principal**.
- Pair the hero value with the next scheduled payment amount/date, due-state
  treatment, and real repayment progress. Static principal, interest, regular
  installments, and remaining balances stay neutral; warning/danger is reserved
  for due soon, due today, overdue, failed operations, and archive confirmation.
- Keep **Original principal**, **Principal paid**, **Interest paid**, **Remaining
  principal**, **Total repayment**, and **Next payment** as separate labeled
  concepts whenever the domain exposes them. Never collapse principal and
  interest into one unlabeled balance.
- Use `Amount`/`FinancialValue` plus tabular numerals and canonical currency/date
  formatters. A progress track is supporting evidence; the readable amount and
  percentage remain visible without relying on color.

### Create and edit

- Create remains tracking-only unless the domain explicitly supports a money
  movement. Do not add a disbursement selector or imply that borrowed cash was
  deposited into an account when the current command does not do so.
- Group the create sheet into identity/principal and repayment terms/estimate.
  Preserve RHF + Zod schemas, conditional fixed/floating/promotional rate
  branches, live amortization preview, ephemeral reset-on-close behavior, and
  the two-step Basics → Terms contract.
- Use shared `TextField`, `SelectField`, `DatePickerField`, `AmountField`,
  `FinancialScopeField`, and `SheetActionFooter`; the footer owns one primary
  action, one escape action, pending labels, and disabled state.
- Edit exposes only fields the lifecycle allows. Metadata editing remains
  separate from future-rate editing; paid schedule periods are immutable and
  future-rate changes rebuild only eligible unpaid periods.

### Schedule and due states

- Schedule rows are mobile-scannable: installment number/date, total due,
  principal component, interest component, remaining balance after, and a
  semantic status badge. Use divider rows rather than a dense spreadsheet or
  one-card-per-installment stack.
- Preserve the domain’s schedule and due-state helpers. Visually prioritize the
  next actionable, due-today, and overdue rows; paid and waived rows are calm
  and historical. Do not create a new Partial lifecycle status merely for
  presentation.
- The next-payment action must be explicit about the source account, scheduled
  amount, principal/interest split, effective date, and resulting remaining
  principal. Review happens before the command executes; receipt content uses
  backend allocation values rather than client approximations.

### Payoff, archive, ownership, completion, and loading

- Early payoff is estimate-only when the command supports only a planning
  estimate: show recorded remaining principal, unknown/unavailable components,
  as-of date, and a clear no-money-moves statement. Do not add settlement,
  fees, account selection, or completion behavior without domain support.
- Archive is not payoff. Use an explicit archive label and confirmation with
  consequences; retain payment history and keep destructive actions separate
  from normal repayment actions.
- Read-only partner/former-member Loans show the full permitted financial detail
  and explain why mutation controls are absent. Completed Loans emphasize
  completion, total history, and terms rather than a large Pay action.
- List, detail, schedule, and full-schedule loading boundaries mirror their
  final composition: header, summary/hero, progress/facts, action or year
  filter, and rows. Detail-not-found uses a danger `StatusAlert` with a back
  link; read failures remain distinct from empty and offline states.

## 29. Savings flows

Savings are a maturity-first resource: principal, rate, term, and the next
maturity decision define the screens — not a deposit CRUD list. Financial
semantics (§ discovery report §3) are binding; restyling never recalculates.

### List (Money child screen family)

- Same hero-group composition as Investments: `TopAppBar variant="detail"`
  (back to Money), `Card tone="hero"` with the household **Principal held**
  total (tracked-money note and attention count in `text-hero-muted`), and an
  attached `Card tone="elevated"` metric strip: expected net interest, expected
  received, settlement tax (only when > 0), and the needs-attention count
  (warning `StatusBadge` when > 0).
- Bank vs App/platform keep separate sections with family hints; rows are
  `Card tone="interactive"` links: `IconContainer tone="savings"` +
  provider/package identity left, principal + rate right; a divided footer
  pairs the lifecycle badge with maturity date + days remaining. Completed
  history rows are quiet `Card tone="soft"` with neutral settled badges.
- Lifecycle status uses `SavingsMaturityBadge` with distinct solid surfaces:
  savings-soft (active), solid warning (maturing soon), solid danger (matured /
  matures today / action required), muted (settled). Countdown meta sits beside
  the chip and only picks up warning/danger color for soon/action states.
  Active savings never look like warnings.
- Create is the screen's `FloatingAction` pill; "Manage providers" is a quiet
  bordered pill placed after the summary group.

### Detail

- Identity lives in the `TopAppBar` detail header (product name + family
  subtitle); the hero follows the Accounts icon-chip pattern: `Card tone="hero"`,
  on-hero family icon chip, "Principal held" caption, tabular hero value, and a
  `border-white/15` context row (`FinancialOwnershipBadge onHero` + maturity
  date / days left). The lifecycle badge lives in the metrics strip — never
  colored onto the hero.
- Attached metric strip (`Card tone="elevated"`): locked rate, term, maturity
  state badge, start date; the divided return block beneath shows gross
  expected interest → tax (only when > 0) → net interest → **Expected
  received** (emphasized) with the estimate-until-settlement hint.
- Term progress uses shared `Progress` (savings tone) between start/end dates
  with an elapsed/total label. Product facts and money flow (funded from /
  settles into) stay separate labeled sections.
- Actions stay lifecycle-gated in `BottomActionBar`: the settle/rollover sheet
  when matured, "Settle early" as a secondary-styled link while allowed;
  terminal states show the closed info alert with history only; read-only
  resources show full financial detail without mutation controls.
- Loading boundaries mirror both compositions (`loading.tsx` for list and
  detail).

### Maturity, settlement, and rollover (binding)

- Settlement / rollover use the two-step sheet (strategy → optional target
  package + destination → review). The review separates principal, gross
  interest, tax, fee, payout, and **Received** (withdraw) vs **New principal**
  (rollover — principal+interest rollovers carry the full proceeds, never a
  reset to the original principal), plus the new package's rate, term, and new
  maturity date. The saved maturity-instruction editor shares the same choice
  language.
- Early withdrawal is a distinct decision page: the preview distinguishes the
  early-withdrawal rate (including "unknown until provider or manual quote"),
  accrued vs eligible interest, tax, penalty, and estimated net return;
  warnings use attention (`StatusAlert` warning), never destructive framing;
  the request enqueues an Inbox confirmation before any money moves.
- Bank vs platform stays factual: family icons/groups plus tax semantics
  (bank none / platform % on interest) surface only through real product data.

### Create wizard and catalog

- The wizard keeps the three-step flow with the canonical shared `Progress` +
  "Step N of 3" indicator, `ChoiceTile` selections with per-family hints, the
  live estimate card, and a review hero (`Card tone="hero"`) carrying the
  maturity amount — the single hero of that step.
- Provider/product management uses canonical management patterns: sheet editors
  with `TextField`/`SelectField`, the HeroUI icon-picker dropdown, and archive
  behind an explicit inline confirm state (warning card + cancel / archive
  danger pair) — never `window.confirm`.

## Do / Don't

**Do**: consume `Card` tones, `Section`, `Balance`/`Amount`/
`FinancialDelta*`, `Progress`, `StatusBadge`, `BottomActionBar`,
`FloatingAction`, `SectionHeader`, the shared `Skeleton`; map meaning to the
surface table above; keep one hero and one primary action per screen.

**Don't**: raw hex/arbitrary values in features; re-declared card/button
CSS; nested card soup; teal on every accent; green/red for static balances;
warning color for harmless info; new radii/shadows/spacing scales; separate
visual language for forms or admin-ish screens.

## 30. Inbox attention-center pattern

Inbox is the product's **financial attention center**, not a generic notification feed. The queue uses a summary-first composition: contextual `TopAppBar`, a single compact summary surface, Open/Archived tabs, a soft filter surface, and one grouped list of review items. Pending items use semantic identity icons and status treatments; history uses neutral surfaces and remains readable without competing with active work.

Inbox item rows follow the compact hierarchy `[semantic icon] [what needs attention + source context] [amount]`, followed by one kind/status badge and one quiet next-step cue. The whole row is the navigation target for actionable items. The row must not duplicate the primary action with a second large button. Warning is reserved for review-required or due attention; informational milestones use info/success semantics; former-member resources remain neutral and read-only. Meaning must remain available through labels, typography, iconography, and copy, not color alone.

Inbox detail uses the canonical detail pattern: detail TopAppBar with back navigation, a highlighted decision-context surface, one source-context ReviewCard, an amount-is-context alert, compact source facts, an optional owning-domain link, and the existing kind-specific action panel. Inbox does not own Money or Savings movements; those actions continue through their owning application flows.

Loading skeletons mirror the summary, tabs, filter surface, grouped section, and compact item rows. State changes may use `motion/react` for subtle opacity/transform transitions on filtered items only, using shared `motionTokens`/`springs`, SSR-safe initial state, and reduced-motion policy. Do not animate every item on mount, financial values, or layout dimensions.

## Together Collaboration UI Patterns

The Together domain uses a compact, management-oriented presentation inside the centered 440px app shell. The overview leads with one household identity hero, active-member count, current Admin/Partner responsibility context, and one contextual lifecycle notice when needed. Follow with grouped management rows for invitations, policies, household preferences, and account settings; do not use an equal-weight link stack as the primary hierarchy.

Active members use divided rows inside one elevated management surface. Identity is primary, Admin/Partner is responsibility context rather than financial ownership, and a short capability hint clarifies whether the member can manage the household or has ordinary member access. Pending invitations have a distinct warning-toned surface and must never look like active members; show invitee context, pending status, expiry, Copy link, copied feedback, and Revoke only when the actor is allowed.

High-consequence Together actions use the canonical HeroUI-backed `Sheet` with `ActionSheetLayout` and safe-area-aware `SheetActionFooter` where appropriate. Confirmation copy must explain access loss, retained historical/read-only personal resources, Admin continuity, and obligation follow-up without suggesting ownership transfer or money movement. HeroUI owns sheet motion; do not layer Motion over the sheet transition.

Together lifecycle and ownership notices use ordinary household language. Former-member and owner-unavailable contexts belong on canonical Money, Plan, or Inbox resource surfaces rather than being duplicated as financial detail inside Together. Admin responsibility is never described as financial ownership. Solo-Admin continuity remains a contextual warning because household deletion is not a supported V1 action.

Together loading boundaries mirror the loaded hierarchy with the shared `Skeleton` primitive. New Together entry motion uses the existing `MotionReveal` client leaf and shared `useMotionPolicy`; it is limited to calm transform/opacity continuity, is stable-keyed and SSR-safe, and degrades under reduced motion or low-end-device policy. No decorative cascades, loops, animated financial digits, or overlay motion stacking are allowed.

## Brand / Logo

Family Finance's canonical brand mark is the approved raster board at
`public/brand/logo-primary.png`. It must remain unchanged. The visible identity
is the two-tone family-home mark with the **Family Finance** wordmark and the
tagline **Plan together. Build better.**

Use the approved mark on identity surfaces: Welcome, authentication, onboarding
entry, splash/loading moments, system fallbacks, and compact app-brand headers.
Use the lockup only where there is room; use the transparent mark in compact
headers. Reserve the square app-icon crop for favicon, PWA, and platform icon
surfaces. Do not redraw, simplify, recolor, distort, or alter the logo
geometry. Do not use the full lockup in navigation rows, buttons, or financial
data surfaces.

Generated derivatives live beside the source: `public/brand/logo-lockup.png`,
`public/brand/logo-mark-transparent.png`, and `public/brand/app-icon.png`.
Favicon and PWA exports are generated from the approved source by
`node scripts/generate-brand-assets.mjs`: `public/favicon-16x16.png`,
`public/favicon-32x32.png`, `public/favicon-48x48.png`, `public/favicon.ico`,
`public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`,
and `public/maskable-512.png`.

Inline brand marks used inside app UI must always use transparent-background
assets. Square app-icon assets with baked-in backgrounds must never be used
inside headers or inline branding. Use the existing semantic design tokens
around the asset. Never add a second logo treatment, generic
house/wallet/piggy-bank/dollar icon, or hand-edited formatted copy as a
substitute for the approved brand mark.
