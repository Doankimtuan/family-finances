# Plan Performance Phase 2 — Progressive Goal Detail Rendering

**Date:** 2026-10-11  
**Status:** Structural changes complete; runtime performance unverified.

## Previous dependency graph

```text
Session and membership gate
  └─ Promise.all(getTranslations, getGoal(id))
       └─ Promise.all(listGoalFundingOptions, listGoals)
            └─ Goal Detail page
                 ├─ Header and identity
                 ├─ Target and authoritative progress
                 ├─ Funding summary and linked sources
                 └─ All action controls
```

The selected goal was awaited first. Then the route awaited action-reference
queries before returning the page, so the goal header, progress, source summary,
linked-source rows, and controls shared the slowest action read.

## New dependency graph

```text
Session and membership gate
  └─ Promise.all(getTranslations, getGoal(id))
       ├─ Missing/unauthorized → existing unavailable state; no secondary reads
       └─ Authorized goal
            ├─ Start listGoalFundingOptions(goalType, goalId)
            ├─ Start listGoals()
            ├─ Header, target, progress, funding summary, linked-source rows
            │    └─ getGoal(id) only
            └─ Suspense(fallback: null)
                 └─ GoalDetailActionContent awaits both action-reference reads
                      └─ GoalDetailControls
```

The action reads start together as soon as `getGoal()` succeeds. The source
rows and the aggregate funding presentation both use that same selected-goal
result and sit outside the action boundary. The existing row visibility and
missing-backing warning conditions are preserved through `isOpenGoal()`.

## Authoritative goal data contract

`getGoal(id)` remains the sole direct selected-goal detail call from the page.
Its `GoalDetail` result supplies identity, target, status/type, links,
funded amount, progress percentage, funding quality, funding summary,
household, and currency. The page does not recalculate progress or fetch
financial values in the browser.

`getGoal()` still maps selected-goal links through the existing source readers
and `deriveGoalFundingSummary()`. Linked progress remains based on authoritative
active-source values and existing quality states. Legacy unlinked goals retain
their stored contribution behavior. Unknown or incomplete values are not
reinterpreted as confirmed money.

## Action readiness and failure behavior

- `GoalDetailActionContent` waits for both option reads before creating the
  client action controls. The hero and source presentation do not unmount when
  that boundary resolves.
- Null funding options become an empty link-option list; null goal lists become
  empty reassignment targets. Those failures cannot enable link or
  reassignment with missing references. Existing controls still receive the
  selected goal's authoritative links and status for actions that use those
  values.
- Funding-source ownership filtering, reassignment status/type filtering,
  contribution eligibility, lifecycle behavior, and mutation handlers are
  unchanged. The shared `isOpenGoal()` predicate now supplies the existing
  status gate to both source presentation and controls.
- Missing or unauthorized goals keep the existing unavailable state and do not
  start either secondary read.

## Query topology and remaining duplicate reads

Source inspection shows `getGoal()` reads the household currency, selected
goal, and household active funding links, then enriches the linked sources
through the existing savings, account-balance/ownership, investment, loan, and
debt readers. This remains on the critical path because the goal's progress
and funding quality depend on those values.

`listGoalFundingOptions()` loads the household currency, available savings,
accounts, investments, loans, debts, and active links. It is used for linking.
`listGoals()` loads all non-cancelled goals and active links and enriches their
funding values. It is used for reassignment targets and includes the selected
goal, so it repeats some selected-goal/link work. No existing lightweight
reassignment query was found. Both full queries now run after the selected
goal and behind the action boundary; this phase adds no RPC, migration, or
domain query change.

The number and timing of remote request waves were not measured. The topology
above is based on the current query implementations; nested helper calls and
the hosted service were not instrumented.

## Financial and household invariants

- The route session and active-membership checks remain before data access;
  `getGoal()`, `listGoalFundingOptions()`, and `listGoals()` retain their
  household-scoped authorization paths.
- No client-side financial fetching, cross-request cache, service-role read,
  progress formula change, or mutation was introduced.
- No goal contribution, link/unlink, reassignment, edit, lifecycle action,
  balance change, investment change, fixture creation, schema change, or policy
  change was performed.
- The existing selected-goal duplication inside `listGoals()` remains deferred
  work; no second direct `getGoal()` call was added.

## Deterministic test evidence

`tests/unit/plan-goal-detail-progressive-rendering.test.tsx` adds seven
deferred-promise tests. They verify that the page resolves while either action
loader is pending; the page waits for the selected goal before progress and
secondary reads; linked-source rows remain outside the action boundary; the
controls wait for both references; missing/unauthorized goals remain
unavailable; null secondary results yield no link or reassignment options; and
the page calls `getGoal()` once. The existing Goal presentation contract test
was updated to locate linked-source rendering in the server page.

These are promise/component-tree tests. They do not verify that a Next.js RSC
chunk containing the hero reaches a browser before the action chunk.

## Runtime and browser verification

Runtime comparison was unavailable. Brave opened the local Goal Detail URL and
was redirected to `/en/login`; no safe authenticated goal session was present.
No credentials were entered, the previously exposed E2E password was not
used, no hosted financial data was inspected, and the fixture-creating E2E
setup was not run. The changed Goal Detail screen therefore has no authenticated
browser reveal or viewport evidence. No performance improvement is claimed.

## Validation

- Focused Goal tests: **17 passed** across the progressive-rendering,
  controls, and Goal presentation test files.
- `npm run lint`: **passed**.
- `npm run typecheck`: **passed**.
- `npm run build`: **passed**; all 111 static pages generated.
- Full `npm run test -- --reporter=dot`: **263/266 files and 1,828/1,833 tests
  passed**. The Goal route, controls, and Goal presentation tests passed. Five
  failures remain in untouched areas: English/Vietnamese key parity is missing
  `money.savingsPage.summaryCaption`; three Phase 6 account-presentation tests
  lack `NextIntlClientProvider`; and a Money privacy test expects `break-words`
  while the component renders `truncate`.
- `npm run format:check`: failed on 192 files across repository skill/reference
  markdown and existing source/test files. The changed TypeScript files were
  formatted and checked individually; the new audit will also be checked
  individually. Unrelated files were not reformatted.
- E2E fixture setup and authenticated runtime benchmarking were not run because
  they require a safe authenticated account and the setup writes hosted records.

## Remaining bottlenecks

- `getGoal()` still waits for source valuation and balance reads required to
  produce authoritative funded amount, quality, and linked-source details.
- The deferred `listGoals()` query still reloads the selected goal among all
  goals and active links.
- Funding-option and reassignment query duration, RSC reveal time, and browser
  tail latency have not been measured.

**PLAN PHASE 2 STRUCTURALLY COMPLETE — RUNTIME PERFORMANCE UNVERIFIED**
