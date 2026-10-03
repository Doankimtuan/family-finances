# Money → Savings navigation — Phase 6

Date: 3 October 2026, Asia/Ho_Chi_Minh. Scope: Savings list ownership validation only. Read the original performance audit and Phase 1–5 reports before investigating. Existing working-tree changes from those phases were preserved.

**Money → Savings improves 1,193.7 → 890.2 ms warm median, saving 303.5 ms (25.4%).** Critical and total remote requests decrease **4 → 3**. The sequential owner-membership request is gone. No RPC, migration, dependency, financial fixture write, GraphQL, CSR, session change, UI change, or Phase 7 work.

## Existing ownership model

`owner_membership_id` identifies a household membership, not an auth user. The viewer membership comes from the unchanged authenticated Money gate. `listActiveMembershipIds` formerly queried only `id`, constrained by household, `is_active = true`, and discovered owner IDs. Neither owner user ID, role, display name nor email is needed.

`mapSavingRow` delegates to `resolveFinancialCapabilities`:

| Saving                                    | Read visibility for active household viewer | Owner status                            | `canMutate` |
| ----------------------------------------- | ------------------------------------------- | --------------------------------------- | ----------- |
| Household, no owner                       | Visible                                     | Active                                  | Yes         |
| Household, inactive owner                 | Visible                                     | Active (existing household convention)  | Yes         |
| Viewer personal, active owner             | Visible                                     | Active                                  | Yes         |
| Partner personal, active owner            | Visible                                     | Active                                  | No          |
| Personal, inactive/former owner           | Visible                                     | Former                                  | No          |
| Personal, missing/inaccessible membership | Visible                                     | Former                                  | No          |
| Personal, no owner ID                     | Visible                                     | Active (existing null-owner convention) | No          |

`isOwnedByMe` is personal scope plus matching viewer membership. Mutation additionally requires active owner evidence. Readability alone never grants personal mutation rights. Database Savings SELECT uses active household membership; UPDATE uses `can_mutate_financial_resource`. Server commands and policies remain authoritative and unchanged.

## Same-run baseline

Disposable production-mode copies of the current Phase 1–5 source and final Phase 6 source, same installed dependencies, local Mac server on port 3102, development Supabase in Sydney, existing authenticated E2E fixture. Headed Chromium at 440 × 900, normal motion, no throttling. Fresh browser contexts and app server process per arm; initial Money document entry primes the session path. Database and CDN caches were not flushed. Control authentication briefly rendered Home before Money; cold-ish samples are observational, not a clean database-cold comparison.

Before production edits: one cold-ish Money → Savings → Create → Back → Detail pass, then three warm full-flow repetitions. After implementation: repeat exactly the same script. All final samples are retained; failed login/setup diagnostics were excluded before the measurement run. No builds, tests or prototype reads ran concurrently with either final navigation benchmark.

Capture-phase click timing, request-correlated loader spans and real Supabase fetch envelopes were added only to disposable copies. Savings readiness is the loaded `savings-list-content` with nonzero geometry and ancestors at least 95% opaque, followed by two animation frames, matching Phase 5. This does not claim every staggered row animation has finished. HTTP envelopes end at response headers; the loader-ready milestone includes body decoding and mapping. Prototype HTTP timings below include full response bodies.

Warm medians, ms. Delta means Phase 6 minus control; medians are computed per metric and should not be summed.

| Metric                            | Control | Phase 6 |  Delta |
| --------------------------------- | ------: | ------: | -----: |
| Session gate                      |   302.0 |   292.0 |  -10.0 |
| Savings read stage (HTTP headers) |   513.0 |   502.0 |  -11.0 |
| Owner second wave (HTTP headers)  |   281.0 |     0.0 | -281.0 |
| List model ready, from click      | 1,115.0 |   820.3 | -294.7 |
| Savings visible, from click       | 1,193.7 |   890.2 | -303.5 |

All milestones below are milliseconds after click. Gate ready is the end of the session span; model ready is the end of `loadSavings`.

| Arm     | Pass     | Session ready | Savings starts | Savings headers | Owner starts | Owner headers | Model ready | Visible |
| ------- | -------- | ------------: | -------------: | --------------: | -----------: | ------------: | ----------: | ------: |
| Control | Cold-ish |         301.2 |          302.2 |           818.2 |        832.2 |       1,548.2 |     1,551.2 | 1,623.0 |
| Control | 1        |         302.0 |          302.0 |           815.0 |        828.0 |       1,114.0 |     1,115.0 | 1,193.7 |
| Control | 2        |         314.7 |          315.7 |         1,103.7 |      1,108.7 |       1,389.7 |     1,390.7 | 1,459.7 |
| Control | 3        |         316.5 |          317.5 |           806.5 |        819.5 |       1,091.5 |     1,093.5 | 1,157.1 |
| Phase 6 | Cold-ish |         352.8 |          353.8 |           892.8 |            — |             — |       902.8 |   982.1 |
| Phase 6 | 1        |         373.3 |          374.3 |           848.3 |            — |             — |       864.3 |   930.0 |
| Phase 6 | 2        |         298.2 |          299.2 |           801.2 |            — |             — |       811.2 |   876.4 |
| Phase 6 | 3        |         306.3 |          306.3 |           812.3 |            — |             — |       820.3 |   890.2 |

## Prototype

Read-only normal authenticated SSR client using the browser cookie fixture and public project key. No service-role token. Before production changes, executed the actual current list loader and an in-memory candidate loader, with identical gate context, production mappers, lifecycle selection, interest calculation and maturity logic. Candidate used the explicit existing owner FK, left embedding, and child active/household filters. A preliminary diagnostic also proved equality; the final comparison below additionally asserts `buildSavingsOverviewModel` equality.

Four alternating comparisons: current → embed, embed → current, current → embed, embed → current. Timings include the returned response bodies. Auth and active viewer membership are verified before comparisons and excluded from these list-stage timings.

| Pass     | Candidate | HTTP total ms | Mapping ms | HTTP count | Response bytes |
| -------- | --------- | ------------: | ---------: | ---------: | -------------: |
| Cold-ish | current   |       1,100.1 |      2.992 |          2 |        150,399 |
| Cold-ish | embed     |         779.4 |      0.822 |          1 |        151,285 |
| 1        | embed     |         866.2 |      0.422 |          1 |        151,285 |
| 1        | current   |         711.5 |      0.702 |          2 |        150,399 |
| 2        | current   |         785.9 |      0.406 |          2 |        150,399 |
| 2        | embed     |         469.0 |      0.332 |          1 |        151,285 |
| 3        | embed     |         466.4 |      0.349 |          1 |        151,285 |
| 3        | current   |         718.2 |      0.567 |          2 |        150,399 |

Warm HTTP median: **718.2 → 469.0 ms**. Warm mapping/enrichment median: **0.567 → 0.349 ms**. Mapping timer covers row/cycle mapping and existing enrichment after owner evidence is collected; it excludes membership ID extraction and HTTP/client overhead. The embed's first warm comparison was slower; subsequent comparisons and the complete navigation median improved. This is a small sample, not a latency guarantee.

Payload: **150,399 → 151,285 UTF-8 response-body bytes**, +886 bytes / 0.59%. Control includes both Savings and owner-batch bodies; candidate is one Savings body. These are decoded JSON bytes, not compressed wire transfer sizes. Rows without owners carry a null embed; membership metadata never enters the returned Saving model.

## Security equivalence

Inspected the deployed FK and freshly generated Supabase types:

```text
savings_owner_membership_fk
  (household_id, owner_membership_id)
  → household_members(household_id, id)
```

The explicit FK hint avoids ambiguity and preserves composite household scope. This is a many-to-one embed, returning an object or null. The app's untyped Supabase client infers an array, so the query uses the documented `overrideTypes<..., { merge: false }>` with a local projection type matching deployed schema and observed responses. No global generated-type rewrite.

The child relation selects only `id, household_id, is_active`, filtered by the gate household and `is_active = true`. Default left semantics retain parent Savings when evidence is absent; `!inner` is deliberately absent. The server accepts an owner ID into the active set only when the embedded membership is strictly active, its household matches the gate, and its ID matches that Saving's owner ID. Neither owner identity alone nor truthy string values count as active evidence.

Embedded household members retain their own RLS: `is_household_member(household_id)` checks `auth.uid()` against an active membership in that household through the existing stable security-definer function with `search_path = public`. Savings SELECT independently checks active membership. No grants, policy, function or auth API changed.

Evidence:

- Same 34 Savings and all 50 raw embedded cycles compare deeply equal after removing only candidate metadata. Full returned Saving models and overview grouping/sorting/totals compare deeply equal. Provider/account names, ownership scope/identity/status, mutation capability, current lifecycle, maturity and financial values are included in these assertions.
- Live fixture: 33 household Savings, one partner personal Saving; viewer personal and inactive members are absent. No fixtures were created. Viewer-personal, inactive/former, absent/hidden owner, no owner ID and malformed evidence are proven by focused synthetic regression tests, not claimed as live fixtures.
- Eleven ownership cases compare full list output with the former batch-based mapper given scoped active IDs. Household capability remains unchanged. Partner personal remains readable and cannot mutate. Inactive, missing, foreign-household, mismatched-ID, string-active and missing-field evidence cannot grant personal mutation rights.
- Both unauthenticated and no-active-membership gates return null before a Supabase client/read starts. Existing Detail denied-gate/session isolation tests still pass.
- Normal authenticated API: all 34 rows survive left filtering; every returned member object contains exactly the three projected fields and matches its Saving owner and gate household. Anonymous read fails with HTTP 401 / `42501`. Foreign household filter returns zero rows. Malformed Saving ID yields `22P02`.
- Read-only SQL transaction with authenticated role and a synthetic subject without memberships returns zero Savings and zero household-member rows, then rolls back. This is an RLS simulation, not a second live user's session. Foreign-household isolation is supported by composite FK, scoped parent/child filters, unchanged policies and malformed-evidence unit tests; no populated foreign Savings fixture exists for a live cross-household attempt.

Error distinction: previously a failed _second_ batch returned null and the shared mapper treated undefined evidence as active. The combined query instead uses the existing list-read error path and returns null; it never fabricates active ownership on an embed/query error. A successful read with absent owner evidence retains the Saving with the existing former-owner capability. Detail's separate helper and error behavior are unchanged.

## Implementation

Only two implementation/test files changed relative to the Phase 5 control:

- `modules/savings/application/queries/list-savings.ts`: list-specific owner projection, child filters, typed response and scoped active-ID set. Reuses existing mapper and calculations. Removes the list batch; keeps the helper import and original base projection for Detail.
- `tests/unit/savings-list-orchestration.test.ts`: owner/capability and denied-gate cases, projection isolation, no follow-up list owner batch, full mapper equality. Removes an outdated assertion that counted all `.eq` calls rather than checking household scope.

The new report and companion sanitized evidence JSON are the other Phase 6 artifacts. No production instrumentation, account/command/session/mapper/Detail/Create/Back/motion edits.

## Performance

| Transition      |    Control |  Phase 6 |    Saved | Improvement |
| --------------- | ---------: | -------: | -------: | ----------: |
| Money → Savings | 1,193.7 ms | 890.2 ms | 303.5 ms |       25.4% |

Warm visible samples: control **1,193.7, 1,459.7, 1,157.1 ms**; Phase 6 **930.0, 876.4, 890.2 ms**. Cold-ish visible: **1,623.0 → 982.1 ms**, reported separately from warm medians.

## Remote requests

Every measured Money → Savings demand has one RSC request. Counts below cover all remote work for that demand, not just work ending before paint. All successful remote responses are HTTP 200. Prefetch is recorded separately and not added to demand counts.

| Remote operation                              | Before | After |
| --------------------------------------------- | -----: | ----: |
| `getUser`                                     |      1 |     1 |
| Active viewer membership                      |      1 |     1 |
| Savings + cycles (now also owners)            |      1 |     1 |
| Owner-membership batch                        |      1 |     0 |
| Critical remote requests                      |      4 |     3 |
| Total remote HTTP requests for Savings demand |      4 |     3 |

No separate cycle query, duplicate owner request, new RPC or deferred list read replaces the removed wave. Prototype list-only HTTP count is 2 → 1; session-inclusive navigation count is 4 → 3.

## Regression verification

Same-run medians, ms; these are controls, not optimizations:

| Transition | Control useful | Phase 6 useful | Control full data | Phase 6 full data |
| ---------- | -------------: | -------------: | ----------------: | ----------------: |
| Create     |          361.7 |          361.8 |           1,428.3 |           1,129.2 |
| Back       |           54.3 |           53.0 |              54.3 |              53.0 |
| Detail     |          939.0 |          958.9 |           1,555.6 |           1,360.6 |

Detail useful increases 19.9 ms / 2.1% in this small sample; source, critical request topology and capability checks are unchanged. Total remote demand counts stay Create **7**, Detail **8**; cached Back stays **0 RSC / 0 remote**. Detail keeps three critical requests and five deferred requests for the representative household-owned Saving. No claim of further Detail improvement.

All four passes preserve early Create name edits, main/viewport/summary DOM identity and loaded Back content. The separate browser smoke verifies native history entry restoration on Create → Back, household Detail actions, Detail browser Back, and the partner personal badge/readable Detail with no mutation editor. No financial action was submitted.

Browser list verification passed EN/VI × light/dark × 390/440/768/1280: no horizontal overflow, centered shell ≤440 px, all 34 rows, unchanged list values/maturity presentation after reduced-motion reload. Readable values and maturity summary inspected in the 440 px screenshot. Screenshots are local under `output/playwright/phase6-{locale}-{theme}-{width}.png`. Existing title truncation/layout is unchanged and outside this query phase.

Validation:

- Focused Savings/ownership/session/Detail/Create regression suite: **24 files, 244 tests passed**; orchestration includes **41 tests**.
- ESLint passes.
- Full Vitest: **247 files passed, 3 failed; 1,667 tests passed, 5 failed**. The same five failures reproduce in the untouched Phase 5 control: EN/VI key parity, Money card wrapping, and three existing account-presentation tests missing `NextIntlClientProvider`. No unrelated fixes.
- Typecheck and strict production build fail only on pre-existing Home translator incompatibilities at `home-streaming-sections.tsx:99` and `:340`. New Savings typing error found during validation was fixed using the explicit projection override. Final source introduces no additional type errors.
- Disposable production builds pass with type checking bypassed solely for browser measurement; repository config is unchanged. This does not certify a clean strict repository build.
- Authenticated reload/auth-entry E2E: **1 test passed** (9.3 s), using the private fixture state and an isolated no-write config.
- Changed source/tests/report/evidence pass targeted Prettier checks. Repository-wide format check retains existing style debt; no broad formatting edits. Final refactor review passes for the Phase 6 delta: explicit FK and narrow response type, existing domain constants, no new helper abstraction or unsafe double cast, logged failure path, unchanged shared mapper and Detail.

## Architecture and remaining bottleneck

**Did PostgREST embedding safely eliminate the ownership wave?** Yes. Existing composite FK/RLS, normal authenticated deep equivalence, negative capability tests and demand telemetry prove one read supplies scoped active evidence while read-vs-mutate distinction remains intact.

**Is a new RPC necessary?** No. The existing relational embed meets the required semantics with a small payload increase and no backend contract change.

**Does this change the GraphQL conclusion?** No justification to introduce GraphQL: existing REST embedding removes the measured wave, with request count and timing evidence. GraphQL was not benchmarked; no universal claim about its performance.

**Does this change the CSR conclusion?** No justification to add CSR: the server list is faster after removing a remote dependency. No client-side auth architecture or browser fetch comparison was introduced.

The remaining largest measured critical stage is the Savings response (~502 ms warm header envelope, 151 KB decoded list payload), followed by the unchanged parallel session gate (~292 ms). Network/database variability remains visible in the samples. Neither is optimized here; `getUser`, claims/session verification, viewer resolution, revocation behavior and cache contracts remain intact.

Evidence: `money-savings-navigation-phase-6-evidence.json`. Refactor review is limited to the Phase 6 delta while retaining the audited earlier-phase working tree. No new domain values, libraries, generic wrappers, unsafe double casts, silent errors or production telemetry. One list query change reuses native Set/flatMap and existing capability logic.

**PHASE 6 SUCCESS — PROCEED TO PHASE 7**
