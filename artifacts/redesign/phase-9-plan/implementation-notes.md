# Phase 9 — Implementation notes

**Status:** Presentation implemented. Browser validation is incomplete (login hydration never enabled submit in this environment). Does not overwrite `.agents/design-system.md`. Next phase is Hũ + Goals — not started.

## What this phase did

Make Plan read as **household intention and next decisions**, not a second Money dashboard and not a cash/budget hero.

- Hero is planning context (period + health question), not a giant spendable amount
- Period income is labeled as the month’s planning base and marked `FinancialNumberKind.INTENTION`
- Attention is always on-screen, with a real empty state
- Existing `getPlanRecommendations` output is split into one primary decision + supporting work
- Hũ / Goals on the hub are compact intention rows, not inventory cards
- Recurring / Calendar / Ritual stay entry points
- No FAB was added

## Files changed

- `app/[locale]/(product)/plan/page.tsx` — hub composition only
- `app/[locale]/(product)/plan/plan-hub-hero.tsx` — planning-context hero
- `app/[locale]/(product)/plan/plan-hub-exceptions.tsx` — always-on attention + empty state
- `app/[locale]/(product)/plan/plan-hub-work-row.tsx` — **new** compact intention rows
- `app/[locale]/(product)/plan/plan-destination-row.tsx` — card accepts `description` / `action`
- `app/[locale]/(product)/plan/plan-hub-presentations.ts` — goal/recommendation caps; removed unused health-dot helper
- `app/[locale]/(product)/plan/loading.tsx` — skeleton mirrors the new hierarchy
- `messages/en/plan.json` / `messages/vi/plan.json`
- `tests/unit/phase-9-plan-presentation.test.tsx` (new)
- `tests/unit/plan-ui-polish.test.tsx`
- `tests/unit/plan-hub-progressive-disclosure.test.tsx`
- `tests/unit/plan-hub-loading-parity.test.tsx`
- `tests/unit/plan-hub-query-shape.test.ts`

Not changed: queries, commands, schemas, jar/goal/recurring/calendar/ritual pages, validation, mutations, auth, bottom tabs, app shell width.

## Shared components reused

`TopAppBar`, `Page`, `Section`, `Card`, `EmptyState`, `StatusAlert`, `StatusBadge`, `FinancialValue`, `FinancialNumberKind`, `FinancialPrivacyToggle` (via existing `PlanPrivacyToggle`), `MotionReveal`, `Text`, `AppIcon`, `IconContainer`, `PLAN_ICONS` / `ACTION_ICONS` / `UTILITY_ICONS`, existing `RecommendationList`, `EmergencyInboxBanner`, `PlanOfflineBanner`.

## Local pieces

No new shared financial-number primitive.

- `plan-hub-hero.tsx` — period + health + intention income base
- `plan-hub-exceptions.tsx` — attention list or empty copy
- `plan-hub-work-row.tsx` — scan-first Hũ/Goal row (`PlanHubWorkObject`)
- `plan-destination-row.tsx` — Recurring/Calendar/Ritual rows; card header description
- Presentation caps: `PLAN_HUB_VISIBLE_JAR_LIMIT` (existing 6), `PLAN_HUB_VISIBLE_GOAL_LIMIT` (3), `PLAN_HUB_RECOMMENDATION_LIMIT` (3)

## Presentation-only decisions

- Do not invent a cash hero because Money has one.
- Do not derive assignable / remaining household cash from accounts.
- Keep existing exception and recommendation engines; UI only prioritizes display.
- Extract `jarRemainingLabel` instead of nested ternaries.
- Exception `aria-label` is title + action only — amounts stay in the visible description wrapped by `FinancialValue`.
- Recurring recommendation href uses `planRecurringPath` (no path concatenation).
- Preserve e2e test ids: `plan-hub`, `plan-period-pulse`, `plan-teaching`, `plan-see-jars`, `plan-entry-goals`, `plan-see-goals`, `plan-entry-recurring`, `plan-ritual-open`, `plan-money-link`, `plan-home-recommendations`, `plan-see-calendar`, `plan-ritual-cta`.
- `home.factJars` / `home.factAllocation` labels remain in messages (values still used via `factJarsValue` / `factAllocationValue`); they are unused as standalone labels after the quiet meta line. Left in place to avoid an unrelated i18n sweep.

## Reality / intention boundary

| Surface | Kind | Notes |
| --- | --- | --- |
| Period income | `INTENTION` | Qualifying income for jar rules, not spendable cash |
| Hũ remaining / over-by | `INTENTION` | Budget tracking; `data-financial-object="jar"` |
| Goal funded / target | `INTENTION` | Existing progress; `data-financial-object="goal"` |
| Upcoming amounts | `INTENTION` | Planned / due, not cleared cash |
| Teaching + Money link | copy | Points at Money for real balances |

Health uses icon + title + body, not color alone.

## Privacy

Reuse `PlanPrivacyToggle` → `FinancialPrivacyToggle`. Intention amounts wrap `FinancialValue`. Tests assert masked values are not copied into `aria-label`. Exception row names omit amounts.

## i18n

EN/VI hub copy shifted to household planning language:

- Subtitle: intend / “định dùng tiền”
- Hũ: intended for, not cash in the jar
- Attention / empty / next decision
- Income base (not “qualifying” jargon in the UI)
- Planning tools + calendar meta + finishable review

Teaching body still mentions bank balance so the Money distinction stays testable.

## Tests

```bash
npx vitest run tests/unit/phase-9-plan-presentation.test.tsx tests/unit/plan-ui-polish.test.tsx tests/unit/plan-hub-progressive-disclosure.test.tsx tests/unit/plan-hub-loading-parity.test.tsx tests/unit/plan-hub-query-shape.test.ts
```

Result: 24 passed.

## Typecheck / lint

- `npx tsc --noEmit` — pass
- ESLint on the Plan touch set — pass
- Production build not run (no infrastructure change)

## Conflicts avoided

- Did not add Net Worth / Reports / Total Money / Free to Spend / Ready to Assign / Age of Money / YNAB grid
- Did not add a FAB
- Did not add a period selector (existing period label only)
- Did not load full calendar / recurring / ritual graphs on the hub
- Did not redesign Hũ, Goals, Recurring, Calendar, or Ritual child pages
- Did not seed fake planning data for screenshots
- Did not change recommendation or exception algorithms — only presentation limits already aligned with the existing engine cap
