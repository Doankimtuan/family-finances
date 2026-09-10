# Phase 14 — Implementation notes

**Status:** Presentation implemented. Authenticated browser verification completed on real household data. Does not overwrite `.agents/design-system.md`. Next phase is Auth + Onboarding — not started.

## What this phase did

Make Health answer:

> What do the numbers already in ViNha tell me about my financial situation, without turning that information into advice?

without turning it into a dashboard, coach, score ring, or sixth tab.

## Files changed

### Overview / insights

- `app/[locale]/(product)/health/page.tsx` — context → pulse-or-empty/partial → EMI notice → recorded coverage rows with source links → coverage/limitations → insights link; `ErrorState` on load failure
- `app/[locale]/(product)/health/insights/page.tsx` — context → coverage → recorded notices → coverage scenarios; `ErrorState` on load failure
- `app/[locale]/(product)/health/loading.tsx` — skeleton mirrors context, modest pulse, fact rows, coverage, insights CTA
- `app/[locale]/(product)/health/insights/loading.tsx` — skeleton mirrors coverage + notices + scenarios
- `app/[locale]/(product)/health/health-overview-card.tsx` — elevated pulse card (not hero), existing score, level text, pulse meaning
- `app/[locale]/(product)/health/health-view-insights-action.tsx` — semantic `Link` to `APP_PATH.HEALTH_INSIGHTS`
- `app/[locale]/(product)/health/insights/health-source-link.tsx` — optional `origin` (default remains insights)

### New local components

- `health-presentations.ts` — source path map + `healthSourceHref` (existing query keys)
- `health-fact-row.tsx` — count row + source link
- `health-coverage-card.tsx` — visible/total + missing account/plan flags
- `health-notice-row.tsx` — insight/scenario row
- `health-retry-link.tsx` — read-only retry navigation

### Copy / tests / docs

- `messages/en/health.json` / `messages/vi/health.json`
- `tests/unit/phase-14-health.test.tsx`
- `tests/unit/health-secondary-shell.test.tsx`

Not changed: `modules/health/application/*` pulse, insights builder, queries, constants, readonly contract; Home chip; shared `HealthCard`; navigation tabs; API/DB.

## Route / helper usage

- `APP_PATH.HEALTH`, `HEALTH_INSIGHTS`, `HOME`, `LOGIN`, `ONBOARD`, `INBOX`, `MONEY_ACCOUNTS`, `MONEY_TRANSACTIONS`, `PLAN_JARS`
- `HEALTH_SOURCE_QUERY.ORIGIN` / `FACTOR`
- `HealthSourceKind`, `HealthAssessmentState`
- `PRODUCT_LINK_PREFETCH`

## Read models reused

- `getHealthOverview` / `getHealthDetail`
- Existing `HealthPulse` when `assessHealthPulse` emits it
- Existing `HealthCompleteness`
- Existing `InsightKind` / `ScenarioKind` lists

## Calculations preserved

`computeHealthPulse`, `assessHealthPulse`, `buildHealthInsights`, EMI-complete detection, AI grounding hook. Presentation never calls `computeHealthPulse` and never substitutes `0` for a missing pulse.

## Privacy behavior

Health displays **counts and a 0–100 pulse**, not ledger amounts. No `FinancialValue` / `privacyAware` surface was added because no monetary amount is rendered. Pulse `aria-label` is `{title}: {score} / 100, {level}` — not a currency string. Inbox privacy remains on the Inbox source screen.

## Accessibility

- Detail `TopAppBar` with back labels
- `h1` Health/Insights, `h2` section titles
- Source and insights targets `min-h-11`
- Level meaning is the **Strong/Steady/Starting** label, not color-only (`StatusBadgeTone.NEUTRAL`)
- `ErrorState` uses `role="alert"`
- `MotionReveal` uses shared reduced-motion policy

## Shared components reused

`Page`, `TopAppBar`, `Card`, `EmptyState`, `ErrorState`, `StatusAlert`, `StatusBadge`, `Text`, `Heading` (via `HealthSectionTitle`), `Skeleton`, `AppIcon`, `IconContainer`, `MotionReveal`, `Link`

## Presentation decisions

- Pulse is an elevated card, not a hero ring
- Empty: `EmptyState` + still-visible recorded-count rows (genuine zeros) + coverage/limitations; insights CTA hidden (`NO_VISIBLE_FACTS`)
- Partial: info `StatusAlert`, no pulse card (`health` stays null)
- Load failure: `ErrorState` + retry link to the same route (no new mutation)

## Refactor review

- Source paths live in one `HEALTH_SOURCE_PATH` map
- Domain literals go through `APP_PATH` / `HealthSourceKind` / `HEALTH_SOURCE_QUERY`
- No `?? 0` on Health amounts (none rendered)
- `HealthFacts` stayed inlined so source-order hierarchy tests remain valid
- Home `HealthCard` left unchanged (Home is not this phase)

## Deferred

- Vietnamese wrapping was checked in copy, not by switching the live locale in the browser
- Empty/partial live states were not present on the authenticated household (4 of 4 sources); those branches are covered by implementation + unit tests
- Offline: no Health-specific offline subsystem existed; none was added
