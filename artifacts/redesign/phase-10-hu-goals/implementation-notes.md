# Phase 10 — Implementation notes

**Status:** Presentation implemented. Browser validation is incomplete (login hydration never enabled submit in this environment). Does not overwrite `.agents/design-system.md`. Next phase is Recurring + Calendar + Ritual — not started.

## What this phase did

Make Hũ and Goals read as **intention**:

> What are we setting money aside for, how much are we aiming for, and what progress or decision matters next?

- Hũ list/detail use scan-first rows and an intention hero (planned / remaining), not a cash account
- Goal list/detail use existing `progressPercent` / funded / target and existing funding links
- Missing budget or progress is not normalized to zero
- Allocation, reallocation, contribute, create, and edit keep existing mutations
- EN/VI copy names intention and keeps cash in Money

## Files changed

- `app/[locale]/(product)/plan/jars/page.tsx` — list hierarchy + `JarCollection` rows
- `app/[locale]/(product)/plan/jars/[id]/page.tsx` — intention hero + metrics only when data exists
- `app/[locale]/(product)/plan/jars/jar-presentations.tsx` — **new** remaining/progress helpers (no new math)
- `app/[locale]/(product)/plan/jars/jar-configuration-form.tsx` — virtual-allocation alert
- `app/[locale]/(product)/plan/jars/reallocate-jar-form.tsx` — intention “available to move” copy
- `app/[locale]/(product)/plan/jars/[id]/loading.tsx` — detail skeleton
- `app/[locale]/(product)/plan/goals/page.tsx` — list hierarchy + `GoalCollection` rows
- `app/[locale]/(product)/plan/goals/[id]/page.tsx` — intention hero + linked-source kinds
- `app/[locale]/(product)/plan/goals/goal-presentations.ts` — **new** open-goal / source helpers
- `app/[locale]/(product)/plan/goals/create-goal-form.tsx` — intention alert; field order unchanged in payload
- `app/[locale]/(product)/plan/goals/[id]/goal-detail-controls.tsx` — linked-to copy; contribute receipt presentation
- `app/[locale]/(product)/plan/goals/[id]/loading.tsx` — detail skeleton
- `app/[locale]/(product)/plan/plan-child-loading.tsx` — list + `PlanIntentionDetailLoading`
- `shared/patterns/jar-card.tsx` / `shared/patterns/goal-card.tsx` — scan-first intention rows
- `messages/en/plan.json` / `messages/vi/plan.json`
- `tests/unit/phase-10-hu-goals-presentation.test.tsx` (new)
- `tests/unit/financial-privacy.test.tsx`
- `tests/e2e/plan-jars.smoke.spec.ts` — copy/testid alignment (still not executed as a full E2E pass)

Plan hub files from Phase 9 remain in the working tree and were not redesigned again. Recurring / Calendar / Ritual were not redesigned.

Not changed: database, Supabase queries, API contracts, jar budget math, goal progress math, allocation rules, validation schemas, mutation payloads, auth, tab set, 440px shell.

## Shared components reused

`TopAppBar`, `Page`, `Section`, `Card`, `EmptyState`, `StatusAlert`, `StatusBadge`, `Amount`, `FinancialValue`, `FinancialNumberKind`, `Progress`, `PlanPrivacyToggle` (existing `FinancialPrivacyToggle`), `Sheet`, `ActionSheetLayout`, `SheetActionFooter`, `Text`, `AppIcon`, `IconContainer`, `PLAN_ICONS` / `ACTION_ICONS`, existing jar/goal forms.

## Local pieces

No new shared financial-number kind.

- `jar-presentations.tsx` — remaining label + existing `usagePercent` gate
- `goal-presentations.ts` — open statuses + first existing funding source name
- `JarIntentionHero` (colocalized on the jar detail page)
- `PlanIntentionDetailLoading`

`JarCard` / `GoalCard` already existed; they now render as rows (`min-h-14`) instead of large per-item cards.

## Intention semantics

| Surface | Kind | Notes |
| --- | --- | --- |
| Hũ planned / remaining / over-by / budget columns | `INTENTION` | Envelope vs plan, `data-financial-object="jar"` |
| Goal funded / target | `INTENTION` | Existing progress, `data-financial-object="goal"` |
| PAYOFF principal totals on a Goal | `CURRENT_STATE` | Money liability, not Goal-owned cash |
| Linked investment market / gain | `ESTIMATE` | Money estimate |
| Contribute / reallocate amounts | `INTENTION` | Existing actions; copy says real money unchanged |

Progress uses existing `JarBudgetMetrics.usagePercent` and `PlanGoal.progressPercent` only.

## Privacy

Reuse `PlanPrivacyToggle`. Amounts wrap `FinancialValue`. `Progress` is `privacyAware`. Row `aria-label` is not stuffed with figures. Tests assert masked leaves and progressbars.

## i18n

EN/VI:

- List context: intention envelopes / ý định
- Empty: create a place for an intention / tạo một chỗ cho ý định — not “first account”
- Linked source hint: Goal does not own the Money source
- Reallocate: remaining intention to move
- Vietnamese keeps Hũ / Mục tiêu product terms; no “budget bucket” calque

## Tests

```bash
npx vitest run tests/unit/phase-10-hu-goals-presentation.test.tsx tests/unit/financial-privacy.test.tsx tests/unit/goal-detail-controls.test.tsx tests/unit/goal-ephemeral-state.test.tsx tests/unit/jar-configuration-form.test.tsx tests/unit/plan-hub-progressive-disclosure.test.tsx tests/unit/plan-ui-polish.test.tsx tests/unit/plan-hub-loading-parity.test.tsx
```

Result: 39 passed.

## Typecheck / lint

- `npx tsc --noEmit` — pass
- ESLint on the Hũ/Goals touch set — pass
- Production build not run (no infrastructure change)

## Conflicts avoided

- Did not add Net Worth / Reports / Total Money / Free to Spend / Ready to Assign / Age of Money / YNAB grid
- Did not make Hũ or Goals into accounts or Monzo-style cash Pots
- Did not invent `allocated / target` or time-to-goal
- Did not add navigation tabs or a desktop dashboard
- Did not seed fake Hũ/Goal records for screenshots
- Did not change contribution into a new ledger transaction
