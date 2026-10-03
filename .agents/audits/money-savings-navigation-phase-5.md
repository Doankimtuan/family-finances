# Money → Savings navigation — Phase 5

Date: 3 October 2026, Asia/Ho_Chi_Minh. Scope: Money → Savings → Create → Back → existing Saving Detail. Phases 1–4 remain intact. One server-read optimization, no financial mutation, new dependency, RPC, migration, deployment, region change, or Phase 6 work.

Detail's warm readable-summary median improves **1,179.4 → 925.9 ms**, saving **253.5 ms / 21.5%**. The authenticated Detail request now embeds Saving cycles using the existing list projection. Critical remote requests decrease **4 → 3**, total remote requests **9 → 8**, and deferred requests remain **5** for the representative household-owned, active, one-cycle Saving with empty activity.

## Current baseline

Built a disposable production-mode copy of the current Phase 1–4 working tree, using installed Next 16.3.1, React 19.2.3, Supabase JS 2.109.0 and SSR 0.8.0. Local Mac Next server at port 3102, hosted development Supabase, headed Chromium at 440 × 900, normal motion, no throttling. Existing authenticated E2E user, 34 active Savings entries, same first actual Saving row as prior phases. No fixture writes.

One cold-ish full-flow pass, then three warm complete-flow repetitions in each arm, with 1.2-second idle spacing before every measured click. Return through the app's existing Detail/Savings Back links to Money between repetitions. The final control was captured **before production edits**, after an excluded selector/collection diagnostic and prototype had finished. The after arm used a restarted server and browser after repository checks finished. Both final arms ran without concurrent test/build/prototype workloads. Cold-ish means first recorded pass; database, JWKS and platform caches were not cleared. Initial Money entry primes the session path.

Capture-phase click timestamps; readiness checks followed by two animation frames; request-correlated server loader spans and real Supabase HTTP envelopes in disposable copies. No instrumentation added to production source. Browser demand and prefetch traffic are recorded separately. Stored evidence excludes credentials, cookies, token contents and financial row payloads.

Milestones:

- **Savings:** loaded `savings-list-content` visible, with ancestors at least 95% opaque.
- **Create:** enabled name and creation-mode controls readable; catalog/accounts readiness captured separately from `data-ready`. Every pass enters an unsaved name before options finish and verifies it survives.
- **Back:** restored loaded Savings content readable. Browser and server telemetry verify zero RSC/remote work.
- **Detail:** identity/principal/interest/rate readable plus cycle/date facts present; ancestors at least 95% opaque. Full data readiness separately requires resolved history/activity and the reference-dependent editor. Below-fold mounting is measured without scrolling; this is data readiness, not completion of every decorative transition.

Same-run warm medians, milliseconds:

| Transition               | Phase 5 control |   After | Saved | Improvement |
| ------------------------ | --------------: | ------: | ----: | ----------: |
| Money → Savings          |         1,129.4 | 1,124.1 |   5.3 |        0.5% |
| Savings → Create usable  |           362.2 |   362.2 |   0.0 |        0.0% |
| Create → Savings         |            42.4 |    48.6 |  -6.2 |      -14.6% |
| Savings → Detail summary |         1,179.4 |   925.9 | 253.5 |       21.5% |

Negative “saved” is a slower observation. Back's 6.2 ms median increase is within frame-scale variation; it retains zero network requests. Untouched Savings and Create serve as regression controls, not claimed optimization wins.

Full-data warm medians: Create **1,078.9 → 1,078.9 ms**; Detail **1,430.1 → 1,292.4 ms**. Deferred loaders are unchanged. Their network variance affects the latter; the first-summary and remote-wave evidence identify the targeted effect more directly.

Every recorded sample, milliseconds:

| Arm     | Pass     | Transition | First useful UI | Full data |
| ------- | -------- | ---------- | --------------: | --------: |
| Control | Cold-ish | Savings    |         1,725.7 |   1,725.7 |
| Control | Cold-ish | Create     |           362.4 |   1,112.3 |
| Control | Cold-ish | Back       |            46.4 |      46.4 |
| Control | Cold-ish | Detail     |         1,177.9 |   1,794.0 |
| Control | Warm 1   | Savings    |         1,177.9 |   1,177.9 |
| Control | Warm 1   | Create     |           363.6 |   1,130.3 |
| Control | Warm 1   | Back       |            43.7 |      43.7 |
| Control | Warm 1   | Detail     |         1,161.3 |   1,411.0 |
| Control | Warm 2   | Savings    |         1,129.4 |   1,129.4 |
| Control | Warm 2   | Create     |           362.2 |   1,078.9 |
| Control | Warm 2   | Back       |            42.4 |      42.4 |
| Control | Warm 2   | Detail     |         1,179.4 |   1,430.1 |
| Control | Warm 3   | Savings    |         1,106.8 |   1,106.8 |
| Control | Warm 3   | Create     |           360.1 |   1,060.1 |
| Control | Warm 3   | Back       |            41.7 |      41.7 |
| Control | Warm 3   | Detail     |         1,192.7 |   1,476.0 |
| After   | Cold-ish | Savings    |         1,946.7 |   1,946.7 |
| After   | Cold-ish | Create     |           361.4 |   1,161.5 |
| After   | Cold-ish | Back       |            57.7 |      57.7 |
| After   | Cold-ish | Detail     |         1,358.1 |   1,774.7 |
| After   | Warm 1   | Savings    |         1,495.7 |   1,495.7 |
| After   | Warm 1   | Create     |           361.6 |   1,128.3 |
| After   | Warm 1   | Back       |            42.0 |      42.1 |
| After   | Warm 1   | Detail     |           909.8 |   1,293.1 |
| After   | Warm 2   | Savings    |         1,124.1 |   1,124.2 |
| After   | Warm 2   | Create     |           362.2 |   1,078.9 |
| After   | Warm 2   | Back       |            48.6 |      48.7 |
| After   | Warm 2   | Detail     |           926.9 |   1,193.3 |
| After   | Warm 3   | Savings    |         1,110.0 |   1,110.0 |
| After   | Warm 3   | Create     |           378.3 |   1,078.3 |
| After   | Warm 3   | Back       |            49.2 |      49.2 |
| After   | Warm 3   | Detail     |           925.9 |   1,292.4 |

The after cold Detail sample is **180.1 ms slower** than control: its single embedded read takes **724 ms**, versus warm embedded reads around 280–295 ms. After cold Savings and warm-1 Savings are also slower despite identical code/request counts. No final sample was discarded. Three warm samples are observations, not a p95, production SLA, randomized A/B, or guarantee that every navigation improves. Readability/animation-frame marks approximate presentation opportunity rather than exact compositor timestamps.

## Critical remote-call map

Current Phase 1–4 control warm pass 2; starts are relative to click, operation durations are HTTP elapsed milliseconds. Only calls blocking first useful UI appear here.

| Transition                       | Remote operation              | Starts after / click offset |                                                         Duration | Blocks first useful UI?  | Dependency reason                                                                |
| -------------------------------- | ----------------------------- | --------------------------- | ---------------------------------------------------------------: | ------------------------ | -------------------------------------------------------------------------------- |
| Savings                          | getUser                       | client setup / 13 ms        |                                                              282 | Yes                      | Current verified remote user                                                     |
| Savings                          | active membership             | verified claims / 15 ms     |                                                              271 | Yes                      | Active household context; overlaps getUser                                       |
| Savings                          | Savings + embedded cycles     | session / 296 ms            |                                                              499 | Yes                      | Household-authorized list data                                                   |
| Savings                          | active owner-membership batch | Savings rows / 799 ms       |                                                              255 | Yes                      | Derives current ownership capabilities from returned owner IDs                   |
| Create                           | getUser                       | client setup / 7.6 ms       |                                                              268 | Yes                      | Same session contract                                                            |
| Create                           | active membership             | verified claims / 12.6 ms   |                                                              266 | Yes                      | Same household gate; overlaps getUser                                            |
| Back                             | None                          | cached history restoration  |                                                                — | No remote prerequisite   | Phase 2 still restores the existing entry                                        |
| Detail                           | getUser                       | client setup / 7.2 ms       |                                                              260 | Yes                      | Same session contract                                                            |
| Detail                           | active membership             | verified claims / 9.2 ms    |                                                              274 | Yes                      | Same household gate; overlaps getUser                                            |
| Detail                           | Saving primary                | session / 285.2 ms          |                                                              278 | Yes                      | Validates household/resource and obtains product/owner context                   |
| Detail                           | cycle history                 | Saving / 565.2 ms           |                                                              273 | Yes                      | Required financial summary and lifecycle selection                               |
| Detail, personal variant         | owner-membership validation   | Saving                      | Not exercised as a critical call by this household-owned fixture | Yes when owner ID exists | Preserves owner-active status/capabilities; currently overlaps standalone cycles |
| Detail, matured rollover variant | target-package validity       | trusted Saving/cycles       |                   Not timed in the representative active fixture | Yes when required        | Existing maturity warning must precede summary                                   |

Create has only two critical remote calls. Its provider catalog, accounts/currency, then balances/account owners are intentionally deferred. Detail's package menu, accounts/currency, account owners/balances and nonempty activity transactions are also deferred. A call can finish before the readable hero because the existing reveal is running without becoming a prerequisite for releasing summary DOM.

### Latency categories

**A — Necessary remote operation:** the current verified-user contract, active household membership, authorized financial data and active-owner capability evidence. Preserve their semantics. Their information is needed; their current number of HTTP requests is not inherently necessary.

**B — Application-created dependency:** Saving → cycles (removed here); list rows → owner-membership batch (retained); personal Detail rows → owner check (retained); conditional matured target-package check (retained). Data-dependent second requests can potentially be combined while preserving A.

**C — Infrastructure/service-path latency:** each required request from local Next to hosted Supabase includes network, gateway/service and response processing. SQL probes are millisecond-scale while observed HTTP takes hundreds of milliseconds. This establishes a large **non-SQL envelope**, not an exact attribution of all residual time to geographical distance. No per-hop timing or service breakdown is available. Region alignment requires a measured deployed-runtime comparison.

## Topology

| Environment                         | Next runtime region               | Supabase region        | Server → Supabase latency evidence                                                            |
| ----------------------------------- | --------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| Local production profiling          | Local Mac; not a Vercel runtime   | ap-southeast-2, Sydney | Exact-fixture warm single embedded read median 282.1 ms; sequential primary + cycles 533.7 ms |
| Current Vercel production           | **SIN1**, Singapore, Node.js 24.x | ap-southeast-2, Sydney | Same server-side lightweight-read latency unavailable                                         |
| Controlled nearby/colocated runtime | Not provisioned                   | Same project           | Not measured                                                                                  |

Supabase project metadata confirms `family-finances-2` (`bbzffxvgocjwsdbujvgn`), ACTIVE_HEALTHY, ap-southeast-2. Current [Vercel Functions settings](https://vercel.com/doankimtuans-projects/family-finances/settings/functions) show `sin1`, Fluid Compute enabled, one-region Hobby plan. The repository has no `vercel.json`, region override, or `preferredRegion` setting.

Live [production deployment resources](https://vercel.com/doankimtuans-projects/family-finances/5UYEbL2ACDqzfehCGkfKH6CkKMDq/resources?q=savings) confirm SIN1 for Savings, Create and Detail. Current production is Ready, deployment `dpl_5UYEbL2ACDqzfehCGkfKH6CkKMDq`, source `059a9ca4e28b56b36a81506448b56471a1700a5c` from 26 September. It **does not contain the current uncommitted Phase 1–4 implementation**, so production flow timings would not be a same-code comparison.

The Vercel connector returned no accessible teams and a 403 for the project scope; the existing authenticated browser supplied read-only settings/resource evidence. The deployed version exposes no suitable narrow read-timing endpoint or available request-level Supabase timing. Existing source instrumentation is environment-gated and was not enabled or deployed. Safely timing the same query from that runtime would require a separately authorized instrumented deployment/controlled runtime. No browser TTFB or client→Supabase measurement is substituted for server→Supabase latency. No infrastructure change or estimated region speedup is proposed.

## Session security investigation

The current session path starts `getUser`, locally verifies `getClaims().sub`, overlaps `resolveActiveMembership(subject)`, then requires matching user/subject/membership identities. React request caches deduplicate this gate; every measured demand navigation has one remote user and one active-membership lookup. Back has neither. No refresh-token request appears in final measured navigations; expired initial storage was replaced using the configured E2E login before collection.

[Current Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client#choosing-an-auth-method) supports verified claims for identity and distinguishes them from a fresh remote user record. Asymmetric JWT verification uses WebCrypto and cached JWKS; symmetric-key verification requires Auth. A verified signature/expiry does not itself establish fresh user state or immediate logout/session revocation. [Supabase session guidance](https://supabase.com/docs/guides/auth/sessions) documents access-token lifetime and session checks.

This application's `get-verified-auth-subject` explicitly does not replace `getUser`; the gate and its tests reject claims-only identity, failed/deleted/unavailable remote user, mismatched subjects and inactive/missing membership. Sign-out invokes Supabase signOut; account deletion also signs out. The code does not validate `session_id` against `auth.sessions`, so **do not claim getUser guarantees immediate revocation of every still-valid access token**. Phase 5 preserves existing freshness/security assumptions instead of redefining the threat model. No cookie-derived user, user_metadata authorization, claims-only replacement, browser assertion, cross-request identity cache or service-role read was introduced.

Supabase changelog and current SSR/PostgREST documentation were reviewed. The recent PostgreSQL minor-release extension/operator compatibility notice does not require a change for this projection; no extension/operator/schema change is made.

## Candidate optimizations

| Candidate                                    | Measured cost/opportunity                                                                    | Security implications                                                                                                                         | Complexity                                                                          | First-useful-UI effect / decision                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Detail embeds full lifecycle cycles          | Standalone cycles warm median 278 ms; exact-fixture prototype saves 251.6 ms of read elapsed | Same FK, authenticated client, parent household filter and existing RLS; owner check retained                                                 | Reuse existing list projection/mapper; no DB deployment                             | Removes one sequential critical round trip; selected                                          |
| Savings embeds active owner metadata         | Existing owner batch warm median 267 ms                                                      | Need equivalent household-scoped, active-owner evidence; owner ID alone is insufficient                                                       | Existing composite FK could support embed; needs its own mapping/security prototype | Plausible next narrow candidate; not implemented or benchmarked as a collapsed query here     |
| Detail overlaps speculative cycles           | Same standalone cycle cost                                                                   | Would start a read before application parent authorization; can household-scope through parent/RLS, but introduces extra denied/missing reads | Additional query coordination and security proof                                    | Existing embed is simpler and avoids the extra request                                        |
| Replace getUser with locally verified claims | Remote user warm medians 257–282 ms, already overlapped with membership                      | Loses fresh remote-user agreement; changes established session contract                                                                       | Broader auth change                                                                 | Removal would not save the full user duration because membership remains; rejected this phase |
| Create-specific RPC/account tuning           | Account pipeline about 747 ms in representative sample                                       | Existing eligibility/security must remain                                                                                                     | Extra backend contract or shared-loader work                                        | Does not shorten initial usable Setup; excluded                                               |
| Detail action-reference tuning               | About 543 ms after authorized Detail in representative sample                                | Existing mutation authority remains required                                                                                                  | Separate account/reference work                                                     | Outside summary await boundary; excluded                                                      |
| Narrow new RPC                               | Could combine same Saving/cycle wave                                                         | Would require auth, RLS, grants and invoker/definer proof                                                                                     | New migration/backend API                                                           | Existing PostgREST embed already solves measured wave; unnecessary                            |
| Region alignment                             | Singapore/Sydney separation confirmed; comparative latency unknown                           | No auth benefit; operational deployment decision                                                                                              | Isolated runtime experiment                                                         | No invented saving or permanent region change                                                 |

The Detail cycle wave is the slightly larger measured critical opportunity than the owner batch, and has an already-shipped embed to reuse. Only that candidate was implemented.

## Selected optimization and prototype

Read-only prototype uses the same authenticated SSR client, same existing Saving, same parent ID/household filters, exact existing Detail fields and exact cycle fields. Alternate current/embed order across four passes. Payload equality compares primary fields and all cycle rows after normalizing cycle order. **Equivalent: true; one cycle.** No owner validation is omitted from production; this fixture has no Saving owner ID, so its critical owner lookup is a no-op.

| Pass     | Read    | HTTP + response parse ms | JSON payload bytes | Saving/cycle mapping ms |
| -------- | ------- | -----------------------: | -----------------: | ----------------------: |
| Cold-ish | current |                    933.6 |               3073 |                   1.133 |
| Cold-ish | embed   |                    348.3 |               3090 |                   0.071 |
| Warm 1   | embed   |                    304.3 |               3090 |                   0.057 |
| Warm 1   | current |                    533.7 |               3073 |                   0.092 |
| Warm 2   | current |                    534.8 |               3073 |                   0.113 |
| Warm 2   | embed   |                    262.8 |               3090 |                   0.106 |
| Warm 3   | embed   |                    282.1 |               3090 |                   0.086 |
| Warm 3   | current |                    523.9 |               3073 |                   0.071 |

Warm medians: sequential **533.7 ms**, embed **282.1 ms**, saved **251.6 ms / 47.1%** of this read stage. Payload **3,073 → 3,090 bytes**, +17 bytes for the nested relation key/envelope. Mapping medians are about **0.092 → 0.086 ms**; no mapping optimization is claimed. JSON bytes describe decoded response payload, not compressed wire bytes.

Read-only `EXPLAIN ANALYZE` under the authenticated role/current JWT subject measured representative base SQL **2.109 ms**, cycles **1.430 ms**, combined Saving/nested-cycle SQL **0.884 ms**, with indexed lookups and RLS. These are separate probes with different cache states, **not the exact generated PostgREST statement including all provider/account embeds**, and do not prove faster SQL. They bound representative DB work at a very different scale from hosted HTTP. Exact PostgREST SQL/edge processing breakdown remains unavailable; the real authenticated HTTP comparison is the selection evidence.

[PostgREST resource embedding](https://postgrest.org/en/stable/references/api/resource_embedding.html) resolves FK-based related resources within one request. The explicit `saving_cycles_saving_id_fkey` already disambiguates the relation on the list path. No GraphQL or new RPC is needed.

## Implementation

Phase 5 production touch set:

- `modules/savings/application/queries/list-savings.ts`: Detail selects the existing `SAVING_LIST_SELECT` with full cycle embed; removes duplicated Detail projection and standalone cycle request; maps embedded rows using existing helpers.
- `tests/unit/savings-list-orchestration.test.ts`: updates mocked transport contract, adds denied-session, malformed-read, ownership and unordered-lifecycle regression coverage; removes the obsolete separate-cycle mock.
- This report and `money-savings-navigation-phase-5-evidence.json`: same-run results, remote timelines, prototype/security/browser evidence and limits.

Active-cycle interest computation, `selectCurrentSavingCycle`, descending history sorting, funding/settlement transaction links, maturity warnings, owner-membership validation and all financial formulas remain unchanged. Detail/activity still share one request-cached authorized read. `getSaving` remains uncached and continues to delegate the same shared loader, now using its embed; mutation authorization is not cached or skipped. Standalone `listSavingCycles` is unchanged. No route, JSX, progressive boundary, client behavior or presentation was modified.

A combined query failure logs `GET_SAVING` and returns null. Previously a successful primary plus a failed standalone cycles query could return a partial Saving with empty cycles. The combined read now fails closed instead of displaying that partial financial summary. An actually successful read with no visible cycles still maps an empty cycle list. No automatic fallback adds a second request.

## Security

Deployed policies were inspected read-only. Savings SELECT requires `active_membership_id(household_id) IS NOT NULL`; cycle SELECT requires an accessible parent Saving and active household membership. `active_membership_id` checks `household_id`, `auth.uid()` and `is_active = true`. Household-member SELECT is household-member scoped. The composite owner FK and the explicit cycle FK are deployed.

The embed uses existing tables/RLS and the normal authenticated cookie client. Parent `id` and gated `household_id` filters remain. Nested rows are constrained by FK and existing cycle RLS; they do not trust a client household/owner/transaction assertion. Personal Savings are household-visible under the existing contract, with ownership governing mutation capability: a partner's personal Saving remains readable and non-actionable. Owner validation is neither removed nor inferred from mere owner-ID presence.

No new database function exists: search_path, SECURITY INVOKER/DEFINER choice and EXECUTE grants are unchanged, so new-RPC grant tests are not applicable. Anonymous live SELECT remains denied with **42501**. Existing privileged RLS helpers were inspected, not altered; no service-role application path was introduced.

| Case                              | Evidence                                                                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unauthenticated                   | Detail gate unit rejects before data/client access; live anonymous embedded REST read rejected; live anon SQL SELECT denied                                                  |
| Inactive/missing membership       | NO_MEMBERSHIP gate test, active-membership resolver/session tests, deployed `is_active` predicate; authenticated SQL identity without membership sees 0 Savings and 0 cycles |
| Different household               | Gated household filter and separate-request isolation tests; live mismatching-household embedded REST read returns no row                                                    |
| Another owner's personal resource | Ownership test preserves read-only capability; live existing partner-owned Detail renders without action editor                                                              |
| Household resource                | Ownership test allows existing capability; live authorized RLS probe returns one Saving and one cycle                                                                        |
| Missing Saving                    | Unit missing/inaccessible case, embedded REST no row, browser missing state without financial summary                                                                        |
| Malformed ID                      | Unit failed read returns null before ownership work; live REST returns 22P02                                                                                                 |
| Normal active resource            | Exact payload equivalence, interest/current-cycle/history tests, all benchmark summaries/actions resolve                                                                     |
| Unordered/multiple cycles         | Unit retains lifecycle priority, recomputed interest and descending history                                                                                                  |

Fixture limits: the hosted project currently has **zero inactive membership rows and zero Savings outside the benchmark household**. No financial fixtures were created. Actual foreign-household-resource/inactive-row live permutations therefore are not claimed; boundary tests and inspected deployed RLS cover those conditions. A mismatching filter/no-membership identity is not misrepresented as an existing cross-household fixture.

## Performance and remote requests

Representative warm pass 2, click = 0:

| Operation                       | Control start / duration | After start / duration | Critical after?       |
| ------------------------------- | ------------------------ | ---------------------- | --------------------- |
| Session gate                    | 6.2 / 278 ms             | 8.6 / 281 ms           | Yes                   |
| Saving primary / combined embed | 285.2 / 278 ms           | 289.6 / 295 ms         | Yes                   |
| Standalone cycles               | 565.2 / 273 ms           | Removed                | No separate request   |
| Authorized Detail total         | 284.2 / 554 ms           | 289.6 / 297 ms         | Yes                   |
| Deferred accounts               | 839.2 / 543 ms           | 587.6 / 560 ms         | No                    |
| Deferred package menu           | 839.2 / 275 ms           | 587.6 / 274 ms         | No for active fixture |
| Empty activity loader           | 839.2 / 1 ms             | 587.6 / 2 ms           | No                    |
| Readable summary                | 1,179.4 ms               | 926.9 ms               | User milestone        |
| Full data                       | 1,430.1 ms               | 1,193.3 ms             | Separate milestone    |

The summary release advances by one remote wave; the existing reveal still contributes about 340 ms before readable content. No animation or deferred-loader tuning was performed.

For the representative Detail demand request, **every** cold/warm sample has these counts:

| Remote operation                                       | Before | After |
| ------------------------------------------------------ | -----: | ----: |
| getUser, critical                                      |      1 |     1 |
| active membership, critical                            |      1 |     1 |
| Saving / Saving + cycles, critical                     |      1 |     1 |
| standalone cycles, critical                            |      1 |     0 |
| Saving-owner validation, critical for personal variant |      0 |     0 |
| deferred packages                                      |      1 |     1 |
| deferred accounts                                      |      1 |     1 |
| deferred household currency                            |      1 |     1 |
| deferred account-owner validation                      |      1 |     1 |
| deferred balances RPC                                  |      1 |     1 |
| **Critical remote calls**                              |  **4** | **3** |
| **Deferred remote calls**                              |  **5** | **5** |
| **Total remote calls**                                 |  **9** | **8** |

Critical sequential waves are **session → Saving → cycles** before and **session → Saving+cycles** after. Personal owner validation can retain a second post-Saving wave; its semantics are preserved and no universal one-read owner-capability claim is made. Matured warnings/nonempty activity can add existing conditional calls.

Other transition totals remain Savings **4 → 4**, Create **7 → 7**, Back **0 → 0**. Each measured destination has one demand RSC request; Back has zero. Phase 4 activity does not reread Saving/cycles; account-owner validation is distinct from active-session membership. Deferred reference reads are server-side, with no client-fetch duplication. Prefetch/return-to-Money traffic is outside these demand-request totals.

## Browser verification and validation

Authenticated complete flow passed four times per arm. All measured main/viewport nodes persist; Detail identity and Create name input retain their node across deferred data resolution. Every early unsaved name survives. Separate smoke verifies exact native Back-entry restoration while Create is still streaming, and ordinary Detail browser Back.

Detail checks passed at 390/440/768/1280 px, EN/VI, light/dark, normal/reduced motion: no document overflow, app shell at most 440 px, correct theme and no reduced-motion transform. Existing linked activity, missing Saving, household summary and partner-owned personal read-only Detail resolve. EN/VI edit Sheet keyboard opening, visible focus containment, Escape closing and discarded unsaved configuration on reopening pass. No Save/Confirm/financial action was submitted. Screenshots in ignored `output/playwright/phase5-*`; 440 EN/light, 390 VI/dark and 1280 EN/light were visually inspected. This is retained-control/browser evidence, not a new full WCAG audit.

- Focused Savings/session/Create/Detail regression collection: **18 files, 174 tests passed**. Final orchestration after deleting the obsolete mock: **28 tests passed**.
- Full `npm run test`: **247 files passed / 3 failed; 1,654 tests passed / 5 failed**. Five failures reproduce in the untouched Phase 1–4 control copy: i18n key parity (1), Money wrapping (1), account presentation missing NextIntl context (3). The earlier date-sensitive Savings failure does not reproduce on this run; no unrelated fix was made.
- `npm run lint` passed; final production/test scoped ESLint passed.
- `npm run typecheck` remains blocked solely by existing Home translator TS2322 at `home-streaming-sections.tsx:99,340`. No Phase 5 source/test error.
- Normal repository production build compiled but failed the same pre-existing Home typecheck. Both disposable profiling production builds succeeded with scratch-only `typescript.ignoreBuildErrors` and Turbopack root workaround; repository Next config unchanged. This does not establish a clean strict production build.
- `npm run test:e2e` with a disposable read-only config and the existing authenticated session/reload smoke: **1 passed**. Fixture-writing global hooks and financial-mutation suites were omitted; the scoped browser flow above verifies Savings.
- `npm run format:check`: **193 pre-existing files** with style issues; final touched source/tests/report/evidence pass targeted Prettier.
- `refactor-review` applied against pre-Phase-5 snapshots and the full working-tree touch set: no new domain literals, dependencies, cache layer, production client state/effects, dead cycle mock, weakened gate or financial formula change. One existing projection replaces a duplicate and a second request. Prior-phase/user edits remain intact.

Companion: [machine-readable evidence](money-savings-navigation-phase-5-evidence.json). Disposable servers/browser and credential-bearing copies/auth state are cleaned up; sanitized evidence and scripts remain local. No commit or deployment was created.

## Architecture conclusion

**RSC:** retains authenticated server orchestration and progressive Create/Detail rendering. Earlier summary is achieved within the existing architecture.

**CSR:** would still need authenticated remote financial reads; current evidence does not justify moving the flow to browser fetching or weakening the server gate.

**GraphQL:** **GraphQL still does not address a measured transport-specific bottleneck.** Existing PostgREST embedding removes the measured critical wave with equivalent data/RLS. No migration.

**Purpose-built RPC/read models:** useful only if a later measured dependency cannot be expressed cleanly through existing projection/embed/request structure. This phase needs no new backend function.

**Deployment-region alignment:** Singapore/Sydney topology is confirmed. Its latency benefit is unmeasured and cannot be inferred from local Mac results. A later isolated same-query/current-runtime-versus-nearby-runtime experiment is required before changing regions.

## Remaining bottleneck

Savings still waits for its embedded list read (warm median 494 ms) then active-owner batch (267 ms). Create first usable Setup is mostly the existing overlapped session gate plus release/rendering. Normal Detail now waits for session then the combined read, with an unchanged identity reveal; personal/matured variants retain their required owner/target checks. Full reference readiness remains outside the first-summary critical path. No further optimization or Phase 6 implementation was started.

## Decision

One measured critical remote wave is removed, payload/lifecycle/security behavior is covered, progressive architecture survives browser verification, and controls retain their request maps. Production-region latency and unavailable live fixture permutations remain explicitly bounded investigations, not invented results.

**PHASE 5 SUCCESS — PROCEED TO PHASE 6**
