# Money → Savings navigation — Phase 1

## Implementation

Phase 1 reuses `getSessionMembership()` at the beginning of the Savings list, Create, and Detail pages. No shared helper or domain loader changed. Each page retains its locale setup and its existing Login/Onboard redirects.

Application files changed:

- `app/[locale]/(product)/money/savings/page.tsx`
- `app/[locale]/(product)/money/savings/new/page.tsx`
- `app/[locale]/(product)/money/savings/[id]/page.tsx`

Test files updated: `tests/unit/session-membership.test.ts` and `tests/unit/savings-page-no-write-on-render.test.ts`.

Previously, each page awaited `getSessionUser()`, then `resolveActiveMembership(user.id)`, then domain loaders. The domain allowance subsequently called the shared parallel resolver, but both expensive operations had already completed serially and were cached. ProductLayout does not rerun for these client transitions, so its parallel session gate did not eliminate the destination-page waterfall.

Now each page awaits the canonical session context once. The existing resolver starts remote `getUser()` immediately, awaits verified `getClaims().sub`, and starts the active-membership query from that verified subject while `getUser()` is pending. It releases the context only after both complete and identity checks pass. Domain reads begin after that gate. No new auth architecture, cache, dependency, or production instrumentation was added.

```tsx
const { user, membership } = await getSessionMembership();
if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });
```

## Correctness

- Remote user verification remains mandatory. Claims alone cannot authenticate a request; absent/invalid subject or failed `getUser()` rejects the session.
- Membership still comes from the server-side `user_id = verified subject` and `is_active = true` query. The resolver checks both `user.id === subject` and `membership.userId === user.id`. A mismatched identity fails closed to Login; an authenticated user without membership goes to Onboard.
- Money allowance, ownership checks, household-scoped queries, and RLS remain intact. Domain loaders receive no new client-supplied user or household IDs. No database policy, schema, credentials, or service-role path changed.
- Existing React `cache()` wrappers remain scoped to the server request. Domain consumers reuse the page’s resolved context. Unit tests simulate request boundaries rather than implementing a real RSC dispatcher; actual RSC telemetry independently confirms deduplication.
- Focused coverage includes valid members; unauthenticated and missing/invalid claims; missing membership; mismatched claims/user and cross-user membership; same-request overlap/deduplication; separate-request isolation; existing localized redirects; and Savings render purity. The new page test checks rejected sessions redirect before any Savings read.

## Performance

### Methodology and limits

Read the existing investigation and its evidence; repeated its benchmark without changing selectors, waits, destination markers, or app Back behavior. One cold-ish pass followed by three warm repetitions of Money → Savings → Create → app Back → Savings → first existing Saving Detail. Same local production build on port 3102, 440 × 900 headed Chromium viewport, same hosted Supabase project `bbzffxvgocjwsdbujvgn` (ap-southeast-2), same authenticated test user and existing Saving. Repetitions return through existing app Back links in the same document; no page reload between repetitions. No financial fixture or data mutation was performed.

An initial diagnostic collection overlapped repository checks on the host. It was excluded before locking results; the reported collection repeats the complete same methodology with a restarted profiling server and fresh browser after all checks finished. Selectors, waits, app Back links, instrumentation, sample count, and data requirements were unchanged. This rerun controls an identified workload confound rather than selecting individual fast samples.

The stored auth state had expired and its refresh token was rejected. Signed in using the already configured E2E account before the benchmark. Login/initial refresh attempts are excluded from all transition measurements; there are zero refresh-token requests in the 16 measured transitions. This refresh makes the session age different from the baseline. “Cold-ish” still means the first measured route pass, not a cleared CDN/DB/JWKS cache.

Used the same disposable production-copy instrumentation: browser capture-phase click timestamps, mutation commit followed by two animation frames for visible content, CDP network/performance and third-warm browser trace, server HTTP envelopes and loader spans, and Supabase fetch spans. Timings are observations on a local Mac against a remote DB, not deployment latency guarantees. Background prefetch is distinguished from demand RSC requests. No benchmark instrumentation was written into application source.

Baseline gate values are the earlier serial `getUser` + membership span sums. After values are direct `loadSessionMembership` start-to-context-ready spans, including client setup and verified-subject work. Those small extra steps make the after metric slightly broader. Warm medians use only passes 1–3. Before and after are successive runs, not paired requests: network variation and hosted-service variance prevent attributing every total-navigation delta to this change.

### Session gate — warm medians

| Transition       | Before gate | After gate |  Saved | Reduction |
| ---------------- | ----------: | ---------: | -----: | --------: |
| Money → Savings  |      732 ms |     575 ms | 157 ms |     21.5% |
| Savings → Create |      546 ms |     306 ms | 240 ms |     44.0% |
| Create → Savings |      535 ms |     357 ms | 178 ms |     33.2% |
| Savings → Detail |      539 ms |     287 ms | 252 ms |     46.7% |

Every measured request overlaps auth and membership. Observed overlap ranges from 250 to 545 ms. The gate now tracks the slower operation plus verified-claims/setup overhead, instead of adding both operation durations. Membership still must wait for verified claims; domain reads still must wait for the complete authenticated context.

### Complete navigation — warm medians

| Transition       |   Before |    After |  Saved |            Change |
| ---------------- | -------: | -------: | -----: | ----------------: |
| Money → Savings  | 1,904 ms | 1,743 ms | 161 ms |  8.5% improvement |
| Savings → Create | 1,357 ms | 1,108 ms | 249 ms | 18.4% improvement |
| Create → Savings | 1,382 ms | 1,195 ms | 187 ms | 13.6% improvement |
| Savings → Detail | 2,435 ms | 1,628 ms | 807 ms | 33.1% improvement |

All four complete-navigation warm medians are lower in the final quiet collection. These are observations from three warm samples, not controlled statistical guarantees. Direct overlap spans provide stronger evidence of the isolated gate change than the complete-navigation deltas; faster or slower domain HTTP calls also influence total time.

### Every measured transition

All timestamps below are milliseconds relative to click = 0. Start/Ready/Domain are server wall-clock spans aligned to the browser click; submillisecond differences can reflect log rounding. Auth and Member are operation durations, not sequential intervals.

| Pass     | Transition       | Visible | Session start | Auth | Member | Context ready | Domain begins | Gate |
| -------- | ---------------- | ------: | ------------: | ---: | -----: | ------------: | ------------: | ---: |
| Cold-ish | Money → Savings  |    1259 |            12 |  355 |    352 |           368 |           368 |  356 |
| Cold-ish | Savings → Create |    1258 |            13 |  264 |    352 |           370 |           370 |  357 |
| Cold-ish | Create → Savings |    2075 |            11 |  260 |    267 |           290 |           290 |  279 |
| Cold-ish | Savings → Detail |    1595 |            11 |  305 |    259 |           317 |           317 |  306 |
| Warm 1   | Money → Savings  |    1528 |            24 |  560 |    545 |           653 |           653 |  629 |
| Warm 1   | Savings → Create |    1108 |            14 |  269 |    255 |           284 |           284 |  269 |
| Warm 1   | Create → Savings |    1144 |            10 |  270 |    264 |           284 |           284 |  274 |
| Warm 1   | Savings → Detail |    1696 |             6 |  336 |    333 |           342 |           342 |  336 |
| Warm 2   | Money → Savings  |    1840 |            40 |  554 |    561 |           615 |           615 |  575 |
| Warm 2   | Savings → Create |    1262 |             9 |  324 |    320 |           334 |           334 |  325 |
| Warm 2   | Create → Savings |    1491 |            14 |  639 |    378 |           653 |           653 |  639 |
| Warm 2   | Savings → Detail |    1626 |            25 |  266 |    270 |           303 |           303 |  279 |
| Warm 3   | Money → Savings  |    1743 |            24 |  470 |    456 |           495 |           495 |  470 |
| Warm 3   | Savings → Create |    1044 |            11 |  305 |    299 |           316 |           316 |  306 |
| Warm 3   | Create → Savings |    1195 |             9 |  357 |    341 |           367 |           367 |  357 |
| Warm 3   | Savings → Detail |    1628 |             8 |  287 |    267 |           296 |           296 |  287 |

### Remote request counts

| Transition       | Before Auth/REST HTTP | After, every pass | Remote getUser | Active membership | Refresh | Server client |
| ---------------- | --------------------: | ----------------: | -------------: | ----------------: | ------: | ------------: |
| Money → Savings  |                     4 |                 4 |              1 |                 1 |       0 |             1 |
| Savings → Create |                     7 |                 7 |              1 |                 1 |       0 |             1 |
| Create → Savings |                     4 |                 4 |              1 |                 1 |       0 |             1 |
| Savings → Detail |                    10 |                10 |              1 |                 1 |       0 |             1 |

Counts cover actual server Supabase HTTP calls inside the demand request, not browser RSC requests or logical helper calls. Create and Detail also contain a separate owner-membership validation query, which is existing domain work and is not duplicate active-session resolution. No extra Auth/REST calls appeared. Verified claims execute in proxy and the RSC resolver; local verification adds no remote `/user`, token, or JWKS call in these samples. Parent providers/viewport/main remain retained.

### Representative server timelines

**Savings → Create, warm pass 1** (click = 0; visible at 1108 ms):

| Operation                            | Begins after click | Duration | Finishes after click |
| ------------------------------------ | -----------------: | -------: | -------------------: |
| `auth.getClaims`                     |               8 ms |     3 ms |                11 ms |
| `loadSessionMembership`              |              14 ms |   269 ms |               284 ms |
| `createSupabaseServerClientUncached` |              14 ms |     0 ms |                15 ms |
| `auth.getClaims`                     |              15 ms |     5 ms |                20 ms |
| `auth.getUser`                       |              15 ms |   269 ms |               284 ms |
| `membership.resolve`                 |              20 ms |   255 ms |               275 ms |
| `loadAccounts`                       |             284 ms |   786 ms |              1070 ms |
| `listProviderCatalog`                |             284 ms |   282 ms |               565 ms |

**Savings → Detail, warm pass 2** (click = 0; visible at 1626 ms):

| Operation                            | Begins after click | Duration | Finishes after click |
| ------------------------------------ | -----------------: | -------: | -------------------: |
| `auth.getClaims`                     |              11 ms |     7 ms |                18 ms |
| `loadSessionMembership`              |              25 ms |   279 ms |               303 ms |
| `createSupabaseServerClientUncached` |              25 ms |     0 ms |                25 ms |
| `auth.getClaims`                     |              25 ms |     8 ms |                33 ms |
| `auth.getUser`                       |              25 ms |   266 ms |               291 ms |
| `membership.resolve`                 |              33 ms |   270 ms |               303 ms |
| `loadSavingDetail`                   |             303 ms |   526 ms |               829 ms |
| `listSavingsFinancialActivities`     |             829 ms |   308 ms |              1137 ms |
| `loadProviderPackages`               |             829 ms |   308 ms |              1138 ms |
| `loadAccounts`                       |             829 ms |   774 ms |              1603 ms |

Create starts account and provider loading only when the context is ready. Detail starts its core Saving/cycles load after the gate, then waits for activity, package, and account loaders after core detail resolves. The parent layout is not recreated on these demand navigations.

## Validation

- Focused auth/gate/render command: 5 files, **33 tests passed**.
- Relevant Savings + focused auth command: 15 files, **127 passed / 1 failed**. The failure is `savings-domain.test.ts` → “rejects a historical opening dated today”; it reproduces in the untouched pre-Phase-1 profiling copy under the current date, so it is not caused by this gate change.
- Full unit suite: **241 files passed / 4 failed; 1,602 tests passed / 6 failed**. Five failures are the previously documented i18n parity (1), Money card wrapping (1), and missing NextIntl context in accounts presentation (3). The sixth is that independently reproduced date-sensitive Savings test. No Phase 1 regression remains in the focused tests.
- Full repository lint passed; final scoped lint passed.
- Typecheck still fails only at the two previously documented Home translator assignments (`home-streaming-sections.tsx:99,340`, TS2322). No error in the five Phase 1 source/test files.
- Disposable profiling production build succeeded, using the same scratch-only `typescript.ignoreBuildErrors` and Turbopack root workaround as the baseline. This does **not** establish a clean normal production build: strict typecheck is still blocked by the existing Home errors. Repository Next config was untouched.
- Test formatting passed. Existing unrelated page formatting was preserved to avoid expanding the implementation diff. Scoped before-file comparison and final refactor/security review confirm only session imports/gates changed in the three pages; no domain, Back, prefetch, UI, provider, or data requirement change.
- No broad write-oriented E2E suites were run; the actual authenticated browser benchmark exercises all scoped destinations read-only. Existing unrelated working-tree edits were preserved; no commit includes them.

## Remaining bottlenecks

Unchanged domain work dominates after the gate: list domain envelopes have a warm median of 1142 ms, Create 784 ms, and Detail 1298 ms. Create still waits for its account pipeline; Detail still serializes core Saving/cycle data before its secondary account/activity/package stage. The representative Detail account stage takes 774 ms after a 526 ms core load. These remain future-phase targets, not Phase 1 changes.

Membership/network variation is still visible: the Money → Savings warm membership durations are 545 / 561 / 456 ms, compared with the earlier serial baseline gate median of 732 ms. Remote operation variance limits the observed list gate gain despite removing the serialization. The final list gate warm median is still 575 ms. In the excluded contended collection, membership alone reached 841 ms, illustrating why expected improvements should not be manufactured. Client finishing work remains much smaller than the multi-stage remote-data wait.

## Decision

All six Phase 1 criteria are satisfied: existing authenticated gates retained; request-local canonical context reused; no duplicate remote auth/membership work; direct measurements confirm overlap and lower gate medians; exact four-transition benchmark rerun with all 16 final samples; implementation limited to three page gates plus focused tests. All four final gate and complete-navigation medians improved; small sample size and remote-service variance remain explicit limitations. Phase 2 has not been implemented.

**PHASE 1 SUCCESS — PROCEED TO PHASE 2**
