# Plan Section Streaming

## 1. Executive Summary

Implemented section-level React Server Component streaming for the Plan hub.
The page now starts the existing Plan reads together, renders a stable shell,
and reveals the critical period/pulse hero before the slower decision and
secondary sections. Existing loaders, query contracts, calculations, labels,
privacy behavior, error semantics, DOM order, and request inventory are
preserved.

Result: **STREAMING ACCEPTED** and **MEANINGFUL UX WIN**. The median first
useful pulse moved from about 1,595 ms to 1,070 ms (~33% earlier), while full
content completion stayed effectively flat (1,607 ms to 1,572 ms median).

DATABASE CHANGES: NONE  
FINANCIAL DATA MUTATIONS: NONE  
INFRASTRUCTURE CHANGES: NONE

## 2. Previous Rendering Architecture

The Plan route authenticated the user and membership, then awaited one
page-wide `Promise.all` for translations, pulse, budgets, inbox, goals, and
upcoming events. Only after every result and every derived view model was
ready did it render the page. The route-level loading UI existed, but it did
not reveal content progressively from the page itself.

The previous warm request inventory was approximately 19 server fetches,
including one Plan jar-budget RPC. The earlier investigation measured a
median response start of 242 ms and content completion around 1,607 ms.

## 3. Section/Data Dependency Matrix

| Section                | Existing data dependencies                                                                                       | Streaming role                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Critical hero          | Plan pulse, current jar budgets, Plan translations; health status also uses the shared inbox/goals decision data | Render pulse period/income shell first; stream health status inside the hero |
| Decisions              | Plan translations, catalog translations, pulse, current jar budgets, open inbox items, goals                     | Render after the shared decision view model resolves                         |
| Upcoming               | Plan translations, pulse currency, upcoming events                                                               | Independent sibling boundary                                                 |
| Jars                   | Plan translations, catalog translations, pulse, current jar budgets                                              | Independent sibling boundary                                                 |
| Goals                  | Plan translations, pulse currency, goals                                                                         | Independent sibling boundary                                                 |
| Workspace and teaching | Plan translations only                                                                                           | Static content remains outside the data boundaries                           |

No new dependency or fetch was introduced.

## 4. Shared Promise Strategy

After authentication and active-membership resolution, the page creates each
existing read promise exactly once:

- `getTranslations("plan")`
- `getTranslations("catalog")`
- `getPlanPulse()`
- `getCurrentJarBudgets()`
- `listOpenInboxItems()`
- `listGoals()`
- `listPlanHubUpcomingEvents()`

Those promises are passed to the relevant Server Components. The hero, jars,
upcoming, and goals boundaries reuse the same pulse promise; the hero and jars
reuse the same budget promise; decisions and hero health reuse one shared
derived decision promise; catalog translations are reused by decisions and
jars. The page does not call loaders again from a child boundary.

Existing loader-level caching and safe-null behavior remain unchanged.

## 5. Suspense Boundary Design

The route now uses five sibling boundaries in the original visual order:

1. Critical hero
2. Decisions and recommendations
3. Upcoming
4. Jars
5. Goals

The hero contains one nested boundary for the health/status block. Existing
shared skeleton primitives and design tokens are reused for all fallbacks.
Fallbacks deliberately do not reuse final content `data-testid` values, so
stream measurements cannot mistake placeholder markup for completed content.

The workspace and teaching sections remain after the data sections and are
not redesigned. There is no client-side fetch, polling, or layout redesign.

## 6. Error Isolation Design

No new error swallowing was added. Existing loaders continue to log and
return their established safe-null values. Existing UI fallbacks therefore
remain intact: unavailable jar budgets still show the existing warning,
empty/null secondary reads keep their existing empty states, and unexpected
exceptions retain the previous route error behavior.

The boundaries isolate slow sibling rendering, not domain failures. A failed
shared decision promise can affect the hero status and decisions together,
matching their existing shared data semantics; pulse/budget content still has
its existing null-safe behavior.

## 7. Implementation

Changed production files:

- `app/[locale]/(product)/plan/page.tsx`: split the former monolith into
  promise-driven Server Components and boundaries without changing formulas,
  labels, routes, or section order.
- `app/[locale]/(product)/plan/plan-hub-hero.tsx`: extracted the existing
  hero status markup and added a token-based status fallback.
- `app/[locale]/(product)/plan/loading.tsx`: exported existing loading pieces
  for reuse by the route boundaries.

The previously prepared jar-budget read-model work remains separate and was
not modified by this streaming phase.

## 8. Fetch Inventory Before vs After

| Metric                   | Before | After | Result           |
| ------------------------ | -----: | ----: | ---------------- |
| Warm Plan server fetches |    ~19 |    19 | No amplification |
| Plan jar-budget RPC      |      1 |     1 | Preserved        |
| New page/client fetches  |      0 |     0 | Preserved        |
| Financial mutations      |      0 |     0 | Preserved        |

The after count is from the isolated server trace: one request group contained
19 warm server fetches and one `get_plan_jar_budget_raw_inputs` RPC. The inbox
enrichment tail is pre-existing and was not duplicated by this change.

## 9. Stream Timing Before vs After

Warm 440 px Chromium measurements, 10 navigations after the existing backend
read-model optimization:

| Marker             |                               Before median | After median | After p75 | After p95 |
| ------------------ | ------------------------------------------: | -----------: | --------: | --------: |
| Response start     |                                      242 ms |       229 ms |    252 ms |    395 ms |
| Shell              |             first streamed bytes 240–365 ms |       291 ms |    316 ms |    475 ms |
| First useful pulse |                                   ~1,595 ms |     1,070 ms |  1,077 ms |  1,259 ms |
| Jars               |                                   ~1,607 ms |     1,071 ms |  1,078 ms |  1,260 ms |
| Decisions          | not separately exposed; page-complete phase |     1,565 ms |  1,858 ms |  2,044 ms |
| Upcoming           |                                   ~1,609 ms |     1,568 ms |  1,861 ms |  2,047 ms |
| Goals              |                                   ~1,610 ms |     1,570 ms |  1,863 ms |  2,049 ms |
| Full content       |                                   ~1,607 ms |     1,572 ms |  1,865 ms |  2,051 ms |

Raw stream evidence recorded the first HTML/fallback bytes at 245 ms, the
actual `plan-period-pulse` marker at 503 ms, and the final response chunk at
1,063 ms. The old raw stream exposed Plan content markers around 1,215–1,242
ms. The useful-content metric uses visible browser markers and is the decision
metric for this phase.

## 10. Functional Equivalence

PASS.

- Existing Plan presentation, progressive-disclosure, query-shape, and
  loading-parity unit tests pass: 18 tests.
- Existing authenticated Plan hub smoke passes: 2 Chromium tests.
- Production build passes with Next.js 16.3.1.
- Targeted ESLint passes for all changed Plan files and the new measurement
  script; `git diff --check` passes.
- No business query, RPC, mutation, authorization, financial calculation, or
  persisted data contract was changed in this phase.

The separate Plan privacy/valuation E2E file remains flaky/pre-existing: one
case has a strict text locator matching title and subtitle, and another sees
duplicate login inputs. Those failures are outside the changed streaming
surface and do not indicate a Plan stream or overflow regression.

## 11. Mobile / Desktop Validation

| Viewport / mode              | Result                                                         |
| ---------------------------- | -------------------------------------------------------------- |
| 390 px light                 | PASS; no horizontal overflow; zero console errors              |
| 440 px light                 | PASS; centered app shell; zero console errors                  |
| 768 px light                 | PASS; no horizontal overflow; zero console errors              |
| 1280 px light                | PASS; centered 440 px app shell preserved; zero console errors |
| 440 px dark + reduced motion | PASS; no overflow; zero console errors                         |

Screenshots and JSON measurements are under `output/playwright/plan-perf/`.
The 440 px and 1280 px screenshots were visually inspected.

## 12. Result Classification

**MEANINGFUL UX WIN**

The critical Plan pulse is visible materially earlier and the route starts
streaming real content before the slowest decision data completes. Full page
completion does not improve materially, so this is a perceived-readiness win,
not a backend throughput claim.

## 13. Remaining Bottlenecks

The remaining late boundary is the shared decisions view model, dominated by
the existing inbox read/enrichment path and its dependent data. Upcoming and
goals finish with that late phase in the measured runs. Full completion is
therefore still approximately 1.6–2.0 seconds depending on run conditions.

## 14. Recommended Next Step

Choose **B — inbox enrichment optimization** next. It is the largest remaining
late decision-boundary dependency and can improve both decision visibility and
full completion without changing the Plan UI contract.

## 15. Raw Evidence

- Baselines: `.agents/audits/plan-performance-investigation.md` and
  `.agents/audits/plan-jar-budget-one-wave-read-model.md`
- Timing: `output/playwright/plan-perf/stream-timing-after.json`
- Raw stream: `output/playwright/plan-perf/raw-stream-after.json`
- Server trace: `output/playwright/plan-perf/server-stream-after.log`
- Viewport evidence: `output/playwright/plan-perf/layout-390.json`,
  `layout-440.json`, `layout-768.json`, `layout-1280.json`, and
  `layout-440-dark-reduced.json`
- Screenshots: `output/playwright/plan-perf/plan-390.png`,
  `plan-440.png`, `plan-768.png`, `plan-1280.png`, and
  `plan-440-dark-reduced.png`
- Commands: `npm run build`, `npm run typecheck`, targeted ESLint, targeted
  Plan Vitest suites, and authenticated Plan hub Chromium smoke.

Repository-wide checks still report four unrelated existing unit failures and
older lint errors in pre-existing `output/` profiling scripts; no unrelated
files were changed to conceal them.
