# Plan Performance Phase 6 — Jar Detail Production Verification & Final Closeout

**Date:** 2026-10-13  
**Result:** Matched local Jar Detail comparison completed; Goal Detail browser coverage deferred.

## 1. Local production environment

- `bun run build` passed with Next.js 16.3.1 and generated all 111 static pages.
- Started the freshly built app with `NODE_ENV=production HOSTNAME=127.0.0.1 PORT=3000 bun run start`. Next reported `next start` ready at `http://localhost:3000`.
- Build output was not in use by another server. The listener on port 3001 belonged to a separate Nuxt checkout and was left untouched.
- `next.config.ts` keeps `logging.serverFunctions: false`; the production build loaded the config. The candidate server terminal produced no error output during the browser run. One earlier control-server terminal poll returned output classified as error-like, but its exact text was not retained. A fresh read-only control navigation rendered Jar Detail, and the next control-server poll returned no new lines; the control log result remains inconclusive.
- The separate pre-Phase-3 page/control copy also built successfully with its own `.next` output for port 3002.
- No Vercel deployment, `next dev`, fixture setup, migration, or database mutation was used.

## 2. Read-only safety and browser session

Before opening Jar Detail, the reachable GET path was reviewed. The route checks the signed-in user and active membership, then reads the selected Jar. Its secondary reads are active Jars, household policies, Inbox items and their enrichment, categories, current budget inputs, and bounded recent activity. The Inbox attention path uses reads and in-memory enrichment; it does not invoke the Inbox maintenance worker. The current-budget RPC and recent-activity query are read-only. Mutations remain behind explicit controls and server actions.

The existing authenticated session in the connected Brave browser loaded Home directly. No credentials were entered. One task tab was opened in that existing browser; unrelated tabs were not used. The browser followed Home → Plan Overview → an existing authorized Jar Detail → Plan. Inbox was not opened. Edit and reallocation controls were inspected but not submitted.

## 3. Plan Overview regression check

- Plan Overview showed October 2026, the Planned/Spent/Remaining summary, and six visible Jar rows. The current month matches the app date, 2026-10-13.
- No duplicate summary section or inconsistent period was visible in the smoke check. The detailed financial values were not copied into this report.
- The earlier Phase 5 local production report recorded these Plan Overview candidate p50/p75 timings: Financial Summary **1,575.5 / 1,663.3 ms** and first Jar row **1,584.5 / 1,669 ms**. Its pre-Phase-5 control measured **1,714.5 / 1,934.5 ms** and **1,943.5 / 2,020.5 ms**, respectively. Those runs were sequential, and candidate sources already included earlier Plan work, so the difference is not attributable to Phase 5 alone. See [Phase 5 verification](./plan-phase-5-local-production-verification.md).
- The Phase 5 implementation remains intact. The current focused Plan suite passed as listed in Section 10.

## 4. Jar Detail functional verification

Observed in the local production browser:

- The selected Jar header, active state, and October 2026 period rendered.
- Planned limit and Budget, Spent, and Remaining metrics rendered in VND. The selected Jar was not overspent; the remaining-amount presentation appeared.
- The reset rollover label and four linked category chips rendered.
- No Inbox attention banner applied to this Jar.
- Recent activity and its four visible entries rendered.
- Adjust Jar allocation and Edit Jar controls were present and left untouched.
- A navigation screenshot showed loading skeletons for the header, hero, metrics, and lower sections. A later snapshot showed the completed detail. At the existing wide desktop viewport, the page remained a centered single-column shell with no visible horizontal overflow.

The report contains no raw balances or private identifiers. One early unfiltered accessibility snapshot was emitted in this task transcript and included private financial values and identifiers; subsequent observations used sanitized summaries. The screenshot check used only the existing browser viewport; no 390, 440, 768, or 1280px override was available through this Brave interface.

## 5. Jar Detail warm navigation benchmark

Built an interleaved pre-Phase-3 page control and collected ten warm Plan Overview → Jar Detail → Plan pairs after one warm-up per arm. The same Brave tab, authenticated session, selected Jar, local backend, locale (`en`), and viewport were used. The arm order alternated. Each timer started before clicking the visible Jar row. Readiness was the first accessibility snapshot containing the actual visible UI marker; no fixed delay was used. Values are milliseconds and include Browser MCP observation overhead.

| Milestone                   | Pre-Phase-3 control p50 / p75 |   Candidate p50 / p75 | Candidate minus control |
| --------------------------- | ----------------------------: | --------------------: | ----------------------: |
| Detail header visible       |                 1,419 / 1,541 |     **818.5 / 887.5** |         −600.5 / −653.5 |
| Financial Hero visible      |                 1,419 / 1,541 |     **1,399 / 1,531** |               −20 / −10 |
| Budget metrics visible      |                 1,419 / 1,541 |     **1,399 / 1,531** |               −20 / −10 |
| Categories visible          |                 1,419 / 1,541 |   **1,170 / 1,272.3** |           −249 / −268.7 |
| Actions ready               |               1,419 / 1,510.5 |     **1,399 / 1,531** |             −20 / +20.5 |
| Recent activity visible     |             1,729.5 / 1,854.8 |   **1,156 / 1,232.3** |         −573.5 / −622.5 |
| Full detail ready           |             1,729.5 / 1,854.8 |     **1,399 / 1,531** |         −330.5 / −323.8 |
| Jar Detail → Plan readiness |               1,190 / 1,292.5 | **1,243.5 / 1,325.3** |           +53.5 / +32.8 |

p50/p75 use Type 7 linear interpolation. Hero and budget markers were observed in the same accessibility snapshots in both arms. The month was restored on each return. Scroll-position restoration was not separately observable. These are local browser measurements, not hosted-production latency.

## 6. Matched control

The temporary control restored `page.tsx` and `jar-detail-controls.tsx` from repository HEAD, which predates Phase 3's progressive-rendering changes. Shared application queries and other current modules were kept identical to the candidate. The control used its own source copy and `.next` output on port 3002; the candidate ran on port 3000. This is a Jar page/control rendering comparison, not a frozen whole-repository snapshot, and it does not substitute the older Phase 5 control.

## 7. Financial correctness

The rendered fields follow the existing authorized `getJar()` and `getCurrentJarBudgets()` application paths. The financial hero and action controls share the existing `JarBudgetMetrics` result; no page-level budget calculation was added. The visible currency, period, status, rollover, budget/spending/remaining presentation, and action availability were checked without saving private values. Across all ten pairs, the visible financial presentation fingerprint matched between control and candidate for the same Jar, including the Plan Overview monetary presentation.

The current model path continues to own rollover, signed adjustments, and overspending calculations; the Plan calculation and budget tests passed. This browser run did not independently retrieve or log raw model amounts for a numeric reconciliation. No account, household, Jar, budget, or transaction data was changed.

## 8. Progressive rendering, RSC, and network observations

The loading skeletons were observed and the completed page rendered. In the matched samples, the candidate header appeared earlier, while its Financial Hero p50/p75 was only 20/10 ms earlier than control—too small to support a separate hero-latency claim at this observation cadence. Categories and recent activity appeared earlier in the candidate, and full detail readiness was 330.5/323.8 ms earlier at p50/p75. This is observed local-browser evidence for this run; it does not establish server-side request overlap or a general hosted-production gain.

The connected Brave CUA interface exposed accessibility snapshots and screenshots but no console, CDP, or network monitor. Jar Detail RSC request counts, response completion, HTTP failures, and browser console entries are therefore **unavailable**. The earlier Phase 5 report’s Plan Overview request observations are not treated as Jar Detail results. The candidate server emitted no error output; the control-server log result is inconclusive as described in Section 1.

## 9. Goal Detail limitation

The latest authenticated test household had zero goals. No Goal fixtures were created. Phase 2 remains structurally verified but not browser-performance verified; this does not block Jar Detail closeout.

## 10. Final validation

- `bun run build`: passed; Next.js 16.3.1 generated 111 pages.
- Focused Plan suite: **27 files, 200 tests passed**.
- `bun run lint`: passed.
- `bun run typecheck`: passed.
- Full repository suite and E2E fixture setup were not run. The working tree already contained changes from earlier Plan and other performance phases; this verification changed no production source.

## 11. Remaining risks and recommendation

- The matched control restores the pre-Phase-3 Jar page and controls while keeping shared current modules. The result compares that page/control implementation with the candidate, not a frozen pre-Phase-3 repository snapshot.
- The candidate reached full detail readiness sooner than this reconstructed control in the measured run; treat that as an observed page/control result, not proof that every Phase 3 change caused the difference.
- RSC completion, network failures, and browser console entries were not observable through the connected Brave interface.
- One control-server terminal poll returned error-like output whose exact text was not retained. The page rendered during a fresh read-only navigation, but this does not establish that the control server had no errors.
- Only the existing viewport was visually inspected; mobile breakpoint overrides and scroll-position restoration were not tested.
- One early unfiltered accessibility snapshot exposed private values and identifiers in the task transcript; the closeout report omits them.
- Goal Detail performance remains deferred until the existing test household has a Goal; no fixture should be added for this closeout.

Recommend closing the Plan performance workstream with the current Jar Detail baseline and the prior Plan Overview evidence. Keep Goal Detail browser performance explicitly deferred. No Phase 7 or additional optimization was started.

PLAN PERFORMANCE CLOSED — VERIFIED WITH DEFERRED GOAL DETAIL COVERAGE
