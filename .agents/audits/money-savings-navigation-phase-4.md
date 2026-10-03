# Money → Savings navigation — Phase 4

Date: 3 October 2026 (Asia/Ho_Chi_Minh). Scope: Savings → Saving Detail only. Phase 1–3 working-tree changes are preserved. No Phase 5 work, schema change, financial fixture mutation, dependency addition, or shared-account-loader change.

## Dependency classification

| Data                                                               | Initial summary                             | Lower page                                                  | Action/dialog                                              | Security critical                                                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Authenticated user / active household membership / Money gate      | Critical                                    | Shared request context                                      | Independently checked on mutation                          | Verified user, active membership and household isolation remain mandatory                                                             |
| Saving identity, status, immutable product snapshot                | Critical                                    | Product disclosure and maturity instruction                 | Current policy/configuration                               | Household-scoped primary read and RLS                                                                                                 |
| Ownership / active owner capabilities                              | Critical                                    | Ownership badge                                             | Determines whether reference data/edit controls load       | Existing owner-membership mapping; cannot-mutate members get no editor/settlement surface                                             |
| Current lifecycle cycle                                            | Critical                                    | Term progress and expected return                           | Settlement preview                                         | Existing lifecycle selection, principal, rate, dates, tax and eligibility calculations                                                |
| Complete cycle history                                             | Comes with the existing critical cycle read | History accordion and history shortcut                      | None                                                       | Retain server-derived cycles; no additional current-cycle/history query                                                               |
| Financial activity                                                 | Deferred                                    | Independent activity boundary                               | Read-only                                                  | Transaction IDs derive from request-cached authorized Detail, with household filters on both seed/group queries and RLS               |
| Eligible accounts                                                  | Deferred                                    | No summary dependency; names are already embedded in Saving | Editor and settlement account choices                      | Preserve types, archived/owner restrictions, `canMutate`, balance availability and eligibility filtering                              |
| Household base currency / account balances / active account owners | Deferred with unchanged account read model  | Summary currency comes from cycle/product snapshot          | Account model must fully resolve before action forms mount | Account options are never mutation authority                                                                                          |
| Full active provider/package menu                                  | Deferred for normal active Saving           | Target-package label                                        | Editor and renewal/settlement choices                      | Existing registry/RLS; current package and RPC checks remain authoritative                                                            |
| Matured rollover-target validity                                   | Critical when applicable                    | Warning and unavailable-target explanation                  | Settlement/renewal semantics                               | Existing `setMaturityActionRequired` stays inside the critical Detail loader; request-cached packages are reused by action references |

Current cycle and history deliberately stay together. The actual Detail implementation performs one Saving read, then one cycle-list read alongside optional owner validation, and selects the lifecycle cycle from that list. There is no embedded current-cycle shortcut in this Detail query. Splitting it would add a read or require a new lifecycle-aware projection; this phase does neither. The existing cycle history can render with the summary, independently of action/activity waits.

The full account loader reads currency/accounts, then balances/owners, maps capabilities and filters eligible mutable liquid accounts. Detail consumes only the mapped account IDs/names, but the loader's validation and balance availability remain intact. No narrower shared account model was introduced.

## Previous architecture

```text
click → existing parallel session gate
      → authorized Saving read
      → cycle history + optional active Saving-owner validation
      → critical maturity-target check when applicable
      → await activity + full eligible accounts + package menu
      → release the entire Detail page
      → existing identity reveal + paint opportunity
```

Even empty activity reread the Saving selecting `id`. Account/reference loading held the entire financial summary behind the second wave. The historical Phase 1 warm Detail median was 1,628 ms; before Phase 1 it was 2,435 ms.

## New architecture

```text
click → unchanged authenticated session / Money gates
      → ONE request-cached authorized Saving Detail read
          ├ Saving identity / ownership / current cycle / all cycles
          └ critical rollover-target warning, when applicable
      → start server activity and ONE action-reference promise
      → return identity + principal/interest/rate + term dates/progress
          ├ existing current-cycle/history presentation
          ├ activity Suspense → independently resolved activity/empty state
          └ shared accounts/packages promise
               ├ target-package label Suspense
               ├ full editor Suspense
               ├ compact editor Suspense
               └ settlement control Suspense, when applicable
```

All deferred work starts on the server immediately after the authorized Detail and action-capability decision. Accounts need the `canAct` decision; provider packages need the trusted provider ID; activity needs trusted cycles. Starting these before that point would require speculative unauthorized reads or an extra projection. No browser fetch, effect waterfall, API route, client data architecture or cross-user cache was introduced.

The existing maturity instruction and early-withdraw navigation remain in their original positions. The early-withdraw link needs no account/package options and retains its separately authorized destination. Action forms mount only after **both** reference loaders return a complete model; a null result does not fabricate empty actionable options. Pending controls are local shared Skeletons. Empty valid account choices preserve the existing no-settlement behavior. The initial critical warning remains present before reference data resolves.

Activity now accepts only a Saving ID and obtains cycles from `getSavingDetail` inside the server query. The page and activity use the same React request cache. This is an explicitly server-resolved authorization context, not a client assertion, boolean capability, or trusted client-supplied cycle/transaction array. The activity query still runs the Money gate and household-filters every transaction read. `getSaving()` remains uncached by this change; mutation/other command paths retain their existing fresh reads and authoritative validation.

## Files changed

| File                                                  | Change                                                                                                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/[locale]/(product)/money/savings/[id]/page.tsx`  | Replace the page-wide secondary await with server-started promises and narrow local async consumers; preserve summary, history, warnings, editors and settlement presentation         |
| `modules/savings/application/queries/list-savings.ts` | Request-cache Detail; resolve activity cycles from that authorized server read and remove the redundant Saving-ID lookup                                                              |
| `tests/unit/savings-detail-streaming.test.tsx`        | Pending summary/reference/activity behavior in EN/VI, independent activity, rejected references, critical matured warning, no-action member, unavailable Saving and session redirects |
| `tests/unit/savings-list-orchestration.test.ts`       | Empty/activity-present deduplication, trusted transaction IDs, household filters, denied gates, missing/inaccessible Saving, separate-request isolation and invalid rollover warning  |
| `tests/unit/savings-commands.test.ts`                 | Current server/RPC rejection after a previously offered settlement account becomes invalid; inactive renewal package rejection                                                        |
| This report and companion evidence JSON               | Separate readiness measurements, request counts, browser assertions, validation and limits                                                                                            |

## Performance

Same local production profiling environment as earlier phases: disposable Next 16.3.1 / React 19.2.3 builds, port 3102, existing hosted Supabase in ap-southeast-2, same authenticated user and existing Saving, headed Chromium at 440 × 900, normal motion, no throttling. Each final arm restarted the server and browser, entered Money → Savings, then measured one cold-ish Detail pass and three warm repetitions with 1.2 s idle spacing. The existing Detail app Back link was used between passes. Repository checks completed before these quiet final collections. No financial data was written.

**A — Detail Summary Visible:** real Saving identity, ownership, principal/interest/rate and current-cycle/date facts, with every identity ancestor at least 95% opaque, followed by two animation frames. **B — Activity Ready:** resolved activity/empty state and history sections mounted, followed by two frames. **C — Actions Ready:** both reference-dependent editors mounted and enabled, followed by two frames. **D — Full Detail Data Ready:** `max(B, C)`, since those consumers cover all current Detail dependencies; it is distinct from the hero reveal completing. B measures a ready below-fold section, without requiring the user to scroll down.

An initial diagnostic found that DOM arrival plus two frames could record the identity while its existing MotionReveal parent was still opacity zero. Those diagnostic blocks were excluded **before locking the final pair**, and both arms were repeated with the same readable-summary rule. No individual final sample was dropped. Motion was not modified. This is a stricter summary definition than the historical Phase 1 measurement, so the same-run control is the primary comparison.

| Metric                 | Before Phase 4, same-run warm median | Phase 4 warm median |              Delta |
| ---------------------- | -----------------------------------: | ------------------: | -----------------: |
| Summary visible        |                           2,028.6 ms |          1,343.3 ms | -685.3 ms / -33.8% |
| Activity ready         |                           1,727.9 ms |          1,041.7 ms | -686.2 ms / -39.7% |
| Actions ready          |                           1,727.9 ms |          1,608.3 ms |  -119.6 ms / -6.9% |
| Full Detail data ready |                           1,727.9 ms |          1,608.3 ms |  -119.6 ms / -6.9% |

| Historical context                                             | Before Phase 4 |    Phase 4 |                  Arithmetic difference |
| -------------------------------------------------------------- | -------------: | ---------: | -------------------------------------: |
| Phase 1 page-wide DOM + two frames vs Phase 4 readable summary |      ≈1,628 ms | 1,343.3 ms | -284.7 ms / -17.5%; definitions differ |
| Phase 1 page-wide readiness vs Phase 4 full data readiness     |      ≈1,628 ms | 1,608.3 ms |   -19.7 ms; cross-run network variance |

The final control's full-data median was 1,727.9 ms, 99.9 ms above the historical 1,628 ms. Its readable summary adds about 301 ms of existing reveal delay. The earlier DOM-based diagnostic control had a 1,578.3 ms median, illustrating network variance. Do not attribute the entire observed full-readiness improvement to faster SQL or account queries: those loaders were not optimized. The architectural evidence is that every Phase 4 summary is readable **before** account/reference readiness, while every control summary waits for that data and then its reveal.

All samples, milliseconds from the actual click:

| Arm / pass        | Summary A | Activity B | Actions C | Full data D |
| ----------------- | --------: | ---------: | --------: | ----------: |
| before / cold-ish |   2,176.5 |    1,875.7 |   1,875.8 |     1,875.8 |
| before / warm 1   |   2,011.8 |    1,711.0 |   1,711.0 |     1,711.0 |
| before / warm 2   |   2,125.6 |    1,825.5 |   1,825.5 |     1,825.5 |
| before / warm 3   |   2,028.6 |    1,727.9 |   1,727.9 |     1,727.9 |
| after / cold-ish  |   1,310.6 |    1,009.2 |   1,742.5 |     1,742.5 |
| after / warm 1    |   1,144.5 |      842.8 |   1,375.9 |     1,375.9 |
| after / warm 2    |   1,343.3 |    1,041.7 |   1,608.3 |     1,608.3 |
| after / warm 3    |   1,540.3 |    1,240.5 |   2,040.4 |     2,040.4 |

Summary content, its DOM node, the shared main element, and `#app-viewport-root` were retained across streamed resolution in all final samples. The after warm gaps from readable summary to actions are **231.4 / 265.0 / 500.1 ms**. Empty activity is already ready before the existing hero reveal finishes; it is not forced to wait for accounts. For nonempty activity, the unchanged seed/group transaction queries resolve in its independent boundary.

Timings use capture-phase clicks, MutationObserver content checks and two animation frames, browser demand-RSC observations, request-local server spans and real Supabase HTTP timings in the disposable builds. They represent readiness/paint opportunities, not exact compositor presentation timestamps. Clock alignment uses browser epoch time and server wall time, with millisecond rounding. Three warm samples are not a production SLA, p95, randomized A/B, or guarantee across regions. Before/after reads were successive remote-network runs.

Machine-readable samples, server spans, HTTP counts, browser assertions and limits: [money-savings-navigation-phase-4-evidence.json](money-savings-navigation-phase-4-evidence.json).

## Network timeline

Representative final samples: control warm 3 (its median A) and Phase 4 warm 2 (its median A). Times are relative to click = 0. The two samples have different remote read durations; operations were not artificially delayed.

| Operation                              | Control start → end |  Phase 4 start → end | Blocks readable summary?                                    |
| -------------------------------------- | ------------------: | -------------------: | ----------------------------------------------------------- |
| Session gate                           |      8.8 → 345.8 ms |      13.6 → 287.6 ms | Yes                                                         |
| Saving + current-cycle/history context |    345.8 → 917.8 ms |   287.6 → 1,016.6 ms | Yes                                                         |
| Activity loader                        |  917.8 → 1,256.8 ms | 1,016.6 → 1,017.6 ms | Control only                                                |
| Package menu                           |  917.8 → 1,182.8 ms | 1,016.6 → 1,277.6 ms | Control only; critical matured warning remains an exception |
| Full eligible-account loader           |  917.8 → 1,703.8 ms | 1,016.6 → 1,578.6 ms | Control only                                                |

```text
Phase 4 warm 2, click = 0
│
├ session                  13.6 ───── 287.6 ms
│  ├ remote getUser        16.6 ───── 276.6 ms
│  └ active membership    19.6 ───── 286.6 ms
│
├ authorized Detail       287.6 ──────────── 1016.6 ms
│  ├ Saving primary       288.6 ─────── 755.6 ms
│  └ current/all cycles   756.6 ─────── 1015.6 ms
│
├ empty activity          1016.6 ─ 1017.6 ms → B READY 1041.7 ms
├ packages                1016.6 ────── 1277.6 ms
├ account references      1016.6 ──────────────── 1578.6 ms
│  ├ currency/accounts    1018.6 ────── 1301.6 ms
│  └ owners/balance RPC   1303.6 ────── 1576.6 ms
│
├ summary DOM / cycle/history already released
│  └ existing reveal + two frames → A SUMMARY READABLE 1343.3 ms
│
└ reference-dependent forms → C ACTIONS / D FULL DATA READY 1608.3 ms
```

The summary did not wait for accounts completing at 1,578.6 ms. Packages happened to finish before readable A while the existing reveal ran, but neither package-menu nor account completion was a prerequisite to releasing summary DOM. The control instead waited for accounts until 1,703.8 ms, released its sections at about 1,727.9 ms, and reached readable A at 2,028.6 ms.

The activity Saving-ID reread cost **337 ms** in this control sample. In Phase 4 the empty activity loader takes **1 ms** because it reuses the authorized Detail and trusted empty transaction links. Removing that read alone would not have shortened the old page-wide boundary: accounts were still slower. Streaming removes that boundary; deduplication makes the independently streamed activity ready without an unnecessary hosted round trip.

## Request counts

Every final cold/warm Detail demand request has the following actual remote HTTP counts. Counts are per navigation, not logical helper calls or browser loading-shell prefetches.

| Operation                                                            | Before | Phase 4 | Summary dependency after change                                                |
| -------------------------------------------------------------------- | -----: | ------: | ------------------------------------------------------------------------------ |
| Remote `getUser`                                                     |      1 |       1 | Critical                                                                       |
| Active session membership                                            |      1 |       1 | Critical                                                                       |
| Saving primary read                                                  |      1 |       1 | Critical                                                                       |
| Current/all cycle read                                               |      1 |       1 | Critical, history reused                                                       |
| Saving-owner membership validation                                   |      0 |       0 | Household fixture has no owner ID; existing optional validation retained       |
| Activity Saving-ID reread                                            |      1 |   **0** | Removed using authorized request-cached Detail                                 |
| Activity transaction reads                                           |      0 |       0 | Empty existing fixture; live funded case exercises the scoped seed/group reads |
| Eligible accounts                                                    |      1 |       1 | Deferred                                                                       |
| Household base currency                                              |      1 |       1 | Deferred                                                                       |
| Account-owner membership validation                                  |      1 |       1 | Deferred                                                                       |
| Account-balance RPC                                                  |      1 |       1 | Deferred                                                                       |
| Active provider packages                                             |      1 |       1 | Deferred for this active fixture; reused for critical matured warnings         |
| Token refresh                                                        |      0 |       0 | None in measured windows                                                       |
| **Total Auth/REST HTTP**                                             | **10** |   **9** | No new duplicate loading                                                       |
| **Demand RSC navigation**                                            |  **1** |   **1** | One progressively streamed response                                            |
| Uncached server-client construction / session loader / Detail loader | 1 each |  1 each | Request-safe reuse                                                             |

Matured/owner-specific/nonempty-activity cases can have the existing additional owner/transaction reads; the table is not a claimed universal nine-call count. An authorized personal Saving still needs owner validation. Browser prefetch and app Back requests are recorded separately in the evidence. Assertions reconcile every measured final request to its one Saving, one cycle query and expected 10/9 HTTP total. There are no client reference-data requests.

## Correctness

| Case                               | Evidence                                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Normal active Saving               | Real EN/VI summary/term/history/empty activity and edit options resolve; final benchmark checks summary text and DOM identity across streams                                                                                                           |
| Another household / missing Saving | Unit query requires the current household; separate-request test changes household and rejects the cached Saving; unavailable-page test loads no secondary data; live nonexistent UUID renders the original missing surface with no financial identity |
| No activity                        | Empty trusted cycle links return `[]` with no activity Saving reread or transaction call; live benchmark fixture retains the existing empty section                                                                                                    |
| Activity present                   | Seed and transfer-group reads retain household filters; deduplicated transaction activity is tested; a separate existing funded Saving renders live linked activity                                                                                    |
| Cannot act                         | Unit case loads neither accounts nor action packages; existing live partner-personal Saving shows no maturity editor; no streamed data creates a settlement surface                                                                                    |
| Can act                            | Both loaded editor surfaces open from real options; Enter opens the sheet, Tab stays inside with visible solid focus, Escape closes it; abandoned policy changes reset on reopening in EN and VI                                                       |
| Matured / invalid target           | Unit Detail computes the unavailable-target warning before returning; pending-reference page test preserves that warning in the shell; the settlement component retains current package/date, warning and payout props                                 |
| Missing/inactive provider package  | Missing menu model mounts no action form; critical rollover warning still uses the existing registry check; renewal command rejects an inactive/missing current snapshot before mutation RPC                                                           |
| Account invalidated while open     | Command test performs a new Money gate and settlement RPC for the same previously offered ID, then returns the authoritative rejection; deployed RPC and account-eligibility function inspected read-only                                              |
| Browser Back / previous phases     | Detail browser Back returns to Savings. Money → Savings → Create → Back smoke preserves the exact prior Navigation API entry; the streamed Create name field works before options; no Create was submitted                                             |

Deployed RLS inspected read-only: Savings SELECT requires an active household membership; Savings UPDATE uses `can_mutate_financial_resource` in both USING and WITH CHECK; cycles inherit Saving membership/mutation constraints; transaction reads require active household membership. Deployed settlement and rollover RPCs check `auth.uid()`, resource mutation capability, and current liquid-account eligibility; rollover also checks package renewability. No policy/function/schema was changed. Mutation authorization is not based on streamed options. Package checks that already occur inside Detail remain critical.

The hosted dataset has no Saving in a second household and no usable persisted matured fixture. Cross-household and matured/invalid-package behavior therefore use unit contract tests plus read-only deployed-policy/function inspection, not a claimed live alternate-user or live settlement experiment. Financial mutations were not performed in the browser.

Authenticated browser verification: 390/440/768/1280 px, EN and VI, light/dark themes, and reduced motion at every viewport/theme combination. All layout checks passed: no document overflow, shell width at most 440 px, correct theme, unchanged summary values, and no reduced-motion transform. Screenshots in ignored `output/playwright/phase4-*` were captured; representative 440 EN, 390 VI/dark and 1280 EN/light images were visually inspected. Sheet keyboard/focus/reset checks passed in both languages. This verifies retained shared accessible controls and tokens; it is not a full automated WCAG audit.

### Repository validation

- `npm run lint`: passed; final changed-file ESLint also passed.
- `npm run typecheck`: only the two pre-existing Home translator TS2322 errors at `home-streaming-sections.tsx:99,340`; no Phase 4 source/test error.
- Final `npm run test`: **246 files passed / 4 failed; 1,645 tests passed / 6 failed**. Existing failures: EN/VI key parity (1), Money wrapping (1), account presentation missing NextIntl context (3), historical-opening date-sensitive Savings test (1). All changed-file focused tests passed (**42 tests**); earlier combined session/Create/Detail regression focus passed **84 tests** before adding the two command-authority cases.
- `npm run test:e2e` with a disposable read-only config and the existing authenticated smoke: **2 passed**. The config reused existing auth and omitted fixture-writing global hooks; the separate real-browser flow above covers Savings. Broad financial-fixture/mutating E2E suites were not run.
- `npm run format:check`: existing/style issues in **193 files**; all Phase 4 production/test files pass targeted Prettier. Report/evidence formatting is checked separately.
- Both disposable production builds passed with the same scratch-only `typescript.ignoreBuildErrors` and Turbopack filesystem-root workaround as earlier phases. Repository Next configuration was untouched; this does not establish a clean strict production build.
- `refactor-review` applied to the Phase 4 diff against pre-phase snapshots: existing APIs, constants, formatting, icons, tokens, gates and mutation contracts retained; no new client state/effects/dependency/cache framework. Prior working-tree changes were not overwritten.

## Remaining bottleneck

The required session and Saving/cycle reads still precede summary rendering. The existing identity reveal also separates DOM arrival from readable content; it is measured honestly rather than changed. Full action readiness still pays the shared eligible-account currency/accounts → owner/balance pipeline. Matured rollover warnings can additionally require the existing package check on the critical path. None of these remaining costs is optimized in Phase 4.

## Decision

Useful financial summary is measurably earlier under the stricter readable-content milestone, all secondary reads are outside its await boundary, authorization/RLS and authoritative mutation validation are retained, reference-dependent forms are gated, request counts decrease without duplicated loaders, browser streaming and prior-phase smoke pass, and full readiness is reported separately. The existing unrelated repository failures and live-fixture limits remain explicitly recorded. Phase 5 has not been started.

**PHASE 4 SUCCESS — PROCEED TO PHASE 5**
