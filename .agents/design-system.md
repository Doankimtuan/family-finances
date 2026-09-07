# ViNha UI/UX Design System — Single Source of Truth

**This file is the authoritative UI/UX redesign reference for ViNha / Family
Finance.** Every future AI agent must read it before redesigning any screen.

Home remains the visual north star for composition DNA. Same product DNA,
different composition per screen — do not copy Home’s layout onto other
screens; reuse its system.

Supporting contracts (do not duplicate as textbooks; link when deeper detail
is needed):

- `artifacts/information-architecture/CURRENT/` — five-tab IA, screen catalog
- `artifacts/ux-redesign/CURRENT/` — flows, forms, confirmation, states, copy
- `artifacts/design-system-evolution/CURRENT/` — Phase D visual package

Implementation stack: Next.js App Router · HeroUI v3 · Tailwind semantic
tokens · Hugeicons Free Stroke Rounded via `AppIcon` · `motion/react` via
`shared/motion` · Recharts only when a chart answers a real question.

---

## Table of contents

1. [Contract protection](#1-contract-protection)
2. [Reference priority](#2-reference-priority)
3. [Reference URL analysis](#3-reference-url-analysis)
4. [Flow discovery](#4-flow-discovery)
5. [Scope control](#5-scope-control)
6. [No mock data](#6-no-mock-data)
7. [Safe implementation sequence](#7-safe-implementation-sequence)
8. [Before / after validation](#8-before--after-validation)
9. [Visual consistency gate](#9-visual-consistency-gate)
10. [Flow completeness DoD](#10-flow-completeness-dod)
11. [ViNha Design DNA](#11-vinha-design-dna)
12. [Reference apps & hierarchy](#12-reference-apps--hierarchy)
13. [Screen reference matrix](#13-screen-reference-matrix)
14. [Design tokens & surfaces](#14-design-tokens--surfaces)
15. [Typography](#15-typography)
16. [Color & financial semantics](#16-color--financial-semantics)
17. [Layout, spacing, radius, elevation](#17-layout-spacing-radius-elevation)
18. [Iconography](#18-iconography)
19. [Motion](#19-motion)
20. [Charts](#20-charts)
21. [Components](#21-components)
22. [Bottom Sheets](#22-bottom-sheets)
23. [Forms](#23-forms)
24. [Interaction patterns](#24-interaction-patterns)
25. [Navigation](#25-navigation)
26. [Screen states](#26-screen-states)
27. [UX writing](#27-ux-writing)
28. [Accessibility](#28-accessibility)
29. [Mobile-first rules](#29-mobile-first-rules)
30. [Action hierarchy & headers](#30-action-hierarchy--headers)
31. [Screen family recipes](#screen-family-recipes)
32. [ViNha UI/UX anti-patterns](#32-vinha-uiux-anti-patterns)
33. [AI UI/UX redesign rules](#33-ai-uiux-redesign-rules)
34. [Decision framework](#34-decision-framework)

Prefer **Rule → Example → Do → Don’t** over theory.

---

## 1. Contract protection

Visual refactoring is allowed. Domain behavior changes are out of scope.

> If a UI redesign appears to require a business-logic, data, API, or
> financial-rule change, **STOP** and document the conflict instead of changing
> the underlying contract.

**Must not modify:** database schema or records; Supabase data; API contracts
or request/response shapes; business logic, financial calculations, or domain
models; existing state / data-fetching logic; authentication or authorization;
existing validation rules.

- **Rule:** Redesign presentation, not contracts.
- **Example:** Recoloring a remaining-principal hero is allowed. Recalculating
  remaining principal is not.
- **Do:** Restyle `Balance` / `Amount` / `Card` / `Sheet` with existing tokens.
- **Don’t:** Change Zod schemas, command payloads, RPC calls, ledger math, or
  permission checks to make a layout work.

---

## 2. Reference priority

Design decisions resolve in this order. A lower item never overrides a higher
one.

1. Existing ViNha product / domain rules
2. This UI/UX Design SoT
3. Existing implemented behavior and flows
4. User-provided reference URL
5. Monarch / Monzo / Copilot / YNAB principles

External references must **never** override an existing ViNha contract.

- Reference URLs are inspiration, not implementation templates.
- The four apps are principle sources, not layouts to clone.
- No external navigation architecture may be imported blindly (five tabs stay
  five tabs).
- No external financial concept may be introduced unless ViNha already supports
  it (no invented net worth, no Hũ-as-cash, no Reports tab, no Health advice).

When multiple references apply:

```text
Primary reference + existing ViNha pattern + secondary reference
  → final ViNha design
```

Never: `copy one app → ship`.

---

## 3. Reference URL analysis

Distinguish **reference inspiration** from the **ViNha implementation
contract**.

Before using a URL:

1. Inspect the provided reference.
2. Identify useful visual and interaction patterns.
3. Identify which patterns are relevant to the **target ViNha screen**.
4. Ignore patterns that conflict with ViNha (IA, money meaning, overlays,
   tokens, 440px shell).
5. Adapt useful patterns with ViNha Design DNA, existing components, and
   existing tokens.
6. Never copy the reference layout blindly.

- **Do:** Borrow Copilot row density for Transactions if it fits
  `TransactionRow`.
- **Don’t:** Import Copilot’s nav, invent a Reports destination, or replace a
  ViNha Sheet with a full-page form because the URL does that.

---

## 4. Flow discovery

> A screen must never be redesigned as a static screenshot.

Before implementing any redesign:

1. Identify the target route (`APP_PATH` / path builder in
   `modules/shared-kernel/app-path.ts`).
2. Inspect the current implementation.
3. Identify every interactive element.
4. Trace every interaction to its resulting state or screen.
5. Inspect related Bottom Sheets (`Sheet` / `ActionSheetLayout`).
6. Inspect related Action Sheets.
7. Inspect related Dialogs.
8. Inspect related Forms.
9. Inspect validation and confirmation states.
10. Inspect success / error / empty / loading / offline / partial states.
11. Build a mental or documented flow map.
12. Only then implement the redesign.

```text
Page → Button → Bottom Sheet → Form → Validation → Confirmation
  → Success → Updated screen
```

- **Rule:** If a button currently opens a Bottom Sheet, do not replace it with
  a different interaction merely because the reference app uses another pattern.
- Only redesign flows reachable from the affected screen.

---

## 5. Scope control

**In scope:** target screen; directly connected interaction flows; related
overlays; related states; shared UI components that **must** change after
impact assessment.

**Out of scope:** unrelated screens; backend refactoring; database changes;
business-logic changes; unrelated component rewrites; large-scale architecture
refactoring.

If a shared component change affects multiple screens, assess impact first.
Prefer local composition (`className`, existing tones) over changing the
primitive.

---

## 6. No mock data

During UI redesign:

- Never replace real data with mock data.
- Never seed temporary data or reset local / project data.
- Never hard-code realistic-looking financial values.
- Never modify fixtures just to make screenshots look better.
- Never bypass loading / error / empty states using fake data.

Day-zero Home already shows real empty states — keep that.

---

## 7. Safe implementation sequence

```text
1. Read `.agents/design-system.md` (this file)
2. Read relevant supporting contracts (IA / UX / design-system-evolution /
   screen-family recipe)
3. Inspect target route
4. Inspect current implementation
5. Inspect connected flows (sheets, dialogs, forms, confirmations)
6. Inspect current components / tokens
7. Inspect reference URL (if provided)
8. Compare reference against ViNha rules; drop conflicts
9. Create redesign approach (UI-only)
10. Implement UI-only changes
11. Validate complete interaction flow
12. Validate data / business contracts were untouched
13. Run focused / affected tests only
14. Run visual consistency gate
15. Update documentation only if necessary
```

Do **not** require the full test suite for every UI task. Do **not** skip
focused tests for the affected area.

---

## 8. Before / after validation

A redesign is incomplete if visual improvements change product behavior.

**UI may change:** layout, typography, spacing, colors, components, responsive
behavior (still 440px column), visual hierarchy, interaction _presentation_.

**Product behavior must stay:** same data, API behavior, business logic and
calculations, validation, navigation, permissions, user flows (including which
overlay opens), persistence.

```text
[ ] Same route and back target
[ ] Same primary action and overlay type (Sheet vs page vs Dialog)
[ ] Same fields, validation, and confirmation level
[ ] Same success destination
[ ] Same empty / loading / error / offline treatment exists
[ ] No new financial concept or invented aggregate
[ ] No mock / seeded / hardcoded money values
[ ] Focused tests for the affected flow pass
```

---

## 9. Visual consistency gate

Answer **yes** to all, or revise before completing:

- Does the screen still feel like ViNha?
- Does it follow Calm Household Finance?
- Does it use existing ViNha tokens?
- Does it reuse existing components where appropriate?
- Does it follow the existing IA (five tabs, 440px shell)?
- Does it follow the screen-family recipe?
- Does it feel consistent with previously redesigned screens?
- Does it avoid looking like a clone of Monarch, Monzo, Copilot, or YNAB?
- Does it keep the same visual language as the rest of the application?

---

## 10. Flow completeness DoD

A redesign is **not** complete when the initial page looks correct.

Complete only when this reachable set has been considered and remains
functional:

```text
Initial screen
+ all relevant interactions
+ Bottom Sheets + Dialogs + Forms
+ Validation + Confirmation
+ Success + Error + Empty + Loading
```

Only flows reachable from the affected screen.

---

## 11. ViNha Design DNA

**Feel:** modern, calm, premium, friendly, trustworthy, financially clear,
slightly energetic / Gen-Z, family-oriented, mobile-first.

**Avoid:** corporate banking UI; excessive gradients or decoration; dense
financial dashboards; childish gamification; visual noise; unnecessary
animation.

**User feeling:** “Managing family money is simple and understandable.”

Product name in UI: **Family Finance** / ViNha. Visual language name:
**Calm Household Finance** — deep teal brand anchor (selective), warm-stone
neutral surfaces, semantic color reserved for financial meaning and attention.

Binding product facts (beat any reference-app impulse):

- Five tabs only: Home, Money, Plan, Inbox, Together. Health is secondary.
- Desktop stays the centered ~440px mobile column (`AppViewport`).
- **Hũ ≠ Monzo Pots** — intention envelopes; cash lives in Money.
- Money hub must not invent net worth or “total money”.
- Health is read-only (BR-24). No investment advice.
- There is **no Reports tab**. Analytics live on Home cash-flow, Health, and
  product list/detail charts where they already exist.

See also `artifacts/design-system-evolution/CURRENT/visual-direction.md` and
`product-personality.md`.

---

## 12. Reference apps & hierarchy

The four apps are **principle sources, not templates**. Never clone layouts,
copy, or chrome.

| Need                                                                   | Primary |
| ---------------------------------------------------------------------- | ------- |
| Product architecture, Home, family, accounts, overview                 | Monarch |
| Hũ interaction, money organization, sheets, fast capture, recurring    | Monzo   |
| Visual polish, transactions, charts, cards, spacing, premium feel      | Copilot |
| Budgeting philosophy, Goals, funding, progress, “what money should do” | YNAB    |

Adaptation rules that beat the references:

- Monarch desktop dashboards → still 440px single column.
- Monzo Pots → Hũ interaction only; cash stays in Accounts.
- Copilot density → ViNha medium density; one hero per screen.
- YNAB envelope language → already present (“Give every đồng a job”); do not
  import YNAB’s full category grid.

---

## 13. Screen reference matrix

**Before adding a matrix row:** verify the route in
`modules/shared-kernel/app-path.ts`, the screen in
`artifacts/information-architecture/CURRENT/screen-catalog.md`, and a page
under `app/[locale]/`. If a reference pattern does not map to an existing
capability, document it as inspiration only — do not invent the capability.

Do not invent Reports, analytics destinations, financial concepts, navigation
destinations, or product capabilities.

| ViNha screen                      | Route(s)                                                            | Primary               | Secondary               | Main UX goal                   |
| --------------------------------- | ------------------------------------------------------------------- | --------------------- | ----------------------- | ------------------------------ |
| Welcome / Auth                    | `/`, `/welcome`, `/login`, `/register`, `/forgot-password`          | Existing ViNha recipe | Copilot polish          | Clear entry                    |
| Onboarding                        | `/together/onboard`                                                 | Existing ViNha recipe | Monzo simplicity        | Minimal setup → Home           |
| Home                              | `/home`                                                             | Monarch               | Copilot                 | Household overview             |
| Money hub                         | `/money`                                                            | Monarch               | Existing Money recipe   | Understand available money     |
| Accounts (hub scan + detail)      | `/money`, `/money/accounts/[id]`                                    | Monarch               | Existing account recipe | Inventory of containers        |
| Transactions list / detail        | `/money/transactions`, `…/[id]`                                     | Copilot               | Monarch                 | Fast transaction understanding |
| Add Transaction                   | `/money/transactions/new`                                           | Monzo                 | Copilot                 | Fast data entry (~15s)         |
| Cards                             | `/money/cards`, `…/[id]`                                            | Monarch               | Copilot                 | Liability clarity              |
| Debts                             | `/money/debts`, `…/[id]`                                            | Monarch               | Copilot                 | Borrowed / owed tracking       |
| Loans                             | `/money/loans`, `…/[id]`                                            | Monarch               | Copilot                 | Repayment management           |
| Savings                           | `/money/savings`, `…/[id]`                                          | Monarch               | Copilot                 | Maturity-first inventory       |
| Investments                       | `/money/investments`, `…/[id]`                                      | Copilot               | Monarch                 | Simple valuation overview      |
| Plan hub                          | `/plan`                                                             | YNAB                  | Monarch                 | Intention overview             |
| Hũ (Jars)                         | `/plan/jars`, `…/[id]`                                              | Monzo                 | YNAB                    | Organize intention (not cash)  |
| Goals                             | `/plan/goals`, `…/[id]`                                             | YNAB                  | Monarch                 | Save toward meaningful goals   |
| Recurring                         | `/plan/recurring`, `…/[id]`                                         | Monzo                 | YNAB                    | Recurring money clarity        |
| Calendar                          | `/plan/calendar`                                                    | YNAB                  | Monarch                 | Projection readability         |
| Ritual                            | `/plan/ritual`                                                      | YNAB                  | Monzo                   | Month close / decisions        |
| Inbox                             | `/inbox`, `/inbox/[id]`                                             | Monarch               | Monzo                   | Shared attention / decisions   |
| Together                          | `/together`, members, invitations                                   | Monarch               | Monzo                   | Shared financial visibility    |
| Policies / Preferences / Settings | `/together/policies`, `/together/preferences`, `/together/settings` | Monzo                 | Monarch                 | Simple configuration           |
| Health                            | `/health`, `/health/insights`                                       | Copilot charts        | Monarch                 | Read-only condition            |

---

## 14. Design tokens & surfaces

Use Tailwind / `--vinha-*` / `--color-*` tokens from `styles/globals.css` and
`shared/theme/tokens.ts`. **Never raw hex in feature code.** Do not invent a
parallel scale.

| Role                | Token(s)                                            | Use                                      |
| ------------------- | --------------------------------------------------- | ---------------------------------------- |
| Base / canvas       | `bg-canvas`                                         | Page background                          |
| Surface             | `bg-surface` + `border-border-subtle`               | Grouped content (`Card tone="elevated"`) |
| Elevated            | `bg-surface-elevated` + `shadow-(--elevation-1..2)` | Popovers, stronger separation            |
| Hero / accent       | `Card tone="hero"` (`from-hero to-hero-deep`)       | **Max one hero per screen**              |
| Attention           | `Card tone="warning"`                               | Review-required / pending — not error    |
| Error / destructive | danger tokens + `StatusAlert` danger                | Failures and destructive actions only    |
| Interactive         | `bg-surface-hover`                                  | Hover/pressed, chips, quiet controls     |

Hero tokens are theme-aware: deep teal in light; richer elevated teal in dark.

---

## 15. Typography

Fonts: Geist Sans; Geist Mono for technical IDs when needed. Financial
numbers: tabular numerals, `tracking-tight`, formatted via
`shared/i18n/formatters`, privacy-masked through `FinancialValue` /
`Balance` / `Amount`. Never style currency ad hoc per screen.

| Role                   | Implementation                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| Screen title / context | `Heading` level 1, compact (`text-base font-semibold` on Home greeting) |
| Section title          | `Heading` level 3 `text-sm font-semibold text-text-primary`             |
| Subsection / label     | `Text size="sm" tone="secondary"` (`font-medium`)                       |
| Hero financial value   | `Balance size="hero"` (36px, semibold, tabular)                         |
| Primary value          | `Amount` / `Balance` (`text-lg`–`text-xl`)                              |
| Signed movement        | `FinancialDeltaValue`                                                   |
| Body / secondary       | `Text` base/sm; metadata xs `tone="muted"`                              |

Money hierarchy: dominant amount → supporting amount → metadata amount. Screen
readers must receive financial meaning, not only the formatted number.

---

## 16. Color & financial semantics

Communicate important financial states with **color + icon + label + context**.
Color is never the only cue.

- **Current-state / neutral** (balances, portfolio value, remaining principal,
  transfers as facts): `text-text-primary`. Never green/red just for being
  positive. Real ledger balance → `Balance`; intentions/magnitudes → `Amount`.
  Debt amounts are **never** auto-red.
- **Positive movement** (income, gain, positive net flow): success /
  `FinancialDeltaValue` + directional icon.
- **Negative movement** (expense, loss, negative delta): danger tone +
  directional icon.
- **Attention / review** (uncategorized, pending inbox, maturity soon): warning
  treatment. Do not overload expense red for warnings.
- Brand teal (`accent` / `primary` / hero): primary actions, selected states,
  the hero surface, navigation emphasis — not every icon/divider.
- Semantic tokens only: `success`, `danger`, `warning`, `info`, and money
  aliases (`income`, `expense`, `saving`, …).
- Do not fabricate metrics; progress/deltas must come from real data.

---

## 17. Layout, spacing, radius, elevation

### Spacing (`--space-*`)

Documented scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 (rare 64).
Page gutter `--page-gutter` = 16 (`--space-4`).

- Tight (4–8): icon↔label, label↔value.
- Normal (12–16): content inside cards (`p-3`–`p-4`).
- Group (12): tightly related surfaces (hero → net strip).
- Section (20–24): between major modules.
- Screen (16–20): page-level rhythm.

Avoid one-off values and nested card soup. Prefer whitespace and `Section`
over card-inside-card.

### Radius

- `--radius-control` = 10px (controls)
- `--radius-card` = 12px (cards)
- `--radius-overlay` = 16px (sheets/modals)
- `rounded-full` for pills/badges/segmented tracks only

No other radii.

### Elevation

| Level  | Token                 | Use                               |
| ------ | --------------------- | --------------------------------- |
| None   | `shadow-none`         | Flat sections, plain rows         |
| Subtle | `--elevation-1`       | Standard elevated cards           |
| Raised | `--elevation-2`       | Hero, floating overlays           |
| Sticky | blur + border + scrim | `BottomActionBar`, sticky headers |

Light: shadow + border + tonal difference. Dark: surface steps + borders +
restrained shadows.

### Card philosophy

Cards group one coherent concept. Prefer `Section` and divider rows inside
cards. Shared tones in `shared/patterns/card.tsx`: `default`, `interactive`,
`metric`, `soft`, `highlighted`, `warning`, `elevated`, `hero`. Feature code
must not re-declare card CSS.

---

## 18. Iconography

Hugeicons Free Stroke Rounded via `AppIcon` only. Semantic registries
(navigation / finance / action / utility / category) for stable concepts;
persist `iconKey` only.

Sizes (`AppIconSize`): `xs` 14 · `sm` 16 · `md` 20 · `lg` 24 · `xl` 32 ·
`display` 40. `IconContainer` for leading identity icons.

- **Do:** consistent stroke; pair status icons with text.
- **Don’t:** second icon family, Pro/solid/duotone, emoji as UI icons, SVG in
  persisted data.

---

## 19. Motion

Motion exists only where it improves feedback, continuity, or comprehension.
Tokens from `shared/motion` — never inline durations/easings/distances.

Allowed: press scale (`--press-scale` 0.98); fade / small translate
(`MotionReveal`, ≤ `distance.sm`); opacity crossfade for privacy mask; segmented
`layoutId` thumb; `Progress` `scaleX`; HeroUI owns sheet/dialog motion — never
stack Motion on Drawer/Modal.

Reduced motion / low-end: instant or opacity-only; no loops, bounce, staggered
card cascades, or digit-counting financial numbers.

---

## 20. Charts

Recharts + chart tokens (`chart-positive` / `negative` / `grid`): solid =
income, dashed = expense; minimal grid; legend with section heading; tooltip on
elevated surface. Distinguish loaded / zero / sparse / no-data. Never fabricate
or interpolate activity. Money hub: composition strip is the analytics ceiling —
no charts on the hub.

---

## 21. Components

Prefer:

```text
Design pattern → existing ViNha component → existing token → existing flow
```

New components only when an existing one genuinely cannot support the pattern.
Do not create duplicates. Assess multi-screen impact before changing a shared
primitive.

| Pattern               | Purpose                   | When                              | When not                           | Implementation                         | Reference         |
| --------------------- | ------------------------- | --------------------------------- | ---------------------------------- | -------------------------------------- | ----------------- |
| Card                  | Bound one story           | Coherent summary / product        | Wrapping every row                 | `shared/patterns/card.tsx` tones       | Copilot / Monarch |
| Account / credit hero | Dominant money fact       | Account / card detail             | List rows                          | `financial-account-hero.tsx`           | Monarch           |
| Transaction row       | Scan real movement        | Lists, previews                   | Nested card stacks                 | `transaction-row.tsx`                  | Copilot           |
| Hũ card               | Intention target          | Plan jars                         | As cash balance                    | `jar-card.tsx`                         | Monzo + YNAB      |
| Goal card             | Progress to target        | Plan goals                        | Fake ratios                        | `goal-card.tsx`                        | YNAB              |
| Progress              | Real ratio evidence       | Budgets, goals, utilization       | Decoration                         | `shared/ui/progress.tsx`               | YNAB / Monarch    |
| Button                | Actions                   | One primary per state             | Many equal CTAs                    | `shared/ui/button.tsx`                 | Monzo             |
| FloatingAction        | High-frequency create     | Home/Money capture, domain create | Form submit                        | `floating-action.tsx`                  | Monzo             |
| BottomActionBar       | Sticky form/confirm       | Long forms, lifecycle actions     | Navigation chrome                  | `bottom-action-bar.tsx`                | Monzo             |
| Bottom nav            | Five tabs                 | Product shell                     | Extra tabs                         | `bottom-navigation.tsx`                | Monarch IA        |
| TopAppBar             | Where / back / one action | All product screens               | Marketing headers                  | `top-app-bar.tsx`                      | Monarch           |
| Search / filters      | Narrow lists              | Transactions, holdings            | Desktop filter panels              | chips / filter bar                     | Copilot           |
| EmptyState            | Invite next action        | Empty lists/sections              | Large illustrations by default     | `empty-state.tsx`                      | Monzo             |
| Skeleton              | Mirror loaded layout      | Real loading                      | Fake delays / fake values          | `shared/ui/skeleton.tsx`               | —                 |
| Error / StatusAlert   | Recoverable failure       | Load/mutation errors              | Soft info as danger                | `error-state`, `status-alert`          | —                 |
| Toast                 | Polite feedback           | Lightweight success               | Critical errors only               | `toast.tsx`                            | Monzo             |
| Dialog                | Centered modal            | Short confirm when sheet unfit    | Primary create forms               | `dialog.tsx`                           | —                 |
| Sheet                 | Bottom overlay            | Create/edit/confirm mobile        | Multi-step wizards that are pages  | `sheet.tsx`, `action-sheet-layout.tsx` | Monzo             |
| Forms / date / select | Field entry               | All product forms                 | Native Select/Date/Time as primary | `shared/ui/form/*` + HeroUI            | Monzo             |

Lists/rows language: `[IconContainer] [label + secondary] [value column]` with
`--financial-number-column-width`, `divide-y`, `py-3`.

---

## 22. Bottom Sheets

Implemented physics (do not re-invent):

- `Sheet` = HeroUI Drawer bottom (`shared/patterns/sheet.tsx`)
- Composition: `ActionSheetLayout` header + scrolling body + sticky footer
- `SheetActionFooter`: one secondary escape + one primary; pending label swap;
  Cancel stays available when primary is invalid
- Height: `max-h-[min(90dvh,720px)]`; drag handle always present
- Radius: `--radius-overlay`; surface: `bg-surface-elevated`
- Body clearance: `--sheet-footer-clearance`; footer:
  `--sheet-footer-space` + safe-area inset
- Close discards ephemeral create/action state (AGENTS.md)
- HeroUI owns motion — never stack `motion/react` on the drawer
- Complex multi-step product setup stays a **page** (loans / savings /
  investments wizards already do)

Destructive actions never sit next to Save as an equal primary. Keyboard must
not hide the active field or CTA. The sheet is an extension of the current
screen, not a separate product.

---

## 23. Forms

Shared form primitives own labels, descriptions, validation, disabled state,
and accessible relationships. Money via `MoneyInput` / `AmountField`; numbers
via `NumberField`; select/date/time via HeroUI — never native primary controls.

- Required fields before optional; collapse optional until needed.
- Sticky submit via `BottomActionBar` or `SheetActionFooter`: one primary + one
  escape.
- Preview-confirm when real money, irreversible, closed-period, partner-visible,
  or domain-risk (see `artifacts/ux-redesign/CURRENT/financial-confirmation-model.md`).
- Ephemeral create/action forms reset on close; edit forms reopen from
  persisted data.
- Do not change financial behavior when restyling.

---

## 24. Interaction patterns

Canonical flows (redesign end-to-end, not as screenshots):

```text
Capture: FAB → form → validate → preview-if-consequential → save → detail
Transaction: row → detail → edit/refund/correct → form → preview-confirm → detail
Hũ: list → detail → edit plan / reallocate → sheet → confirm → intention updated
Goal: list → detail → contribute → amount → confirm → progress
Account: hub scan → create sheet → detail → archive confirm
Inbox: queue row → detail → one decision → receipt → return to queue position
```

Confirmation levels: none / lightweight / preview-confirm.

---

## 25. Navigation

- Bottom tabs (exactly five): Home, Money, Plan, Inbox, Together
  (`shared/patterns/bottom-navigation-tabs.ts`). Health and Settings are not
  tabs.
- `TopAppBar` answers: Where am I? Can I go back? What is the one primary
  action?
- Inline / row navigation → trailing chevron (`ACTION_ICONS.forward`).
- Interactive cards → `Card tone="interactive"`; arrow only when the whole card
  navigates.
- Cross-module links are explicit exits. Ownership stays with the destination
  screen’s domain.

---

## 26. Screen states

Every major screen must consider:

```text
Loading → Empty → Populated → Partial data → Error → Offline → Success
```

See `artifacts/ux-redesign/CURRENT/screen-state-model.md` and screen-family
recipes. Skeletons mirror loaded composition. Offline: read-only review; block
unsafe mutations. Partial/stale: label freshness; never fake zeros.

---

## 27. UX writing

Calm, plain, bilingual-ready. No guilt, shame, advice, or unnecessary banking
jargon. Prefer short actionable CTAs.

| Prefer                            | Avoid                           |
| --------------------------------- | ------------------------------- |
| Thêm tiền / Add money             | Xác nhận giao dịch nạp tiền     |
| Tạo hũ / Create jar               | Initialize allocation envelope  |
| Gốc còn lại / Remaining principal | Outstanding amortized liability |
| Còn lại để chi tiêu (when shown)  | Available Disposable Income     |

Canonical terms: Account, Transaction, Jar/Hũ, Category, ReviewItem, Plan
Movement, Month Ritual, Health, Estimated value (not cash). Keep EN/VI nouns
consistent via message catalogs.

---

## 28. Accessibility

WCAG AA. Minimum touch target 44px. Color never the only cue. Labels above
inputs; errors below fields. Screen reader labels include financial meaning
(“estimated value, not cash”, “real money changed”). Respect
`prefers-reduced-motion`. EN and VI must fit without clipping.

---

## 29. Mobile-first rules

- Touch targets ≥ 44px; thumb-friendly primary CTAs.
- Bottom nav fixed and safe-area aware; sticky actions use `BottomActionBar`.
- Keyboard must not hide active field or submit.
- Long lists preserve scroll position on return.
- Sheets: comfortable height; complex flows use pages.
- Desktop adapts from mobile — centered 440px column, not a different product.
- Verify substantial UI at 390 / 440 / 768 / 1280, light + dark.

---

## 30. Action hierarchy & headers

- **Primary** (`Button variant="primary"`): one per screen state.
- **Secondary** / **tertiary** / **destructive**: never style destructive as
  primary.
- **FloatingAction**: high-frequency create (Add Transaction on Home/Money is
  canonical).
- **BottomActionBar**: form/confirm submits only.
- Headers are compact; above-the-fold space belongs to product information.
- Screen roles: Dashboard · List · Detail · Form · Management · Empty/new-user.

---

## 31. Screen family recipes

The following chapters are binding implementation recipes. Same DNA, different
composition. When redesigning, follow the matching recipe after completing flow
discovery.

## S1. Entry, Authentication & Onboarding

The pre-product journey (`/` → login/register → onboarding → home) is one
product, not a set of standalone pages. Rules below govern Welcome, Login,
Register, Forgot Password, and the onboarding wizard. This section is the canonical auth/onboarding UX contract for agents.

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

## S2. Persistent quick actions

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

## S3. Financial Hub / Money screens

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
reuse this row language and attention semantics. This section is the canonical
Money hub UX contract for agents.

## S4. Account Management Flows

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

## S5. Investments flows

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

## S6. Loans / Installment flows

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

## S7. Savings flows

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

## S8. Transactions flows

Transactions are the real-money history surface. Primary reference: Copilot
(row density, scan speed, amount hierarchy). Secondary: Monarch (context and
household meaning). Capture speed primary: Monzo.

### List (`/money/transactions`)

- Compact `TopAppBar` detail header (back to Money) + privacy toggle when
  present.
- Filter bar uses shared chips / segmented controls — not a desktop filter
  panel. Preserve scroll position when returning from detail.
- Rows use `TransactionRow`: leading identity (`IconContainer` /
  category visual) + primary label + secondary/meta + right-aligned tabular
  amount with `TransactionAmountTone` (credit / debit / refund / neutral).
- Group by date when the list already does; do not invent new grouping axes.
- `FloatingAction` Add Transaction stays the create entry — never bury create
  at the end of a long list.
- Empty: short explanation + capture CTA. Offline: browse cached; block post.

### Detail / edit / refund / correct

```text
Transaction row → detail → edit | refund | correct → form →
preview-confirm (when consequential) → updated detail
```

- Detail: identity in `TopAppBar`; amount is the dominant fact; account,
  category/jar context, date, and audit actions follow.
- Edit / refund / correct preserve existing routes and confirmation levels from
  `artifacts/ux-redesign/CURRENT/financial-confirmation-model.md`. Do not
  downgrade a preview-confirm action to a silent save for visual simplicity.
- Forms use shared primitives + sticky `BottomActionBar` or
  `SheetActionFooter` depending on whether the flow is a page or sheet today.
  Preserve which overlay type the implementation already uses.

### Capture (`/money/transactions/new`)

```text
FAB → capture form → type → amount → account(s) → category/date if needed →
validate → preview-if-consequential → save → transaction detail
```

- Target ~15 seconds for familiar capture. Default date = today. Optional
  note. Do not force category perfection — Inbox owns unresolved review.
- One primary Save; Cancel/back is escape. Keyboard must not hide amount or
  submit.

---

## S9. Plan / Hũ (Jars) / Goals / Recurring / Ritual

Plan owns intention — not bank balances. Primary references: YNAB (philosophy,
goals, funding, “what money should do”) + Monzo (Hũ interaction simplicity,
sheets). Monarch for household overview composition on the Plan hub.

### Binding meaning

- English **Jar** / Vietnamese **Hũ** = intention envelope.
- Real cash and accounts live in Money.
- Never present jar totals as spendable bank balance.
- Teaching copy already exists: “Hũ là phong bì ý định…” — preserve that
  distinction in every redesign.

### Plan hub (`/plan`)

- Orientation + next planning work: active Hũ pulse, goals progress, recurring
  / calendar / ritual entry points, exception callouts.
- Same DNA as Home, different composition — do not paste Home’s cash-flow chart
  onto Plan.
- One hero max. Intention amounts use `Amount` / `FinancialValue`, not cash
  `Balance`, unless the domain explicitly exposes a ledger balance.

### Hũ list / detail / create (`/plan/jars`, `/plan/jars/[id]`)

```text
Hũ list → detail → edit plan | reallocate → sheet form → confirm →
updated intention (no cash movement)
```

- Rows / cards: `JarCard` — name, kind, state badge, planned amount, budget
  progress when available. Overspent uses danger + label; paused/archived stay
  calm and out of allocation targets.
- Create/edit plan and reallocate use sheets with `SheetActionFooter` when that
  is the current pattern. Archive confirms consequences and moves no money.
- Monzo inspiration stops at interaction clarity. Do not turn Hũ into Pots that
  hold cash.

### Goals (`/plan/goals`, `/plan/goals/[id]`)

```text
Goals list → detail → contribute → amount → confirm → progress
```

- `GoalCard`: name, funded vs target, real progress ratio, status.
- Progress is never decorative — ratio comes from domain data.
- Contribute / edit / archive keep existing confirmation levels.

### Recurring / Calendar / Ritual

- Recurring: scannable schedule rows; create/edit preserve owner routes.
- Calendar: projection readability over dashboard density.
- Ritual: decision/review flow with preview-confirm on lock/approval. Real
  ledger stays unchanged when plan locks.

---

## S9b. Health (read-only)

Health is a **secondary** surface — not a bottom tab. BR-24: read-only. No
writes, no advice, no Copilot-style recommendations to buy/sell/hold.

- Overview + Insights only (`/health`, `/health/insights`).
- Charts may use Copilot-inspired clarity, but copy stays factual: source,
  completeness, freshness. Soften or hide Health until enough facts exist.
- Link back to owning Money/Plan/Inbox surfaces for action — Health never owns
  mutations.

---

## S10. Inbox attention-center pattern

Inbox is the product's **financial attention center**, not a generic notification feed. The queue uses a summary-first composition: contextual `TopAppBar`, a single compact summary surface, Open/Archived tabs, a soft filter surface, and one grouped list of review items. Pending items use semantic identity icons and status treatments; history uses neutral surfaces and remains readable without competing with active work.

Inbox item rows follow the compact hierarchy `[semantic icon] [what needs attention + source context] [amount]`, followed by one kind/status badge and one quiet next-step cue. The whole row is the navigation target for actionable items. The row must not duplicate the primary action with a second large button. Warning is reserved for review-required or due attention; informational milestones use info/success semantics; former-member resources remain neutral and read-only. Meaning must remain available through labels, typography, iconography, and copy, not color alone.

Inbox detail uses the canonical detail pattern: detail TopAppBar with back navigation, a highlighted decision-context surface, one source-context ReviewCard, an amount-is-context alert, compact source facts, an optional owning-domain link, and the existing kind-specific action panel. Inbox does not own Money or Savings movements; those actions continue through their owning application flows.

Loading skeletons mirror the summary, tabs, filter surface, grouped section, and compact item rows. State changes may use `motion/react` for subtle opacity/transform transitions on filtered items only, using shared `motionTokens`/`springs`, SSR-safe initial state, and reduced-motion policy. Do not animate every item on mount, financial values, or layout dimensions.

## S11. Together Collaboration UI Patterns

The Together domain uses a compact, management-oriented presentation inside the centered 440px app shell. The overview leads with one household identity hero, active-member count, current Admin/Partner responsibility context, and one contextual lifecycle notice when needed. Follow with grouped management rows for invitations, policies, household preferences, and account settings; do not use an equal-weight link stack as the primary hierarchy.

Active members use divided rows inside one elevated management surface. Identity is primary, Admin/Partner is responsibility context rather than financial ownership, and a short capability hint clarifies whether the member can manage the household or has ordinary member access. Pending invitations have a distinct warning-toned surface and must never look like active members; show invitee context, pending status, expiry, Copy link, copied feedback, and Revoke only when the actor is allowed.

High-consequence Together actions use the canonical HeroUI-backed `Sheet` with `ActionSheetLayout` and safe-area-aware `SheetActionFooter` where appropriate. Confirmation copy must explain access loss, retained historical/read-only personal resources, Admin continuity, and obligation follow-up without suggesting ownership transfer or money movement. HeroUI owns sheet motion; do not layer Motion over the sheet transition.

Together lifecycle and ownership notices use ordinary household language. Former-member and owner-unavailable contexts belong on canonical Money, Plan, or Inbox resource surfaces rather than being duplicated as financial detail inside Together. Admin responsibility is never described as financial ownership. Solo-Admin continuity remains a contextual warning because household deletion is not a supported V1 action.

Together loading boundaries mirror the loaded hierarchy with the shared `Skeleton` primitive. New Together entry motion uses the existing `MotionReveal` client leaf and shared `useMotionPolicy`; it is limited to calm transform/opacity continuity, is stable-keyed and SSR-safe, and degrades under reduced motion or low-end-device policy. No decorative cascades, loops, animated financial digits, or overlay motion stacking are allowed.

## S12. Brand / Logo

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

## Foundations Do / Don't (quick reminder)

**Do**: consume `Card` tones, `Section`, `Balance`/`Amount`/
`FinancialDelta*`, `Progress`, `StatusBadge`, `BottomActionBar`,
`FloatingAction`, `SectionHeader`, the shared `Skeleton`; map meaning to the
surface table above; keep one hero and one primary action per screen.

**Don't**: raw hex/arbitrary values in features; re-declared card/button
CSS; nested card soup; teal on every accent; green/red for static balances;
warning color for harmless info; new radii/shadows/spacing scales; separate
visual language for forms or admin-ish screens.

---

## 32. ViNha UI/UX anti-patterns

Future agents must avoid:

- Card inside card unnecessarily (“card soup”)
- Too many CTA buttons or equal-weight actions
- Too many colors; teal on every accent
- Excessive shadows or random elevation
- Random border radii or spacing values
- Inconsistent icon styles or a second icon library
- Static-looking screens (stopping at a screenshot)
- Hidden important actions below the fold
- Bottom Sheets without safe-area / footer clearance
- Financial information without context or meaning labels
- Charts without interpretation or fabricated data
- Excessive data density / desktop dashboards in the 440px shell
- Native Select / Date / Time as primary when HeroUI exists
- Breaking existing user flows during visual redesign
- Replacing a Sheet with a page (or vice versa) because a URL does
- Inventing net worth / total money / Reports tab / Health advice
- Treating Hũ as cash Pots
- Seeding mock data or hard-coding money for prettier screenshots
- Running the entire test suite for a small UI tweak (use focused tests)
- Changing Zod / RPC / ledger math to force a layout

---

## 33. AI UI/UX redesign rules

### Rule 1 — UI first

Redesign UI/UX without changing business logic.

### Rule 2 — Never touch user data

Do not modify, delete, reset, seed, or replace real data with mock data.

### Rule 3 — Preserve existing flows

Existing functionality must remain functional, including overlay type and
confirmation level.

### Rule 4 — Inspect before implementing

Always inspect the current implementation before redesigning.

### Rule 5 — Follow the flow

Do not stop at the initial screen. Redesign the complete reachable flow.

### Rule 6 — Use the reference hierarchy

Use Monarch, Monzo, Copilot, and YNAB per the matrix and priority list.

### Rule 7 — Do not blindly copy

References provide principles and patterns, not designs to clone.

### Rule 8 — Preserve ViNha identity

Every redesign must still feel like ViNha / Calm Household Finance.

### Rule 9 — Mobile first

Every UI decision must work on mobile inside the 440px shell.

### Rule 10 — Focused testing

Run only focused / affected UI tests for the changed area — not the entire
suite for every small visual change.

### Rule 11 — Contract STOP

If the redesign appears to require a data, API, auth, validation, or financial
rule change, STOP and document the conflict.

---

## 34. Decision framework

```text
Need product architecture / Home / family / accounts / overview?
        ↓
    Monarch

Need money organization / Hũ interaction / sheets / fast capture?
        ↓
      Monzo

Need visual polish / transactions / charts?
        ↓
     Copilot

Need budgeting / goals / planning philosophy?
        ↓
       YNAB
```

Resolve conflicts with:

```text
ViNha domain rules
  → this SoT
  → existing implemented flow
  → reference URL (inspiration)
  → four-app principles
  → final ViNha design
```

Never copy one reference blindly.
