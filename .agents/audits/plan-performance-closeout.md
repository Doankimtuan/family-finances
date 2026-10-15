# Plan Performance — Phase 1–3 Consolidation & Closeout

**Date:** 2026-10-11

**Scope:** Read-only consolidation audit of the current Phase 1–3 Plan implementation. No performance optimization, financial command, formula, schema, policy, fixture, or record was changed for this closeout.

## 1. Executive summary

The Plan Overview, Goal Detail, and Jar Detail changes remain consistent in the current source. Critical financial content continues to use its existing authoritative read models; secondary reads are isolated behind their consuming sections or action boundaries. The selected Goal and Jar are checked before their secondary reads begin, and their action commands retain server-side authorization.

The final production build, lint, typecheck, changed Plan-file formatting check, and focused Plan/financial suite pass. The full unit suite has five failures in three previously documented, out-of-scope groups. No authenticated browser timings, real RSC chunk observations, or live hosted RLS probe are claimed. Runtime validation remains deferred by the unverified credential-rotation gate.

## 2. Phase 1–3 implementation status

| Phase             | Current structure                                                                                                                                                                               | Readiness evidence                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1 — Plan Overview | One period identity selects a shared current or frozen-history financial promise for Summary and Jar Rows. History options, Inbox Attention, and Upcoming use separate promises and boundaries. | `plan-hub-critical-promise` and related Plan hub tests pass.                      |
| 2 — Goal Detail   | The selected authorized Goal supplies identity, target, funded progress, funding quality, and linked-source presentation. Funding and reassignment references load behind the action boundary.  | Seven deferred-promise tests pass in `plan-goal-detail-progressive-rendering`.    |
| 3 — Jar Detail    | The selected authorized Jar supplies identity first. Current budget feeds the financial hero and action references; categories, Inbox, and recent activity remain independently bounded.        | Six deferred-promise tests plus budget, calculation, and reallocation tests pass. |

No formula, RPC contract, financial command, or migration was changed by these phases. The only current change to the budget-query module is period/timezone/settings input reuse for consistent request-time classification and history reads.

## 3. Consolidated dependency graphs

### Plan Overview

```text
Product session → user + active membership
  └─ period identity (one request time, authorized household timezone)
       ├─ current: Plan pulse + one current-budget promise
       │    └─ Summary + Jar Rows share the same result
       └─ historical: selected frozen-history read only
            └─ Summary + Jar Rows; unavailable history stays unavailable

       ├─ history-month options → nested History selector boundary
       ├─ Inbox items + financial metrics → Attention boundary
       ├─ current-only upcoming read → Upcoming boundary
       └─ period-only allocation action, shortcuts, and destinations
```

### Goal Detail

```text
Product session → user + active membership → selected Goal
  ├─ missing or unauthorized → unavailable state; no secondary reads
  └─ authorized Goal
       ├─ identity, target, progress, funding quality, linked sources
       │    └─ authoritative getGoal() result
       └─ funding options + Goal list
            └─ Suspense action boundary → link/reassign/contribute controls
```

### Jar Detail

```text
Product session → user + active membership → selected Jar
  ├─ missing or household-mismatched → unavailable state; no secondary reads
  └─ authorized Jar
       ├─ identity and header
       ├─ one current-budget promise → financial hero + action references
       ├─ categories → category presentation
       ├─ active Jars + policies → edit/reallocation references
       ├─ Inbox items → attention banner
       ├─ recent activity → existing Suspense boundary
       └─ lifecycle controls → selected Jar identity/status
```

The route order, shared product header, privacy presentation, and bottom-navigation shell remain in place. Loading fallbacks reserve their existing sections; financial values are rendered from completed authoritative results rather than mixed intermediate values. The added Goal and Category lists use stable domain ids as keys; no transient key was added to remount an entire route section.

## 4. Financial integrity

| Invariant                                                  | Source and deterministic evidence                                                                       | Result                                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Current qualifying income; fixed and percentage allocation | Existing budget projection and `plan-jar-budget`, `plan-jar-calculation-plan03`, and `plan-pulse` tests | Same existing calculation and income source are passed through.                                              |
| Rollover and signed adjustments                            | `plan-jar-budget`, `plan-v2-assisted-rollover`, and calculation tests                                   | Positive/negative adjustments and carry/reset behavior remain covered.                                       |
| Overspending and negative remaining                        | `plan-jar-budget` and Jar presentation tests                                                            | Negative remaining and overspent state remain valid; no zero clamp was added.                                |
| Household timezone boundaries                              | Plan hub deferred tests and `plan-jar-calculation-plan03`                                               | Period classification uses the authorized household timezone and one request timestamp.                      |
| Frozen historical periods                                  | `plan-budget-history` and Plan hub tests                                                                | Historical values use selected-period snapshots/transactions/adjustments; current values are not a fallback. |
| Linked Goal progress and funding quality                   | `plan-goal-funding`, Goal query, and Goal presentation tests                                            | Linked progress and quality continue to derive from the existing source reads and summary.                   |
| Legacy unlinked contributions                              | `plan-goal-funding`                                                                                     | Existing legacy contribution behavior remains distinct from linked funding.                                  |
| Missing/unavailable funding sources                        | Goal detail deferred tests and funding tests                                                            | Missing references remain unavailable and do not create link/reassignment options.                           |
| Reallocation authority and readiness                       | `plan-movement-commands`, Jar detail deferred tests, and existing reallocation command                  | Controls wait for required references; the server command reauthorizes and remains authoritative.            |

The current Plan financial/domain suite passed **201 tests across 31 files**. No financial records or fixtures were created or modified during validation.

## 5. Security and household isolation

- Each route retains the canonical product session, user, and active-membership gate before Plan reads.
- `getGoal()`, `getJar()`, budget, category, policy, Inbox, funding-option, and Goal-list reads remain on the existing household-authorized application paths. The detail tests verify missing or mismatched selected resources do not start secondary reads.
- The budget query validates the RPC household against the authorized household. Query code continues to constrain household-owned reads with the authorized household id.
- The reviewed migrations enable RLS on the relevant Jar, Goal, Goal funding, snapshot, and adjustment tables. Their policies use household membership/active membership for reads and the existing financial-resource authorization for protected Goal mutations. This is migration/source inspection only; no live hosted RLS request was made.
- Goal and Jar mutation commands continue to call `assertMoneyActionAllowed()`. No service-role reads or cross-request financial cache were found in the reviewed Plan paths.
- `next.config.ts` currently keeps `logging.serverFunctions = false`; the production build loaded this configuration. No live logging probe was performed.
- The credential report still does not confirm rotation of the previously exposed E2E password. No credential was read or reused, no login was attempted, no authenticated Brave/personal browser session was used, and the fixture-writing Playwright global setup was not run against hosted Supabase.

## 6. Loading and action readiness

- **Plan Overview:** Summary and Jar Rows share one period-consistent financial promise. The selector has a nested fallback for delayed history options. Attention and Upcoming wait on their own secondary reads; current-only sections are skipped for historical periods.
- **Goal Detail:** Goal identity and authoritative funding content render without waiting for action references. Link/reassignment controls wait for both reference reads, so absent references cannot enable those choices.
- **Jar Detail:** Identity renders after the selected Jar is authorized. The hero waits for the current budget. Reallocation/edit controls wait for the budget and their Jar, category, and policy references. Categories, Inbox, and recent activity do not gate the hero.
- Missing or unavailable reads retain existing unavailable/empty behavior; they do not invent positive capacity, progress, or budget values. Existing action handlers and server commands remain the mutation authority.

No visual redesign was made. The canonical single-column product shell and shared navigation contracts are preserved by source inspection. Keyboard focus, reduced-motion behavior, overlays, themes, and the 390/440/768/1280px browser layouts were not re-verified because the authenticated-browser gate remains closed.

## 7. Final-source validation

Validation was run on the current working tree on 2026-10-11:

- Focused Plan and financial suite: **31 files, 201 tests passed**. This includes the three progressive-rendering route tests, budget/history/calculation/rollover/Goal funding tests, and reallocation/action tests.
- `npm run lint`: **passed**.
- `npm run typecheck`: **passed**.
- `npm run build`: **passed**; Next.js 16.3.1 compiled and generated all 111 static pages from the final current source.
- Targeted Prettier check for all changed Plan route, Plan query/export, tenancy constant, Next config, and focused Plan test files: **passed**. This report and the phase audit files are checked separately as part of closeout.
- `git diff --check`: **passed**.
- Full `npm run test -- --reporter=dot`: **264/267 files and 1,834/1,839 tests passed**. The five failures are in three groups outside the Plan touch set: English/Vietnamese savings message-key parity for `money.savingsPage.summaryCaption`; one Money privacy assertion expecting `break-words` while the current component uses `truncate`; and three Phase 6 account-presentation tests without `NextIntlClientProvider`. No Plan test failed.
- Full `npm run format:check` was not rerun. Earlier phase audits record repository-wide Prettier failures in unrelated files; this closeout checks the Plan changed-file set and report directly without reformatting unrelated files.
- Playwright, authenticated browser, and hosted fixture setup: **not run** because the credential rotation is unverified and the global setup writes records to the shared hosted backend.

## 8. Streaming evidence classification

Next.js 16.3.1 local streaming documentation describes Suspense boundaries as independent stream points. That framework behavior is not a measurement of these authenticated routes.

| Route         | Source-level dependency isolation                                                                             | Deterministic promise/component readiness                                              | Real route RSC chunk streaming | Browser first-useful-content timing |
| ------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------- |
| Plan Overview | Confirmed from the current period, financial, selector, Inbox, and Upcoming promises and their consumers.     | Confirmed by `plan-hub-critical-promise` and Plan hub tests.                           | Not observed.                  | Not measured.                       |
| Goal Detail   | Confirmed: selected Goal data is separate from delayed action references.                                     | Confirmed by seven deferred-promise tests in `plan-goal-detail-progressive-rendering`. | Not observed.                  | Not measured.                       |
| Jar Detail    | Confirmed: authorized Jar identity, budget, categories, action references, Inbox, and activity are separated. | Confirmed by six deferred-promise tests in `plan-jar-detail-progressive-rendering`.    | Not observed.                  | Not measured.                       |

Promise/component tests establish readiness independence only. They do not establish response chunk order, route navigation latency, useful-paint timing, or a performance improvement. No p50/p75 values are available.

## 9. Runtime verification blocker

Authenticated measurements remain deferred until the previously exposed E2E credential is confirmed rotated and a safe, already-existing read-only fixture/browser context is available. The shared Playwright global setup writes hosted Auth, household, Plan, and other financial fixtures, so it was not run. The personal Brave profile is not an approved substitute for that safe context.

No baseline/after route timings, RSC request counts, response bytes, browser tail, authenticated viewport/theme/focus checks, or live RLS behavior were collected. The structural source and deterministic test results are useful evidence, but they are not browser performance results.

## 10. Single future benchmark protocol

Run only after credential remediation is confirmed and safe existing read-only fixtures are available. Do not use fixture-writing setup or submit financial actions.

1. Use the same authenticated household, hosted backend, browser version/profile context, locale, theme, and viewport for the frozen pre-phase control and current implementation. Use interleaved warm samples, at least 10 per primary route; add cold samples only if the environment can be reset consistently.
2. Execute the combined navigation flow: **Bottom Navigation → Plan Overview → Jar Detail → Back → Plan Overview → Goals → Goal Detail → Back**. Keep back navigation behavior identical between control and candidate.
3. Timestamp Plan Overview milestones: period identity, Summary, Jar Rows, History selector, Attention, and Upcoming.
4. Timestamp Goal Detail milestones: Goal identity, funded progress, linked sources, and action controls ready.
5. Timestamp Jar Detail milestones: header, Financial Hero, Categories, Inbox, action controls, and recent activity.
6. Record RSC request count; request start, response headers, and body completion; decoded response bytes; first useful visible milestone; and browser tail/page completion. Preserve per-sample traces and report sample count plus p50/p75 only when the sample set supports them.
7. Compare the frozen control and candidate with the same environment and fixtures. Do not infer a speedup from source topology or promise tests.

## 11. Remaining work classification

- **Security/verification blocker:** credential rotation is unconfirmed; no approved authenticated read-only browser context is available; hosted RLS and real browser behavior have not been probed.
- **Measured performance regression:** none established; no runtime measurements exist.
- **Unmeasured structural opportunity:** route RSC chunk order, request waves, first-useful-content, and browser tail need the matched benchmark above.
- **Accepted technical debt:** Goal action-option loading still overlaps some selected-Goal/source work through the existing full `listGoals()` read. Retain until matched measurements justify a change.
- **Out of scope:** Phase 4, additional optimizations, UI redesign, financial formula/command/schema/policy changes, and unrelated repository cleanup.

**PLAN PERFORMANCE STRUCTURAL CLOSEOUT COMPLETE — RUNTIME VALIDATION DEFERRED**
