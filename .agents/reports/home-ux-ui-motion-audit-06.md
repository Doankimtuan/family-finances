# ViNha Home UX, UI, and Motion Audit — 06

## Audit scope and evidence

This is an audit and design-planning report only. No production UI, locale
content, business logic, calculations, database schema, routes, dependencies,
or animation libraries were changed.

Evidence used:

- Prior content reports: `content-foundation-audit.md`,
  `content-foundation-implementation-02a.md`,
  `content-foundation-implementation-02b.md`,
  `content-auth-system-implementation-03.md`,
  `content-onboarding-implementation-04.md`, and
  `content-home-implementation-05.md`.
- Current Home route and components under
  `app/[locale]/(product)/home/`.
- Home read model under `modules/home/application/` and the Health pulse under
  `modules/health/application/`.
- Canonical IA, UX, and design-system artifacts under the three `CURRENT`
  directories.
- Shared shell, patterns, UI primitives, motion tokens, and motion policy.
- Authenticated Chromium inspection of the populated Home state in English at
  390px, 440px, 768px, and 1280px in light mode, plus English dark mode and
  Vietnamese dark mode at 1280px.
- Quarter-period navigation, simulated offline mode, and reduced-motion mode.

Authenticated browser evidence is captured in:

- `output/playwright/home-audit/en-home-390.png`
- `output/playwright/home-audit/en-home-440.png`
- `output/playwright/home-audit/en-home-768.png`
- `output/playwright/home-audit/en-home-1280.png`
- `output/playwright/home-audit/en-home-quarter-440.png`
- `output/playwright/home-audit/en-home-1280-dark.png`
- `output/playwright/home-audit/vi-home-1280-dark.png`
- `output/playwright/home-audit/vi-home-offline-reduced.png`

Day-zero, permission, partial, stale, recoverable-error, and no-transaction
states were not forced through the live account because doing so would require
mutating product data or changing auth/fixtures. Those findings are explicitly
labelled as source/read-model findings below.

## A. Executive summary

### Verdict

Home has a sound product foundation and a truthful financial model, but its
current composition still behaves like a stack of good cards rather than one
coherent household-finance surface. The first viewport is dominated by a long
contextual header, then a period control, then a prominent balance card. The
actual financial answer is visually delayed by repeated explanation and
competing secondary blocks.

The recommended direction is:

> Money now → This period → Needs attention → Plan ahead

Keep the constrained 440px shell, the current financial calculations, the
shared HeroUI/Hugeicons/token system, and the factual copy. Simplify the Home
composition so one dominant amount and one next action carry the screen.

### Highest-impact problems

1. **The header and hero both compete to explain the current period.** The
   header already says whether income meets or exceeds spending, then the
   hero repeats the period net value and status. This creates a 253px English
   header before the financial card at 390/440px.
2. **The first viewport is too vertical for a decision surface.** At 390px the
   header ends around y=273 and the period control starts around y=317; Plan and
   Inbox are below the visible area. The user reaches the primary money answer
   later than necessary.
3. **Plan and Inbox are conditional, independent surfaces.** The page order is
   financial pulse → cash flow → spending → Plan → Inbox, but the visibility of
   the last two changes by data state. This changes the information hierarchy
   between households and hides a clear Inbox state entirely.
4. **The main action is not state-aware enough.** “Add expense” is useful when
   an account exists, but the day-zero version routes to a form that can open
   and cannot save without an account.
5. **The Home state contract is broader than the rendered contract.** The read
   model computes Health and defines stale/partial/permission concepts, but the
   route only renders an offline lane and a generic load error. Missing-source
   and freshness context are not available to users.
6. **Motion is present at every section boundary but does not yet express
   hierarchy.** `MotionReveal` wraps the period control, financial pulse, cash
   flow, spending, Plan, and Inbox independently. This creates a cascading
   page feel without a corresponding user task.
7. **The chart is readable but over-allocates vertical space relative to its
   decision value.** The 160px plot plus labels and explanation is useful for
   inspection, but it pushes the category and attention sections farther down
   the first-use surface.

### Target experience

ViNha Home should feel like a warm, premium consumer-finance overview: one
clear current-position answer, one period story, one attention lane, and one
quiet route into planning. Visual variance should stay around 4/10 and density
around 5/10. Motion should stay around 3–4/10 and communicate state, feedback,
or continuity only.

## B. Current Home map

Source: `app/[locale]/(product)/home/page.tsx` and the Home components in the
same directory.

| Current order     | User purpose                                       | Data dependency                                            | Current action/state behavior                                                                                    | Current UX problem                                                                                                                                                               |
| ----------------- | -------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contextual header | Orient the user and describe the current period    | Greeting period, dashboard, cash-flow metrics, Inbox count | Shows greeting + Home, cash-flow headline, supporting sentence, account/Inbox metadata, and a pending Inbox pill | Too tall; headline is a conclusion before the dominant numbers; Inbox count is represented twice when pending                                                                    |
| Offline lane      | Explain that writes are unavailable                | Client online status                                       | Hidden while online; appears above facts when offline                                                            | Correct behavior, but it is a mutation warning rather than a Home data-freshness model                                                                                           |
| Error lane        | Recover from core dashboard failure                | `dashboard == null`                                        | Full-width alert plus full-width retry                                                                           | Core failure is correctly visible, but partial source failure is collapsed into the same contract or hidden                                                                      |
| Period control    | Change Month/Quarter                               | URL search param and server reload                         | Month/Quarter `FilterChip` buttons, optimistic pending state, skeleton replacement                               | Controls only the changing data, but the pending replacement is large and the controls are only 40px high                                                                        |
| Financial pulse   | Show real account balance and period net cash flow | `realBalance`, `financialMetrics`, currency                | Dominant balance, Add expense, net flow, status badge, optional prior-period comparison                          | Strongest block, but it is visually preceded by too much header context and contains two competing financial answers without a clear label hierarchy                             |
| Cash-flow section | Explain income and expense movement                | Income, expense, net, trend points                         | Three metric columns, 160px AreaChart, tooltip, chart summary                                                    | Good data truthfulness and text summary; chart and prose are dense at 390px; no direct accessible point-by-point equivalent                                                      |
| Spending section  | Explain where expenses go                          | Top four spending categories                               | Category icon, name, progress bar, amount, percent, prior-period insight                                         | Good ranking, but zero-percent categories appear as if meaningful; only top four are shown without a compact “other” treatment; section has no destination action                |
| Plan pulse        | Route to planning work                             | Active Jar count and allocation mode                       | Conditional surface with active jar count and Open Plan link                                                     | Only visible when active Jars exist; appears after analytics even though it represents future action; uses a bespoke link treatment instead of the shared section/action pattern |
| Inbox block       | Route to review work                               | Open Inbox count                                           | Conditional surface; count; full-width Open Inbox button                                                         | Important attention work appears below Plan; it disappears entirely when clear; pending count is repeated in header, badge, and block                                            |
| Bottom navigation | Persistent top-level navigation                    | Shared five-tab registry                                   | Home, Money, Plan, Inbox, Together; 44px+ navigation targets and active motion indicator                         | Strong shell contract; the Inbox badge adds another attention signal to an already count-heavy Home                                                                              |

### Read-model facts

`getHomeDashboard` loads position, Plan pulse, Inbox, and transactions in
parallel. Position, Plan, and Inbox are core; transaction analytics degrade to
`financialMetrics: null`. The page uses `accountCount === 0 && activeJarCount ===
0` for day-zero. The read model computes `health`, but `page.tsx` does not pass
it to `HomeHealthChip` or render a Health summary.

The displayed balance is the total of active liquid accounts and excludes
credit cards. Net cash flow is income minus expense; transfers and refunds are
excluded. The UI copy is correctly aligned with these facts and must remain so.

## C. Proposed information architecture

### Exact recommended hierarchy

1. **Money now**
   - Compact Home orientation line.
   - Active status qualifier only when needed.
   - Period control.
   - One dominant `Total across accounts` / `Tổng số dư các tài khoản` amount.
   - One compact period net-cash-flow supporting fact.
   - One state-aware primary action: Add expense when an account exists; Add
     account when it does not.
2. **This period**
   - Cash-flow summary: income, expense, net.
   - Cash-flow trend as supporting visualization, not a second hero.
   - Spending ranking with amount first, share second, and a clear
     uncategorized treatment.
3. **Needs attention**
   - Inbox summary appears in a stable location.
   - Pending state gets one primary Open Inbox action.
   - Clear state becomes a quiet one-line confirmation or is omitted only when
     the page is already at the maximum useful density.
   - Offline/stale/partial/permission qualifiers stay near the affected facts
     unless the whole screen is unavailable.
4. **Plan ahead**
   - Compact Plan summary, with active Jar count and allocation mode.
   - Open Plan remains a secondary destination action.
   - Setup-needed state uses a setup action rather than a pseudo-health score.

This preserves the current data model and cross-module routes. It changes the
order and prominence, not the calculations.

### Why this hierarchy

The user first needs orientation about current spendable position, then an
explanation of the selected period, then a decision queue, then planning. Plan
is important but not more urgent than an open Inbox item. A stable “Needs
attention” location also prevents the page from changing its conceptual shape
when Inbox is empty.

### What should not be added

- No new net-worth, savings-rate, debt-health, or investment metric.
- No new composite financial-health score.
- No desktop dashboard columns.
- No new chart merely to fill empty space.

## D. Hero recommendation

### Recommendation

Keep `Total across accounts` as the single strongest number. It is the most
reliable immediate orientation fact and is already computed by the real-position
query. Keep the period net cash flow in the same bounded financial summary as a
supporting value, but make it visibly secondary.

### Recommended top structure

```text
Good afternoon · Home                         optional, one line
This period                                    compact orientation
[offline / stale / partial qualifier]         only when active
[Month] [Quarter]                             period control

Total across accounts                         section label
₫1,889,655                                    one dominant amount
2 accounts · excludes credit cards            compact meaning/freshness
Net cash flow this month   ₫4,825,766          supporting value
[Add expense]                                 one primary contextual action
```

Specific changes:

- Remove the long cash-flow conclusion from the header. Let the amount and
  supporting net flow communicate the current situation, with the positive or
  attention badge in the financial block.
- Keep a greeting only as a small eyebrow if it helps the product feel human;
  remove the second explanatory paragraph when the same information is visible
  immediately below.
- Do not show both the header Inbox pill and a full Inbox count block for the
  same pending count. Keep the count in the stable Needs attention section;
  the header may carry a small status marker only when the attention lane is
  not immediately visible.
- Keep `Add expense` adjacent to the balance only when `accountCount > 0`.
  Otherwise show the account-setup action described in Section E.
- Add freshness/source metadata only when the data contract has a real
  timestamp/source. Do not invent a timestamp from render time.

### Above-the-fold target

At 390px, the period control and the complete balance summary should be visible
within the first viewport after the compact header. Cash flow may begin below
that boundary. Plan and Inbox do not need to be visible above the fold, but the
user should not need to parse a long narrative header before seeing the money
answer.

## E. Day-zero recommendation

### Current problem

`HomeDayZeroTrio` offers Invite a member, Set up Plan, and Add an expense. The
Add expense action routes to `APP_PATH.MONEY_ADD`, but the capture form defaults
to an empty account ID when no accounts exist and rejects submission with the
`NO_ACCOUNT` error. This is a valid route with an invalid first-use path.

### Recommended first-use flow

```text
No account + no active Jar
        |
        v
1. Add an account / open Money hub
        |
        v
2. Set up Plan (optional next step, recommended after account)
        |
        v
3. Add expense or income
        |
        v
4. Invite a member whenever the household is ready
```

### Action order and rationale

1. **Primary: Add an account.** A real account is the minimum prerequisite for
   recording a real transaction. Use the existing Money/account creation
   capability and route; do not invent a new onboarding backend.
2. **Secondary: Set up Plan.** Plan is useful after the user has a place to
   track money. It can remain independently skippable.
3. **Contextual: Add expense/income.** Show this only after an account exists,
   or route it through an account-setup guard that completes account creation
   before returning to capture. The latter is a product decision and should
   not be implied by a dead-end link.
4. **Secondary/destination-only: Invite a member.** Invitation is optional and
   should not precede the household’s first usable financial record unless the
   product explicitly prioritizes collaboration.

### Avoid a forced wizard

Use a clear ordered setup panel with independent actions, not a new mandatory
wizard. Existing onboarding already creates a household, one cash account, and
starter Jars. Day-zero is a later incomplete-household state and should not
duplicate onboarding behavior.

## F. Action hierarchy

| Action                          | Classification             | Recommendation                                                                                                                               |
| ------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Add account in day-zero         | Primary                    | Make the first day-zero CTA. Use the existing Money/account creation entry.                                                                  |
| Add expense/income with account | Primary contextual         | Keep beside the current position. Use one clear label for the capture entry.                                                                 |
| Open Inbox with pending items   | Primary attention          | Use one action in the Needs attention section. Do not compete with capture in the same visual treatment.                                     |
| Open Plan                       | Secondary destination      | Keep as a text or compact button action in Plan ahead.                                                                                       |
| Set up Plan in day-zero         | Secondary setup            | Keep after account setup in visual order.                                                                                                    |
| Invite member                   | Secondary/destination-only | Keep available but visually quiet; it is not required for first financial value.                                                             |
| Period selector                 | Contextual control         | Keep above period-dependent facts; it is not a CTA. Preserve URL state.                                                                      |
| View all                        | Destination-only           | Add only if the section exposes a truncated list and the destination is clear. Do not add generic View all to current single-summary blocks. |
| Retry                           | Recovery action            | Use locally for the affected source when source identity exists; full reload is acceptable only for whole-screen failure.                    |

There should be at most one visually primary action per Home state. The
current `Open Inbox` button can be primary when there are pending items; it
should not look like a second global primary CTA when capture is available.

## G. State model

### Recommended model

Use one screen-level availability state with independent section states:

```text
Home screen
├── loading
├── unavailable (core position/Plan/Inbox or money gate failed)
└── ready
    ├── freshness: current | stale | offline-read-only
    ├── position: ready | setup-required
    ├── period: ready | no-reportable-activity | unavailable
    ├── attention: clear | pending | unavailable
    └── plan: configured | setup-required | unavailable
```

Permission is a screen-level unavailable state only when the membership/money
gate prevents the read model. If only one source is permission-limited, show a
section-level qualifier and preserve the facts that are still valid.

### State rendering rules

| State                       | Scope                                      | UI treatment                                                                                                                                               |
| --------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Starting/loading            | Whole screen                               | Existing structural skeleton; reserve the top header and hero shapes. Avoid replacing every section with oversized unrelated blocks.                       |
| Populated/current           | Whole screen                               | Normal hierarchy. No status banner.                                                                                                                        |
| Positive/negative cash flow | Financial block                            | Status badge and factual copy near net flow. Do not style the whole screen as success or danger.                                                           |
| No reportable transactions  | Period section                             | Keep the real balance; replace cash-flow chart with a compact no-activity explanation and a capture/setup action. Do not hide the entire Home.             |
| Offline                     | Whole screen qualifier                     | Keep readable cached/currently rendered facts; show the existing warning lane; disable write actions. Do not animate the warning.                          |
| Stale                       | Affected section                           | Show source and last-updated time only when supplied by the source contract; otherwise do not claim stale state. Retry the affected source where possible. |
| Partial                     | Affected section or compact page qualifier | Name the missing source only when the read model provides it. Preserve available balance and attention data.                                               |
| Permission                  | Whole screen or affected section           | Explain the access consequence and route to Together/admin help. Do not show a generic failure if some data is still readable.                             |
| Recoverable error           | Affected section                           | Inline error plus targeted retry. Full-width error only when the core dashboard cannot render.                                                             |

### Current gaps

- `HomeStatusLaneKind` already defines stale, partial, permission, and error,
  but the route does not select those states from a source-backed contract.
- `financialMetrics: null` indicates transaction analytics failed, but it does
  not identify the missing source or expose freshness.
- Retry currently falls back to `window.location.reload()`, which is broad for
  a single analytics failure.

Do not solve these gaps with copy alone. Add source/freshness metadata only as
part of a read-model contract decision.

## H. Financial visualization recommendations

### Cash flow

Keep the current income/expense AreaChart for the selected period. The current
data model already compresses quarters to weekly points and months to daily
points, which is appropriate for the constrained width.

Recommended changes:

- Keep the three summary values above the chart, but give Net a clearer visual
  relationship to the hero’s period value instead of presenting it as a third
  equal KPI.
- At 390px, reduce chart chrome before reducing the usable plot: keep the
  current 160px plot only if the category/attention sections are brought
  higher by simplifying the header. Otherwise make the chart a compact
  supporting trend using the existing tokenized chart height.
- Keep X-axis labels sparse. The live 390px view shows six labels across the
  plot; that is acceptable, but labels should remain date-only and should not
  compete with the text summary.
- Preserve the tooltip for pointer users, but provide a hidden or visually
  available data table/list equivalent for keyboard and screen-reader users.
  `role="img"` plus an aria summary is not enough to inspect individual points.
- Do not add an axis legend if the adjacent Income/Expense values already
  explain the two lines. If a legend is added, use text plus color and not color
  alone.
- Keep `isAnimationActive={false}` for initial rendering. If period changes are
  animated later, use a short crossfade of the chart container or a tokenized
  opacity transition; do not draw lines slowly or animate the graph as a
  financial narrative.

### Spending

Keep the current top-four ranking and progress bars; the calculation is not in
scope for change.

Recommended changes:

- Make amount the primary row value and percentage the supporting value.
- Keep the category name visible without truncation when possible. If a long
  localized name must truncate, expose its full accessible label.
- Treat Uncategorized as a first-class category with a neutral icon and a
  clear name; do not use a warning tone unless the product decides
  uncategorized spending requires action.
- Do not show a `0%` category as a meaningful visual bar. If the source can
  produce a tiny non-zero value that rounds to 0%, use a locale-aware
  less-than-one-percent label or leave the current value but ensure the bar
  does not imply a substantive share.
- If four categories are shown, either add a calculated “Other” row only when
  the existing data model supports it or omit the row. Do not invent an
  uncomputed remainder.
- Add a destination action only if the spending detail route is an actual
  supported destination; do not add a dead-end “View all.”

## I. Health recommendation

### Recommendation: remove Health from Home as a score

Do not render `HomeHealthChip` on Home in its current form. The current
`computeHealthPulse` score is based on account existence, active Jar count, and
open Inbox count. It does not measure financial wellbeing, adequacy, debt,
returns, emergency readiness, or transaction quality. A 0–100 score would
create unsupported meaning and compete with the real financial facts.

Keep Health as a secondary read-only destination under the existing Health
route. When Home needs to help an incomplete household, use a compact
**Setup status** block with explicit missing setup facts and direct setup
actions. That is a setup-completeness pattern, not a score and not financial
health.

The unused `health` field in the Home read model should either be removed from
the Home contract or deliberately repurposed as setup completeness in a later
implementation. Do not add a new Home-only health abstraction.

## J. Visual direction

### Direction

Keep the existing Calm Household Finance direction: warm neutral canvas, deep
teal primary action, semantic income/expense/warning colors, tabular money
numerals, soft surfaces, moderate density, and a constrained mobile canvas.
The current live screen already feels more like a calm consumer finance app
than an enterprise dashboard; the generic feeling comes mainly from repeated
bounded metric blocks and the long header, not from the color foundation.

The design-system artifact mentions Phosphor in its icon personality section,
but the repository constitution makes Hugeicons Free Stroke Rounded rendered
through `AppIcon` canonical. Keep Hugeicons; do not introduce or switch icon
packages.

### Typography

| Role                 | Recommendation                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page/header identity | Compact 24–30px semibold only when needed; avoid a long sentence as a 3-line H1.                                                                      |
| Hero money value     | One dominant tabular amount, semibold, with visible meaning directly above or in the same region. Existing `Balance` is the right semantic primitive. |
| Supporting net flow  | One step below the hero amount; tabular; semantic tone only for the status, not necessarily the whole number.                                         |
| Section headings     | Existing 18–22px semibold contract. Use sentence case and short titles.                                                                               |
| Labels/helper text   | 12–15px secondary tone; keep explanations to one or two lines at 390px.                                                                               |
| Metadata             | Compact 12–13px, wrap instead of clipping; use tabular numerals for counts and dates.                                                                 |

Use `text-wrap: balance` for the short header/section titles and `text-wrap:
pretty` for short descriptions. The live English header wraps to three lines;
the Vietnamese equivalent wraps to two lines at the same constrained width.
This is a reason to shorten the content, not to force a smaller font.

### Surfaces, shape, and elevation

- Use the existing 12px card radius and 10px control radius. Keep concentric
  nested surfaces optically coherent; do not stack rounded surfaces around
  every metric.
- Reserve the prominent tinted surface for the current position hero only.
- Use plain sections or soft tonal grouping for cash flow, spending, Plan, and
  Inbox. Avoid five visually equivalent cards.
- Prefer borders and spacing for containment. Use elevation-1 only for the
  hero, interactive objects, or an actually floating control.
- Keep pills for period filters and compact state labels. The current screen
  already has a header pill, status badge, filter chips, and navigation badge;
  do not add more pill-shaped elements to section content.

### Financial emphasis

- Balance: deepest text contrast and largest type.
- Net cash flow: strong but subordinate; label its period.
- Income/expense: semantic colors in the summary row and chart lines; do not
  tint whole surfaces.
- Warnings: factual amber/danger token near the affected action; never color a
  whole Home state because spending is negative.
- Neutral/setup values: secondary text and soft surfaces.

### Polish findings: before/after

| Principle       | Current Home                                                                | Recommended Home                                                                                        |
| --------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Hierarchy       | Contextual headline, balance, net, chart, spending, Plan, Inbox all compete | Balance is the only hero; period story, attention, and Plan are progressively quieter                   |
| Text wrapping   | Long English H1 occupies three lines at 390px                               | Short header identity; balanced short titles; descriptions capped to useful context                     |
| Surface use     | Prominent hero plus multiple surface KPI blocks                             | One prominent hero; sections/rows do most grouping                                                      |
| Dynamic numbers | Money values already use `tabular-nums`                                     | Preserve it; add accessible meaning and do not animate financial values                                 |
| Hit areas       | Period chips are 40px high                                                  | Raise feature filter targets to the 44px product contract                                               |
| Motion scope    | Each section has independent `MotionReveal`                                 | Animate only the page-level entry and meaningful content swap                                           |
| Chart motion    | Initial chart animation is correctly disabled                               | Keep initial static; use only short tokenized crossfade on period replacement if it improves continuity |

## K. Motion foundation

The repository already uses `motion/react` with shared tokens in
`shared/motion/tokens.ts`, `useMotionPolicy`, reduced-motion handling, and
low-end device gating. Do not add another motion library or define Home-local
durations.

### Recommended Home motion tokens

Use the existing token names and values:

| Purpose               | Existing token                                              | Home use                                                                |
| --------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Micro interaction     | `motionTokens.duration.instant` / `fast`                    | Press feedback, icon/state swap, selected period feedback               |
| Standard enter        | `motionTokens.duration.normal` + `motionTokens.distance.sm` | One page-level or section-group enter                                   |
| Emphasized transition | `motionTokens.duration.slow`                                | Period content crossfade only if needed; no slow money count-up         |
| Exit                  | `motionTokens.duration.fast`                                | Compact section disappearance or status removal; quieter than enter     |
| Easing                | `motionTokens.easing.standard`                              | Default Home transitions                                                |
| Direct manipulation   | `springs.snappy`                                            | Buttons/chips or existing shared controls where motion is already owned |

Motion intensity target: **3–4/10**.

### Principles

Motion must communicate responsiveness, hierarchy, state change, or spatial
continuity. It should never decorate financial data or imply that positive
cash flow is celebratory.

## L. Home motion map

| Interaction      | Recommendation              | Exact behavior                                                                                                                                                                                                                                                                           |
| ---------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page entry       | Reduce current cascade      | One subtle grouped enter for the header/hero region; do not stagger every Home block. Use existing reveal variants and `viewport={{ once: true }}` only for content genuinely below the fold.                                                                                            |
| Period change    | Preserve spatial continuity | Keep the period control immediately responsive. Replace only period-dependent content. Use a short opacity crossfade or stable skeleton; do not animate layout height or count values. `AnimatePresence` must have a stable key and explicit exit if conditional swapping is introduced. |
| Money values     | No roulette/counter motion  | Replace values when the server result arrives. Tabular numerals prevent width jitter. A numeric count animation adds little comprehension and should be skipped.                                                                                                                         |
| Cash-flow chart  | Static initial render       | On period change, crossfade the chart region at most. Do not draw the line slowly or animate an empty chart into a full chart.                                                                                                                                                           |
| Spending bars    | Minimal state change        | Keep the existing tokenized `scaleX` progress behavior if it is already shared; disable non-essential motion on low-end/reduced-motion devices. Do not animate each row sequentially on every refresh.                                                                                   |
| Expand/collapse  | If added later              | Use one shared pattern with opacity plus transform; avoid animating height/margin. `AnimatePresence`, stable key, and explicit exit are required.                                                                                                                                        |
| Status lane      | Calm and immediate          | Offline/stale/permission/error messages appear with no bounce or scale. An opacity-only transition is sufficient; removal may be instant under reduced motion.                                                                                                                           |
| Press feedback   | Keep shared behavior        | Use the existing press scale and explicit transition properties from Button/FilterChip. Do not add feature-local hover transforms.                                                                                                                                                       |
| Success feedback | No Home celebration         | Transaction success belongs to the capture receipt. Home may update when returning, but should not celebrate normal navigation or refresh.                                                                                                                                               |

Current `MotionReveal` use in `page.tsx` is the main simplification target:
seven independent wrappers are more motion than the screen needs. This is an
implementation concern for a later pass, not a recommendation to remove the
shared primitive globally.

## M. Reduced-motion rules

When `prefers-reduced-motion: reduce` is active:

- Period changes are immediate or opacity-only at the existing instant token.
- No translate, scale, layout movement, chart draw-on, number count-up, or
  bouncing empty state.
- Offline, stale, permission, and error states appear immediately.
- Skeletons are static or use the existing reduced-motion behavior.
- Press feedback remains understandable through color/focus/pressed state,
  without transform.
- The page must retain the same layout footprint so removing motion does not
  cause orientation loss or content shift.

The live reduced-motion/offline check preserved the Home content and showed the
offline lane without decorative motion. Keep this behavior as a regression
requirement.

## N. Shared component opportunities

Promote only patterns with at least three clear consumers. Recommended order:

1. **MoneySummary / current-position hero** — Home and Money already share the
   need for one dominant real-money value plus meaning and supporting metadata.
   Keep real balance, plan amount, and estimates as distinct variants.
2. **Status lane / freshness qualifier** — Home, Money, Plan, and Inbox all
   need offline and recoverable-source states. The shared primitive should own
   severity, retry placement, and reduced-motion behavior; the feature owns
   source-specific content.
3. **Section header** — already exists and should replace bespoke Plan link
   composition where a section action is needed.
4. **Chart container with accessible summary slot** — promote only after Home
   defines the text-equivalent data contract. Do not abstract Recharts itself.
5. **Setup status block** — promote only after the Home Health score decision is
   made. It should represent explicit missing setup facts, not a generic score.

Do not create a generic “dashboard card”, “animated number”, or configurable
Home section engine. Existing `KpiBlock`, `Section`, `Balance`, `Progress`,
`StatusAlert`, `FilterChip`, and `MotionReveal` cover most implementation needs.

## O. Accessibility findings

### P0 — required before calling the redesign complete

1. **Day-zero action correctness.** Do not expose Add expense as an actionable
   first CTA when no account exists. A route that cannot save is an accessible
   interaction failure, not only a hierarchy issue.
2. **Chart semantics.** Preserve the accessible chart label and add a usable
   text/list equivalent for individual period points. `role="img"` and a
   summary sentence alone do not expose the chart’s data to non-visual users.
3. **Financial meaning.** Ensure the hero amount is announced as the total
   across active accounts, excluding credit cards, and that net cash flow
   includes its period. Do not announce a bare formatted amount.

### P1 — high priority

4. **Filter hit area.** `FilterChip` currently uses `min-h-10` (40px), below
   the repository’s 44px target. Raise the shared primitive or document a
   deliberate exception; Home should not add a local override first.
5. **Status duplication.** Avoid announcing the same Inbox count in the header,
   Home block, and bottom-nav badge in one screen-reader traversal unless each
   occurrence has a distinct purpose.
6. **Locale wrapping.** Keep English and Vietnamese labels flexible. The live
   Vietnamese Home fit at 1280px constrained-shell inspection, but the long
   English headline became three lines at 390px. Shorten the headline rather
   than clipping or shrinking below the typography contract.

### P2 — verify in implementation

7. Test keyboard focus order from header → period → hero action → period story
   → attention → Plan → bottom navigation.
8. Verify chart tooltip access on keyboard and touch; hover-only information
   must not be the only way to inspect a point.
9. Verify focus rings in light/dark themes and when buttons are disabled
   offline.
10. Keep status color paired with text; positive/attention meaning must never
    depend on color alone.

## P. Performance findings

### Existing strengths

- The Home read model loads independent sources in parallel.
- The shell is a single scroll owner and stays at a 440px maximum.
- `motion/react` is already gated by reduced motion and low-end policy.
- Recharts initial Area animations are disabled.
- Financial values use stable formatting and tabular numerals.

### Risks and recommendations

| Priority | Risk                                                                          | Recommendation                                                                                                      |
| -------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| P1       | Seven `MotionReveal` client leaves on one page                                | Keep one grouped entrance and only reveal content that benefits from spatial orientation. Do not add more wrappers. |
| P1       | Period pending replaces all changing content with three large skeleton blocks | Preserve the hero footprint and use a local pending state for period data. Avoid unnecessary layout shifts.         |
| P1       | Recharts plus tooltip and gradient work on a high-frequency screen            | Keep one chart; disable initial animation; avoid expensive blur, shadow, and chart decoration.                      |
| P2       | Full page reload is the fallback retry for any status lane                    | Use source-targeted retry when the read model can identify the failed source; keep reload for whole-screen failure. |
| P2       | Large visual header delays useful content but does not cost CPU               | Remove redundant text; this is a comprehension and scroll-cost optimization.                                        |
| P3       | Numeric animation could add rerenders and visual instability                  | Do not add a counter. Render formatted server values directly.                                                      |

No speculative memoization or client-state rewrite is warranted from this
audit. Measure before optimizing further.

## Q. Responsive findings

### 390px

- Live shell width is 390px with 16px page gutters.
- English header occupies roughly y=20–273 before the period control at y=317.
- Balance, chart, and spending fit horizontally without observed clipping.
- The chart’s six date labels and 160px plot remain readable, but the long
  header and chart explanation push Plan/Inbox far below the first viewport.
- Long currency values fit in the tested populated state; preserve truncation
  safety for larger values and Vietnamese formatting.
- Period controls are 40px high and should move to the 44px contract.

### 440px

- The product uses the intended full 440px shell, 16px gutters, and 76px
  bottom-navigation region.
- Header metadata fits on one row in the tested English populated state.
- Plan and Inbox still sit below the first viewport; this is hierarchy/scroll
  cost, not a desktop layout issue.

### 768px

- The live shell remains exactly 440px wide and is centered at x=164.
- No desktop columns or expansion occur, matching the product constitution.
- Keep this behavior. Do not make Home a tablet dashboard.

### 1280px

- The live shell remains exactly 440px wide and is centered at x=420.
- The constrained canvas reads intentionally as a mobile product surface.
- Desktop background atmosphere and shell elevation are appropriate; they
  should not become a second information hierarchy around Home.

### Layout rules

- Continue using `Page` and `--page-gutter`; do not add per-breakpoint gutters.
- Let localized text wrap naturally; use balanced short titles and pretty body
  wrapping rather than fixed heights.
- Keep the chart responsive within the shell and avoid a min-width that forces
  horizontal scrolling.
- Maintain 44px targets for filters, buttons, navigation, and any new action.
- Let account counts, statuses, and source metadata wrap at row boundaries.

## R. UX issues requiring product decisions

These are not safe to resolve by styling alone:

1. **Day-zero account destination.** Should the first action open Money hub,
   account creation directly, or a small account-setup sheet? The current
   system supports account creation, but the exact Home entry is a product
   choice.
2. **Capture with no account.** Should the route be guarded and return to Home,
   or should the capture flow own account setup? Do not leave a dead-end CTA.
3. **Plan order.** Is Plan setup intentionally required after account setup,
   or can users record transactions before creating Jars? The current capture
   form permits a nullable Jar, so an account-first flow is technically
   compatible.
4. **Inbox clear state.** Should a clear Inbox remain as a quiet Home row or
   disappear to reduce density? The recommendation is stable location when
   the product wants attention to be a predictable section.
5. **Freshness contract.** Which sources provide `lastUpdatedAt`, what counts
   as stale, and can a retry target one source? Current copy cannot answer
   this.
6. **Partial-data contract.** Which source names may be shown to users and
   where should a missing source link? Current `financialMetrics: null` is not
   sufficient.
7. **Health ownership.** Should Health remain a secondary standalone product
   route with no Home teaser, or should setup completeness become a Home-only
   pattern? The recommended direction is no score on Home.
8. **Spending remainder.** Is a fourth-row “Other” category desired, and is
   it already computed by an authoritative source? Do not derive it in the
   presentation layer without a product decision.

## S. Implementation plan

No implementation is included in this audit. The safest later sequence is:

1. **Home hierarchy/layout**
   - Shorten the contextual header composition.
   - Reorder populated Home into Money now → This period → Needs attention →
     Plan ahead.
   - Keep the 440px shell, routes, calculations, and existing i18n keys.
2. **Shared visual primitives**
   - Reuse `Balance`, `KpiBlock`, `SectionHeader`, `Section`, `Button`,
     `FilterChip`, `StatusAlert`, `StatusBadge`, and `AppIcon`.
   - Raise `FilterChip` to the shared 44px target if the change is acceptable
     across its existing consumers.
   - Remove bespoke Plan-link treatment only where the shared action contract
     fits.
3. **Home card/section polish**
   - Make the balance hero the only prominent surface.
   - Reduce nested surfaces and duplicated count treatments.
   - Apply balanced/prettier text wrapping and preserve tabular values.
4. **Chart/financial visualization polish**
   - Preserve calculations and point granularity.
   - Tighten chart chrome only after hierarchy changes are measured.
   - Add an accessible point-by-point equivalent.
5. **Day-zero/state improvements**
   - Resolve the account-first action and capture guard product decision.
   - Add source/freshness metadata only after read-model contracts exist.
   - Render partial/stale/permission states at their correct scope.
6. **Motion foundation alignment**
   - Keep `motion/react`, existing tokens, `useMotionPolicy`, and reduced-motion
     behavior.
   - Reduce independent Home reveals; do not add a second motion system.
7. **Home motion application**
   - Add only grouped entry and purposeful period/status transitions.
   - Use stable keys and explicit exits for conditional content.
   - Keep money values and sensitive warnings static.
8. **Accessibility/performance pass**
   - Verify chart semantics, financial announcements, focus order, 44px targets,
     reduced motion, and no unnecessary rerenders/layout shifts.
9. **Browser regression**
   - Verify authenticated Home at 390px, 440px, 768px, and 1280px.
   - Verify English/Vietnamese, light/dark, offline, reduced motion, period
     switch, keyboard focus, and a representative error/empty/day-zero fixture.
   - Keep screenshots and state evidence with the implementation report.

## Final recommendation

Implement the hierarchy and day-zero correction before adding motion. The
current product already has enough visual language and motion infrastructure;
the highest return is removing competing hierarchy, making the first action
valid, and giving each state one clear scope. Add more animation or new
primitives only if browser evidence after that pass shows a specific remaining
comprehension problem.
