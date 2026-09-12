# Inbox Owner Validation Closeout

## 1. Executive Summary

**Closeout: C — STILL NOT READY TO CLOSE.** Candidate A is structurally promising: the current PostgREST relationships can return the owner membership’s `is_active` value, and the measured six-item queue produced 20/20 raw and capability matches. Its direct combined median improved from 572.5 ms to 278.8 ms while reducing the post-queue graph from two stages to one.

Candidate A was not accepted. The required live RLS matrix has no current-owner or former-owner source in the available queue, and the other authenticated household had no source row to use for a foreign-household lookup. The current household has three active memberships and no inactive membership. The repository fixture setup/cleanup harness requires a service-role key; the task explicitly forbids service-role use, so it was not run. The evidence therefore does not prove former-owner or foreign-source equivalence.

No production code, database schema, RLS policy, financial row, or infrastructure was changed. The fresh current-path browser reprofile measured a 1,444.3 ms first-row median, below the 1,600 ms target, but this did not follow an accepted candidate and does not remove the owner-validation stage. A single changed measurement run is not enough to classify the remaining tail as entirely hosted.

## 2. Current Owner Capability Contract

The path is Inbox row → source row → `financial_scope` and `owner_membership_id` → `listActiveMembershipIds()` → `resolveFinancialCapabilities()` → `resolveInboxSourceCapabilities()` → `mapInboxRow()`. The resolver and mapper used below are the existing application functions; no authorization decision comes from `context_json`.

| Case                                               | Current resolver/capability                                                                                                                                                                                                                                                | Action and display behavior                                                                                                  | Privacy expectation                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Household-owned source                             | `isPersonal=false`, `canMutate=true`, `actionable`, `ready`                                                                                                                                                                                                                | Actionable; source note, account, and category details are shown when available.                                             | Shared with active household members under existing source RLS.              |
| Personal source owned by the current active member | Owner active; `isOwnedByMe=true`, `canMutate=true`, `actionable`, `ready`                                                                                                                                                                                                  | Actionable; source details are shown when available.                                                                         | Only the active owner can mutate the personal source.                        |
| Personal source owned by another active member     | `isOwnedByMe=false`, `canMutate=false`, `read_only_non_owner`, `read_only`                                                                                                                                                                                                 | Details remain visible to the household; owner-only actions are disabled.                                                    | Household read visibility remains, mutation is blocked.                      |
| Personal source owned by an inactive/former member | `ownerStatus=former`, `canMutate=false`, `read_only_former_owner`, `read_only`                                                                                                                                                                                             | Details remain visible when the source is readable; former-owner state is retained.                                          | No mutation by the former owner or another member through this capability.   |
| Personal source with missing owner membership      | Current schema rejects this with the source table’s `*_scope_owner_pair_check`. If malformed data reaches the resolver, the null owner is treated as active by the current call site, but it is not the current owner; outcome is `read_only_non_owner`, never actionable. | Source details may still render; no personal action. This is a constraint-violating data state.                              | No action is granted from the missing ID.                                    |
| Missing source row                                 | No ownership is resolved; a source-backed Inbox kind becomes `source_unavailable` and `unavailable`.                                                                                                                                                                       | Inbox row remains; title/context fallback can render, but source details are absent and source-backed action is unavailable. | No source row is disclosed.                                                  |
| Foreign-household source ID                        | Existing table RLS hides the source; savings, loans, and liabilities reads also constrain by the current `household_id`. No ownership is resolved, so the source-backed item is `source_unavailable`.                                                                      | Same safe fallback as a missing source.                                                                                      | Foreign source data is not exposed.                                          |
| Source read failure                                | Failed source IDs enter `unavailableSourceIds`; the item maps to `source_unavailable` / `unavailable`.                                                                                                                                                                     | Inbox row remains with stored title and any context display fallback.                                                        | No action is authorized from failed source data.                             |
| Owner-membership lookup failure                    | `listActiveMembershipIds()` logs and returns `null`; the caller defaults `ownerMembershipIsActive` to `true`. Other active owners remain read-only non-owners. A former owner loses the former-owner distinction and becomes read-only non-owner, still non-actionable.    | Source details remain available; only the former-owner label/state can degrade.                                              | Mutation remains blocked because the former owner is not the current member. |

Current schema checks enforce `household` scope with a null owner ID and `personal` scope with a non-null owner ID for accounts, savings, loans, and liabilities. Composite owner foreign keys include `household_id`, preventing an owner membership from another household.

## 3. Current Dependency Graph

The authenticated Inbox path has four stages and seven initial Auth/Supabase requests:

1. **W0:** Auth user and active-household membership gate.
2. **W1:** base `inbox_items` GET and shared unread-count HEAD, in parallel.
3. **W2:** transactions, savings, loans, and liabilities source reads, in parallel where applicable.
4. **W3:** active owner-membership validation after source rows reveal owner IDs.

For the measured fixture, W2 issued transactions and savings reads; there were no loan or liability source rows. W3 issued one `household_members` query. The route also produced one post-hydration archived-tab RSC request per navigation; it is separate from the seven initial Auth/Supabase requests. Detail prefetch remained disabled and browser-side REST refetches remained at zero.

## 4. Candidate A — Embedded Owner Activity

The exact PostgREST relationships were verified from existing foreign keys and live projection probes:

| Source      | Existing FK path                                                                                | Tested relationship name                                            |
| ----------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Transaction | `transactions.account_id` → account; account `(household_id, owner_membership_id)` → membership | `transactions_account_id_fkey`, then `accounts_owner_membership_fk` |
| Savings     | `(household_id, owner_membership_id)` → membership                                              | `savings_owner_membership_fk`                                       |
| Loans       | `(household_id, owner_membership_id)` → membership                                              | `loans_owner_membership_fk`                                         |
| Liabilities | `(household_id, owner_membership_id)` → membership                                              | `liabilities_owner_membership_fk`                                   |

The live candidate projections returned HTTP 200 for all four relationships. Transaction and savings projections returned real fixture rows; loans and liabilities were empty relation probes, so their production-sized source paths remain unmeasured.

The tested candidate projections add only `owner:household_members!<existing_fk>(is_active)` to the source selections. They do not use the embedded row to decide whether the source is visible: existing source-table RLS still gates the parent, and the existing membership SELECT policy is scoped by `is_household_member(household_id)`. A current member can see active and inactive membership rows in their own household, which is necessary to preserve former-owner state. The composite owner foreign keys keep each relation in that same household. A foreign source parent remains hidden by its existing RLS policy.

This design appears safe from schema and policy inspection, but live fixture coverage did not include a current-owner, former-owner, or foreign-household source. Those gaps prevent acceptance under the requested matrix. No application query was changed.

## 5. Candidate B — Earlier Owner Lookup

**Rejected.** The six Inbox rows contain no owner-membership field in `context_json`; selected source metadata in the base queue contains only source identity/type and display/workflow fields. The source owner ID is learned from the source read. Treating context as authorization would violate the task’s contract, and querying owners earlier without an authoritative ID would not remove the dependency.

## 6. Candidate C — Narrow Source Ownership Read Model

**Not evaluated or prototyped.** Candidate A is viable enough that its missing evidence should be resolved before considering a read model. Candidate B is rejected, but that alone does not justify a new function or RPC while Candidate A has not been disproven. No broad or narrow Inbox RPC was added.

## 7. Fresh Baseline

A clean Next.js 16.3.1 production build passed in an isolated worktree at the same application source revision (`52fd26da`); TypeScript and all 98 static pages completed. It was served with `VINHA_PERF_TRACE=1 npm run start`. The root development server was not used for these measurements.

The browser run used Chromium, the authenticated E2E account, `/vi/inbox`, the existing six-item fixture, a 440×900 viewport, light theme, and reduced motion. It discarded one warmup and measured ten navigations. The marker definitions match the prior closeout: queue-list visibility for queue content and the first inbox-item link for first useful row content. Percentiles use nearest rank; with ten samples, p95 is the maximum.

| Measure                          | Fresh median |  Fresh p95 | Prior closeout median / p95 |
| -------------------------------- | -----------: | ---------: | --------------------------: |
| TTFB                             |     315.2 ms |   615.7 ms |       335 ms / not reported |
| Queue container visible          |   1,442.1 ms | 1,694.6 ms |                           — |
| First row visible (first useful) |   1,444.3 ms | 1,696.4 ms |         1,684 ms / 1,909 ms |
| Full six-row queue               |   1,444.3 ms | 1,696.4 ms |                           — |

Three of ten fresh first-row samples exceeded 1,600 ms. The fresh median is 239.7 ms below the previous closeout median despite no application code change; this is a new run, not evidence that a code change caused the difference. The seven initial requests and four dependency stages remain.

The server trace showed a median W1 queue/unread wave of 282 ms (p75 376 ms, p95 850 ms), W2 source wave median 442 ms (p75 496 ms, p95 574 ms), and W3 owner-validation median 270 ms (p75 307 ms, p95 500 ms). W0 remains the Auth/membership gate. These are request-wave timings, not sums of endpoint medians.

The browser recorded one navigation document, zero browser REST/Auth calls, and one post-hydration RSC request for the archived tab per sample. No detail prefetch occurred. The two after-response maintenance RPC callbacks were intercepted before network egress and returned valid zero-count payloads; 22 callback attempts were blocked across the warmup and ten measured navigations. No Inbox or financial rows were changed by the profiling run.

## 8. Security / RLS Matrix

All live probes used the publishable/anonymous key with ordinary authenticated sessions where applicable. No service-role or secret key was used. The read-only probes covered the following:

| Case                     | Result            | Evidence / limit                                                                                                                            |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Current active owner     | **Not available** | No personal source in the E2E queue or visible household source inventory was owned by the signed-in user.                                  |
| Another active owner     | **Pass**          | Three personal queue sources embedded an active owner and matched the active-membership lookup; their capability was read-only non-owner.   |
| Former/inactive owner    | **Not available** | The target household exposed three active memberships and no inactive membership/source. No member was deactivated.                         |
| Household-owned source   | **Pass**          | Three household-owned queue sources had no owner ID and remained actionable.                                                                |
| Foreign-household source | **Not available** | The other authenticated household had no readable transaction, savings, loan, liability, or account row to use as a real foreign source ID. |
| Missing source           | **Pass**          | A valid random transaction UUID returned no row; the existing mapper’s source-backed outcome is unavailable.                                |
| Anonymous                | **Pass — denied** | Anonymous source read was denied with SQLSTATE `42501`; no source row was returned.                                                         |
| Authenticated non-member | **Pass — hidden** | An authenticated identity with no active household could not read an existing target-household transaction.                                 |

The checked-in ownership fixture harness provisions and cleans its controlled household through a service-role client. It was deliberately not used because this task forbids service-role use. No safe, already-existing non-service-role disposable household provided the missing current/former/foreign source cases. Therefore **RLS/privacy is not a pass for Candidate A**, despite the positive policy inspection and the nonmember/anonymous checks.

## 9. Raw Equivalence

**PASS: 20/20 paired comparisons on the available six-item fixture.** Current and candidate reads were interleaved and compared in both ordering directions. The comparison included source ID/type, source availability and HTTP-error status, financial scope, owner membership ID, owner active state, note, category name, and account name. IDs were compared in memory and are not included in the saved metrics output.

The successful fixture sources were four transactions and two savings. Ownership was three household sources and three personal sources owned by another active member. Loans/liabilities had no applicable source rows. No failure-injection comparison or live former-owner comparison was run.

## 10. Capability Equivalence

**PASS: 20/20 paired comparisons on the available six-item fixture.** Both normalized shapes went through the same existing `resolveFinancialCapabilities`, `resolveInboxSourceCapabilities`, and `mapInboxRow` modules. The comparison covered item ordering/count, capability, `canAct`, read-only/former/unavailable state, enrichment state, stored/display title, note/category/account labels, amount/currency, source fields, lifecycle fields, typed data, and assignment fields.

All six measured items matched: three household-owned items remained actionable and three other-active-owner personal items remained read-only non-owner. Existing focused unit coverage also passed for owner, non-owner, former-owner, and unavailable resolver outcomes. That unit test does not substitute for the missing live former-owner embed/RLS case.

## 11. Direct Benchmark

Each endpoint benchmark used 20 authenticated samples. The dependent combined benchmark used 20 interleaved current/candidate samples and measured elapsed time across the real source-read wave and its dependent owner lookup; independent endpoint medians were not added together.

| Read                              | Samples |   Median |      P75 |      P95 |      Max | Median bytes | Errors |
| --------------------------------- | ------: | -------: | -------: | -------: | -------: | -----------: | -----: |
| Base queue                        |      20 | 265.8 ms | 270.9 ms | 460.0 ms | 563.5 ms |        6,121 |      0 |
| Current transaction source        |      20 | 263.6 ms | 268.7 ms | 312.9 ms | 525.4 ms |          834 |      0 |
| Current savings source            |      20 | 264.0 ms | 266.7 ms | 298.5 ms | 320.4 ms |          243 |      0 |
| Owner membership validation       |      20 | 263.0 ms | 271.1 ms | 326.0 ms | 378.0 ms |           96 |      0 |
| Loan embedded relation probe      |     N/A | HTTP 200 |        — |        — |        — |            — |      0 |
| Liability embedded relation probe |     N/A | HTTP 200 |        — |        — |        — |            — |      0 |

| Combined dependent path                 | Calls | Domain stages after queue |   Median |      P75 |      P95 |        Max | Median bytes | Errors |
| --------------------------------------- | ----: | ------------------------: | -------: | -------: | -------: | ---------: | -----------: | -----: |
| Current: source wave → owner validation |     3 |                         2 | 572.5 ms | 672.6 ms | 764.4 ms | 1,374.8 ms |        1,173 |      0 |
| Candidate A: embedded owner activity    |     2 |                         1 | 278.8 ms | 354.7 ms | 782.3 ms |   940.7 ms |        1,208 |      0 |

Candidate A’s median is 293.7 ms (51.3%) lower. Its p95 is 17.9 ms (2.3%) higher, a small difference within the observed hosted variability; its maximum is 434.1 ms lower. Median response size increased by 35 bytes (3%). The measured direct result is a meaningful structural/median win with no material p95 regression in this sample. It remains an experimental query shape, not an integrated route result.

## 12. Decision Gate

| Gate                              | Result                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| Raw equivalence                   | Pass for 20/20 available fixture pairs                                                     |
| Capability equivalence            | Pass for 20/20 available fixture pairs                                                     |
| RLS/privacy proof                 | Incomplete: current-owner, former-owner, and foreign-source cases unavailable              |
| Former-owner behavior             | Not available as a live database case                                                      |
| Foreign-household behavior        | Not available as a real foreign source row                                                 |
| Owner-validation stage removed    | Pass in direct experimental shape; current route remains unchanged                         |
| Direct median improves materially | Pass: 51.3% lower in paired dependent samples                                              |
| P95 is not materially worse       | Pass for available sample: +2.3%, max improved                                             |
| Maintainability                   | Pass by inspection: existing FK embeds and resolver can be reused without a new read model |

**Candidate A is not accepted for implementation in this closeout.** The missing security cases are explicit acceptance requirements, and the available fixture cannot prove them without a safe disposable-fixture path that respects the no-service-role rule. Candidate B is rejected. Candidate C is not justified. Keep the current route shape until the missing live evidence is available.

## 13. Implementation

No production implementation was made. The shared Inbox query, mapper, resolver, RLS policies, and database schema are unchanged. The route remains at one owner-validation call, four dependency stages, and seven initial Auth/Supabase fetches. No constants or query projections were added to production code.

The isolated production build passed. `npm run test -- tests/unit/inbox-decisions.test.ts` passed all 11 tests. No full-suite run was needed because production code was not changed.

## 14. Browser Reprofile

No post-integration profile exists because Candidate A was not accepted or integrated. Section 7 is the requested fresh ten-sample current-path reprofile; its first-useful median is 1,444.3 ms and p95 is 1,696.4 ms. The route still performs W3 and therefore has an avoidable application dependency under investigation. The new median is below target, but the candidate acceptance and repeated hosted-floor evidence required by the closeout rules are absent.

## 15. Closeout Decision

**C. STILL NOT READY TO CLOSE.** Candidate A has strong direct latency and fixture-limited equivalence evidence, but its mandatory former-owner and foreign-household source checks were not available. The route is still at four stages and seven initial fetches, so the task’s conditions for either “INBOX BLOCKER RESOLVED” or “KEEP CURRENT SHAPE — HOSTED FLOOR” are not met.

## 16. Raw Evidence

Fresh browser samples are in run order after one discarded warmup, in milliseconds:

- TTFB: `[615.7, 303.1, 312.9, 303.3, 461.2, 340.4, 509.1, 315.2, 307.5, 395.1]`
- Queue container visible: `[1693.6, 1333.8, 1410.0, 1694.6, 1563.6, 1233.0, 1580.0, 1612.4, 1442.1, 1415.0]`
- First row and full queue: `[1696.1, 1336.6, 1412.4, 1696.4, 1565.8, 1235.4, 1582.3, 1614.5, 1444.3, 1417.5]`

The direct combined benchmark had 20 current and 20 candidate samples, zero HTTP errors, and the distribution statistics shown in section 11. The candidate’s sample-level raw/capability comparison results were 20/20. Live RLS counts for the six queue sources were three household-owned, three other-active-owner; the broader visible source inventory contained 52 household-owned and eight other-active-owner transaction/savings/loan/liability sources. No source or membership identifiers, response bodies, user credentials, or financial amounts are included in this report.

The focused resolver test passed 11/11. The development-project guard passed for the configured development project and region before profiling. All profile requests used the publishable/anonymous key and ordinary user sessions; no service-role or secret key, financial data mutation, database change, or infrastructure change was used.
