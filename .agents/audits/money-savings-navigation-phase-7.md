# Money → Savings navigation — Phase 7

Date: 3 October 2026, Asia/Ho_Chi_Minh. Scope: Savings list projection only. Ponytail applied: retain the existing authenticated relational read and domain calculations; adopt the inexpensive column trim and reject the marginal multi-embed alternative. Phases 1–6 and existing working-tree edits are preserved. No UI, auth, account-loader, Create, Back, financial command, database, GraphQL, CSR, dependency, deployment or Phase 8 change.

## Current projection

The Phase 6 control selects 14 Savings columns, two account-name embeds, three provider columns, 17 cycle columns and three active-owner evidence columns. The full cycle embed has no status filter, order or per-parent limit. The live control response is **151,285 decoded UTF-8 JSON bytes**, **34 Savings / 50 cycles**. All Savings are active; cycles are **34 active / 16 rolled**, with 13 Savings having more than one cycle. This proves the full-history hypothesis for this fixture.

The response's serialized field values include `saving_cycles` 69,788 bytes, `product_snapshot` 28,798, `renewal_config` 12,198 and `maturity_instruction` 7,336. These are sums of `JSON.stringify(fieldValue)` lengths, excluding parent keys and transport whitespace; they must not be summed as exact wire contributions. The HTTP body bytes above are measured directly after decoding, not compressed transfer sizes.

## Actual list requirements

Trace: `money/savings/page.tsx` → `listSavings` → `mapSavingRow` / `mapSavingCycleRow` → `selectCurrentSavingCycle` / `computeAccruedInterest` / `setMaturityActionRequired` → `buildSavingsOverviewModel` → Savings rows, summary, maturity callout and history section. `savings-product-row.tsx` consumes the ownership badge. No transaction, settlement-result or cycle-chain consumer is reachable from this screen.

“Contract” below means retained in the existing returned Saving model or requested account/current-lifecycle equivalence, although not rendered by this screen. Calculations include mapping fallback and sort dependencies, not only arithmetic. The table inventories every selected column and embedded relation.

| Data field                       | List UI uses it?                                              | Calculation uses it?                                           | Ownership/security uses it?       | Detail-only?                               |
| -------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------- | ------------------------------------------ |
| Saving `id`                      | Row key and Detail target                                     | Identity                                                       | Resource identity                 | No                                         |
| `household_id`                   | No                                                            | Mapping contract                                               | Household scope                   | No                                         |
| `status`                         | Maturity and active/history section                           | State/grouping                                                 | No                                | No                                         |
| `funding_account_id`             | No; contract retained                                         | Account identity                                               | No                                | Action-facing                              |
| `settlement_account_id`          | No; contract retained                                         | Account identity                                               | No                                | Action-facing                              |
| `provider_id`                    | Indirectly provider identity                                  | Matured target-package validation                              | Scoped registry read              | No                                         |
| `product_name`                   | Row/callout title                                             | Title fallback                                                 | No                                | No                                         |
| `product_snapshot`               | Provider snapshot name, fallback title/rate, currency, family | Interest-method/tax/maturity-target fallbacks                  | No                                | Mixed; see JSON discussion                 |
| `renewal_policy`                 | Maturity callout policy label                                 | Legacy configuration fallback                                  | No                                | No                                         |
| `renewal_config`                 | No direct display                                             | Maturity-instruction strategy/target fallback                  | No                                | Mixed                                      |
| `maturity_instruction`           | Action-required maturity indicator indirectly                 | Target-package/strategy validation                             | No                                | Mixed                                      |
| `created_at`                     | No direct display                                             | Overview tie-break order                                       | No                                | No                                         |
| `financial_scope`                | Personal badge                                                | Capability mapping                                             | Yes                               | No                                         |
| `owner_membership_id`            | Owner status/badge indirectly                                 | Capability mapping                                             | Yes                               | No                                         |
| `funding_accounts(name)`         | No current screen text; account display contract retained     | Mapped name                                                    | Existing account RLS              | Also Detail                                |
| `settlement_accounts(name)`      | No current screen text; account display contract retained     | Mapped name                                                    | Existing account RLS              | Also Detail                                |
| `saving_providers(display_name)` | Provider label fallback                                       | Snapshot-name fallback                                         | Existing provider RLS             | No                                         |
| `saving_providers(provider_key)` | No                                                            | Not read by mapper; required by its existing row input type    | No                                | Registry metadata; conservatively retained |
| `saving_providers(saving_type)`  | Bank/platform grouping/icon                                   | Family/type fallback                                           | No                                | No                                         |
| Full `saving_cycles` relation    | Only selected lifecycle cycle                                 | Selection described below                                      | FK and existing cycle RLS         | Full history is Detail-only                |
| Cycle `id`                       | No direct display; current lifecycle identity retained        | Model identity                                                 | Trusted parent-cycle relationship | No                                         |
| `saving_id`                      | No; contract retained                                         | Cycle-parent identity                                          | FK                                | No                                         |
| `cycle_number`                   | No direct display                                             | Current-cycle ordering; Health caller                          | No                                | No                                         |
| `start_date`                     | Indirect financial values                                     | Accrual and progress                                           | No                                | No                                         |
| `end_date`                       | Maturity date/days/labels                                     | Accrual, sorting and maturity                                  | No                                | No                                         |
| `principal`                      | Row/callout principal and totals                              | Settlement breakdown                                           | No                                | No                                         |
| `locked_rate`                    | Rate                                                          | Active accrual                                                 | No                                | No                                         |
| `package_snapshot`               | Tax/interest outputs indirectly                               | Method, tax rule and tax-rate fallbacks                        | No                                | Mixed; see JSON discussion                 |
| `accrued_interest`               | Expected net interest/received summary                        | Persisted interest for non-active cycles; active recomputation | No                                | No                                         |
| `settlement_result`              | No                                                            | Not read by list presentation                                  | No                                | Yes: settlement disclosure/activity        |
| `renewal_decision`               | No                                                            | Not read by list presentation                                  | No                                | Yes: renewal history                       |
| `status`                         | Maturity indirectly                                           | Lifecycle priority, active-interest recomputation              | No                                | No                                         |
| `funding_transaction_id`         | No                                                            | No list consumer                                               | No                                | Yes: activity                              |
| `settlement_transaction_id`      | No                                                            | No list consumer                                               | No                                | Yes: activity                              |
| `previous_cycle_id`              | No                                                            | Selector does not follow links                                 | No                                | Yes: chain disclosure                      |
| `next_cycle_id`                  | No                                                            | Selector does not follow links                                 | No                                | Yes: chain disclosure                      |
| `created_at`                     | No direct display                                             | Cycle-selection tie-break                                      | No                                | No                                         |
| `owner_membership(id)`           | Capability/owner status indirectly                            | Active-owner set                                               | Must match Saving owner           | No                                         |
| `owner_membership(household_id)` | No                                                            | Active-owner set                                               | Must match gate household         | No                                         |
| `owner_membership(is_active)`    | Former-owner state indirectly                                 | Active-owner set                                               | Strictly `true`                   | No                                         |

The product snapshot directly needed subset is `providerNameSnapshot`, `packageName`, `annualInterestRate`, `currency`, `savingsFamily`, `interestCalculationMethod`, `taxRule`, `taxRatePercent`, `packageId` and `settlementRule` (maturity fallback). Cycle snapshot calculations require `interestCalculationMethod`, `taxRule` and `taxRatePercent`. Other snapshot fields primarily describe creation, terms, provider rules, penalty/early settlement, available settlement rules and renewal eligibility; the list does not render them.

Whole snapshots are retained deliberately. The existing mappers support both JSON objects and legacy JSON-encoded strings, including malformed-string fallbacks. PostgREST JSON-path extraction would produce different values for those legacy strings. Trimming the mapped snapshots also changes the shared `Saving` contract and the nested `saving` contained in the overview. No new JSON parser, list-specific financial formula or unsafe partial-snapshot cast was introduced for unproven latency savings. This is a conservative projection reduction, **not a claim that every retained JSON property is intrinsically necessary**. The unused provider key similarly remains a known small compatibility field; this phase does not rewrite the shared mapper's provider input contract.

Other actual `listSavings` consumers were traced before changing its cycle shape: `savings-health-metrics` needs current cycle number/status/principal/rate/end date; Plan funding options and goal resolution need current principal; the provider directory uses the same overview. None consumes the six omitted disclosure/activity fields. Full cycle activity continues to resolve from authorized Detail, not this list query.

## Cycle analysis

The exact domain selector is:

1. Highest `cycleNumber` active cycle; descending `createdAt` breaks ties.
2. If none, highest-number matured cycle with the same tie-break.
3. If neither exists, highest-number remaining cycle with the same tie-break.
4. Empty relation returns null.

Status parsing happens **before selection**: unknown raw status falls back to active; nonfinite principal/rate/interest falls back to zero; malformed snapshot strings retain the existing mapper fallback. Historical creation mode does not introduce a different selector. Active interest is recomputed with the existing cycle → product → simple-method fallback. Matured/rolled/early-closed interest retains its persisted value. Saving status, cycle dates/status and critical target-package validity jointly determine maturity presentation. Rollover links and transaction IDs play no role in list selection.

Consequently, the UI needs one correctly selected lifecycle snapshot, not every historical snapshot. A globally newest cycle, an active-only filter, or timestamp-only limit is not equivalent: active can outrank newer matured/rolled rows; matured can outrank newer terminal rows; closed/historical Savings still need the terminal fallback. List history means closed Savings grouped by Saving state, not every past cycle displayed under an active Saving.

The selected implementation preserves the full cycle candidate set and unchanged domain selector. This avoids a second cycle request and preserves all fallback rules. After the column trim, the fixture's 16 rolled rows contribute **13,482 bytes of compact serialized cycle objects** (excluding relation punctuation/transport whitespace). Eliminating them requires a lifecycle-aware server projection rather than a naive limit.

An existing `get_home_savings_summary` RPC was inspected. It returns aggregate counts/totals and excludes terminal cases; it cannot supply row identity, owner evidence, list financial values or the full selector fallback. It is not an appropriate list read model. No existing full list view/read model was found in the repository.

## Prototype

Read-only normal authenticated SSR client, public project key, same user and same 34 Savings. Auth and active membership were verified before list comparisons. Actual production mappers, interest calculation and overview construction were executed. Each pair alternates order; every sample is retained below and in the companion evidence. HTTP header and complete-body timings are separate. Mapping timing covers row/cycle mapping plus unchanged maturity enrichment; it is not exclusive JavaScript CPU.

Candidate A removes six cycle disclosure/activity columns, leaves full snapshots and all cycle candidates, and uses the same left owner embed. Final list comparison checks every Saving field and every overview field—including nested item order, grouping, totals, provider/account display, ownership/owner status/`canMutate`, lifecycle identity/number/status, principal/rate/dates/snapshots and interest. Only the six explicitly unused cycle disclosure/activity properties are excluded from the equality comparison. No financial value, UI field, maturity state, group/order or capability is normalized away.

Candidate B additionally uses three left cycle aliases: active, matured and terminal candidate buckets, descending cycle number/created date and one row per bucket. The shared domain selector still chooses among them. It returns 47 cycles, not the desired 34: terminal candidates remain embedded even when an active candidate wins. Live final-model equality passes. It saves only **1,297 additional bytes** versus A, introduces nine embed order/limit modifiers plus child filters, and does not establish an exact one-snapshot projection. It was rejected, with no production lifecycle filtering added. Its fixture equality is not presented as exhaustive proof for malformed/tied lifecycle cases.

### Candidate A: column trim

| Pass     | Projection | Headers ms | Complete body ms | Mapping ms | Decoded bytes | Savings | Cycles | List HTTP calls |
| -------- | ---------- | ---------: | ---------------: | ---------: | ------------: | ------: | -----: | --------------: |
| Cold-ish | Control    |      551.2 |            558.4 |      2.143 |       151,285 |      34 |     50 |               1 |
| Cold-ish | Candidate  |      829.4 |            834.2 |      0.919 |       122,661 |      34 |     50 |               1 |
| 1        | Candidate  |      484.3 |            487.7 |      0.475 |       122,661 |      34 |     50 |               1 |
| 1        | Control    |      312.7 |            316.8 |      0.491 |       151,285 |      34 |     50 |               1 |
| 2        | Control    |      360.4 |            363.3 |      0.344 |       151,285 |      34 |     50 |               1 |
| 2        | Candidate  |      790.1 |            794.8 |      0.351 |       122,661 |      34 |     50 |               1 |
| 3        | Candidate  |      445.1 |            448.2 |      0.508 |       122,661 |      34 |     50 |               1 |
| 3        | Control    |      479.5 |            484.2 |      0.379 |       151,285 |      34 |     50 |               1 |

Warm complete-body median **363.3 → 487.7 ms**. Each sample produces an equivalent final list model under the explicitly described disclosure-field exclusion. These small sequential comparisons do not isolate hosted-service or network variance.

### Candidate B: bounded lifecycle candidates

| Pass     | Projection | Headers ms | Complete body ms | Mapping ms | Decoded bytes | Savings | Cycles | List HTTP calls |
| -------- | ---------- | ---------: | ---------------: | ---------: | ------------: | ------: | -----: | --------------: |
| Cold-ish | Control    |      532.0 |            536.3 |      1.904 |       151,285 |      34 |     50 |               1 |
| Cold-ish | Candidate  |      857.2 |            860.9 |      1.101 |       121,364 |      34 |     47 |               1 |
| 1        | Candidate  |      518.6 |            521.5 |      0.271 |       121,364 |      34 |     47 |               1 |
| 1        | Control    |      318.5 |            323.2 |      0.821 |       151,285 |      34 |     50 |               1 |
| 2        | Control    |      335.1 |            341.5 |      0.219 |       151,285 |      34 |     50 |               1 |
| 2        | Candidate  |      320.8 |            324.0 |      0.412 |       121,364 |      34 |     47 |               1 |
| 3        | Candidate  |      313.5 |            316.2 |      0.351 |       121,364 |      34 |     47 |               1 |
| 3        | Control    |      355.3 |            359.0 |      0.347 |       151,285 |      34 |     50 |               1 |

Warm complete-body median **341.5 → 324.0 ms**. Each sample produces an equivalent final list model under the explicitly described disclosure-field exclusion. These small sequential comparisons do not isolate hosted-service or network variance.

## Selected implementation

Two source/test files change relative to the Phase 6 snapshots:

- `modules/savings/application/queries/list-savings.ts`: split shared base fields into explicit List and Detail projections; narrow only the list cycle columns; declare the actual narrow cycle row type with `Omit`; reuse the existing cycle mapper with null values for unavailable Detail-only inputs. The existing relation-normalization helper handles both row types. The owner embed, strict active-owner evidence, household filters, gate, error logging, selector, interest calculation and maturity-package validation remain intact.
- `tests/unit/savings-list-orchestration.test.ts`: nine regression cases add List/Detail projection isolation, final overview equality across seven lifecycle fixtures, and malformed snapshot/status/numeric fallback equivalence. The existing 11 ownership permutations and previous-phase orchestration/Detail/activity checks remain.

The Saving model still exposes the six cycle disclosure/activity properties through the existing type, but List does not load them: settlement/renewal results and cycle/transaction links are null on actual projected list responses. They remain fully available through Detail. These fields must not become list action authority; current server commands and activity already use authorized Detail/fresh reads.

No package JSON projection or SQL lifecycle formula is duplicated. The only defaults supplied to the cycle mapper are absent settlement/activity inputs; optional omitted disclosure/chain inputs keep its existing null defaults. No new client state, effect, cache, transport fallback or second wave exists.

## Methodology

Same authenticated user and unchanged hosted fixture, same dependency installation, local production-mode Next 16.3.1 server at port 3102 and hosted Supabase in Sydney. Both final arms use fresh headed Chromium contexts at **440 × 900**, normal motion and no throttling. One cold-ish full-flow pass and three warm repetitions, 1.2 s idle before each click, identical useful-content selector/ancestor opacity threshold and two-frame readiness criterion. Supabase and database caches are not flushed; these are local-to-hosted observations, not deployment-region measurements.

The initial pre-edit control was captured before production changes. Its default browser viewport was not locked in the runner; it is retained as an initial diagnostic, not combined with the matched 440px series. A complete matched 440px control/after pair was then collected. Its network-to-header and mapping markers worked, but Next reconstructed fetch responses before the original per-response `text` hook, so it lacked body-ready telemetry. That entire pair is retained as a header-only diagnostic. The scratch SSR fetch wrapper was corrected after Next fetch returns; **both** complete arms were rebuilt and repeated with identical body instrumentation. No individual slow sample is discarded. The final corrected full-body pair is the primary table; all earlier samples remain in evidence.

The final control remains the frozen pre-edit Phase 6 source. Only profiling copies bypass the existing Home TypeScript errors and use the established Turbopack common-root workaround. Production configuration and session code are unchanged. Builds/tests/prototypes finish before each final navigation collection; no parallel workload is deliberately scheduled during it. The login refresh/setup traffic is excluded from all measurement windows.

Header envelope is remote fetch start → response headers. Body ready is completion of the actual PostgREST `Response.text()` read, before its JSON parse. Model ready is the final mapping/enrichment mark. Mapping covers row/cycle processing and unchanged enrichment; it excludes HTTP and is tiny compared with remote latency. Server `Date.now()` spans and browser epoch alignment limit milestone precision to a few ms; mapping uses a monotonic high-resolution timer. Payload is measured from the decoded response string with UTF-8 byte length. Medians use only warm passes and must not be summed across columns.

## Performance

Warm medians; delta is Phase 7 minus control. First-useful visibility is the actual loaded Savings list readiness described above.

| Metric                                        | Control | Phase 7 |   Delta |
| --------------------------------------------- | ------: | ------: | ------: |
| Session gate, ms                              |   303.0 |   276.0 |   -27.0 |
| Savings response headers, request-relative ms |   528.0 |   490.0 |   -38.0 |
| Savings body ready, from click ms             |   923.4 |   779.6 |  -143.8 |
| List model ready, from click ms               |   925.4 |   781.2 |  -144.2 |
| Decoded payload, bytes                        | 151,285 | 122,661 | -28,624 |
| Mapping/enrichment, ms                        |   0.299 |   0.271 |  -0.027 |
| Savings visible, from click ms                |   994.7 |   856.3 |  -138.4 |

| Transition      |  Control |  Phase 7 |    Saved | Improvement |
| --------------- | -------: | -------: | -------: | ----------: |
| Money → Savings | 994.7 ms | 856.3 ms | 138.4 ms |       13.9% |

Payload: **151,285 → 122,661 bytes**, **28,624 bytes removed / 18.9%**. Savings and cycle counts remain **34 / 50**; total critical/demand remote count remains **3**.

Every primary sample, milestones in ms after click:

| Arm     | Pass     | Session ready | Savings starts | Headers ready | Body ready | Model ready | Mapping ms | Visible |   Bytes | Rows / cycles | Demand remote |
| ------- | -------- | ------------: | -------------: | ------------: | ---------: | ----------: | ---------: | ------: | ------: | ------------- | ------------: |
| control | Cold-ish |         315.0 |          315.0 |         834.0 |      840.5 |       846.8 |      3.923 |   924.5 | 151,285 | 34 / 50       |             3 |
| control | 1        |         304.0 |          305.0 |         825.0 |      831.1 |       832.0 |      0.146 |   909.2 | 151,285 | 34 / 50       |             3 |
| control | 2        |         316.7 |          317.7 |       1,047.7 |    1,052.5 |     1,054.3 |      0.299 | 1,124.5 | 151,285 | 34 / 50       |             3 |
| control | 3        |         388.2 |          388.2 |         916.2 |      923.4 |       925.4 |      0.349 |   994.7 | 151,285 | 34 / 50       |             3 |
| after   | Cold-ish |         298.8 |          300.8 |         792.8 |      796.4 |       799.7 |      1.755 |   873.1 | 122,661 | 34 / 50       |             3 |
| after   | 1        |         289.6 |          289.6 |         776.6 |      779.6 |       781.2 |      0.438 |   855.5 | 122,661 | 34 / 50       |             3 |
| after   | 2        |         283.8 |          284.8 |         776.8 |      778.5 |       779.9 |      0.271 |   856.3 | 122,661 | 34 / 50       |             3 |
| after   | 3        |         326.1 |          327.1 |         817.1 |      819.2 |       820.6 |      0.266 |   891.6 | 122,661 | 34 / 50       |             3 |

The primary final pair observes **138.4 ms / 13.9% earlier visibility**, but does not establish reproducible payload-caused latency improvement. Header-to-body tail is **6.1 → 2.1 ms**. Mapping stays below 0.5 ms warm. The dominant remote header envelope is still **490.0 ms**.

The preceding complete matched 440px header-only pair measured **890.5 → 953.6 ms** (63.1 ms slower), with a 648 ms session-gate outlier in the after arm. Candidate A's alternating read-only comparison measured **363.3 → 487.7 ms** complete-body warm median (slower). The corrected primary pair measured a faster after arm. These conflicting observations are evidence of substantial service/session/network variation. The final control includes a 730 ms Savings header sample and a 376 ms gate; the final after values are more stable. None is excluded or normalized. It would be misleading to attribute the primary visible improvement entirely to 28.6 KB fewer bytes, or to claim that the original payload caused a 500 ms request.

## Request counts

Every primary Savings demand has one RSC request and three successful remote calls:

| Remote operation                         |   Control |   Phase 7 |
| ---------------------------------------- | --------: | --------: |
| `getUser`                                |         1 |         1 |
| Active viewer membership                 |         1 |         1 |
| Savings + cycles + active-owner evidence |         1 |         1 |
| Owner-membership second wave             |         0 |         0 |
| Standalone cycle second wave             |         0 |         0 |
| Critical / total demand remote           | **3 / 3** | **3 / 3** |

There is no browser list data fetch, duplicate list read, refresh-token request in the measured Savings demand or new RPC. Prefetch and initial Money reads are separated by request identity. The existing conditional provider-package validation for matured rollover Savings remains: the three-call invariant is measured for this all-active fixture, not a claim that those existing conditional reads disappeared.

## Correctness

- All four Candidate A comparisons and all four Candidate B comparisons (eight request samples per candidate) retain the final list semantics described above. Disclosure-field omission is explicit; raw transport equality is not claimed. The normal authenticated final API read independently confirms exactly 34 Savings / 50 cycles / 122,661 bytes, no six disclosure columns in any cycle, and strictly matching active owner IDs/households.
- Nine new orchestration tests pass: projection separation; one-cycle, multiple historical cycles, active-priority, matured-priority, terminal fallback, historical-mode and no-cycle overview equality; malformed snapshot/status/numeric and object-valued relation fallback. Existing owner evidence cases still cover household, viewer personal, partner personal, former/inactive, missing, foreign-household, mismatched owner and malformed-active evidence. Existing Detail preserves full settlement/renewal/transaction/chain fields and full cycle history.
- Anonymous final projection fails with HTTP 401 / `42501`; a foreign household filter returns zero rows. Parent household scope, cycle FK/RLS and left owner evidence are unchanged. No new privilege, grant, SECURITY DEFINER function or service-role path exists.
- Live fixture has 33 household Savings and one partner personal Saving. Viewer-personal, inactive-owner, malformed-data, terminal and matured permutations are synthetic test evidence, not newly created live financial fixtures. Earlier-phase inspected policies remain unchanged; an empty foreign filter is not misrepresented as a populated cross-household attempt.

## Regression controls

These routes are observed, not optimized. Warm medians in ms:

| Transition | Control useful | Phase 7 useful | Control full data | Phase 7 full data | Remote demand count before / after |
| ---------- | -------------: | -------------: | ----------------: | ----------------: | ---------------------------------- |
| Create     |          378.5 |          361.8 |           1,328.5 |           1,061.5 | [7] / [7]                          |
| Back       |           44.1 |           44.5 |              44.1 |              44.6 | [0] / [0]                          |
| Detail     |        1,022.4 |          911.9 |           1,355.5 |           1,411.6 | [8] / [8]                          |

Every pass retains early Create name edits and the main/viewport DOM identity. Create starts before reference completion; cached Back has zero RSC/remote demand; Detail keeps one combined Saving+full-cycles read and independent deferred references/activity. Browser ownership smoke verifies household actions remain available and partner personal Detail remains readable with no mutation editor. No financial action is submitted.

## Browser verification

EN/VI × light/dark × 390/440/768/1280 checks pass in both frozen control and selected implementation. Every combination has 34 rows, no horizontal overflow and a centered shell at most 440px. The entire loaded list text and all ordered row navigation targets match the control exactly in all 16 combinations, including principal, expected interest/tax/received totals, group counts/totals, rate/date/maturity labels and personal ownership badge. Reduced-motion reload preserves the same text. These browser comparisons complement the application-model ownership/capability assertions; they do not claim that the live fixture contains every synthetic edge case.

Read-only smoke confirms native Create → Back restores the exact Savings history entry while Create is streaming; the household Detail editor remains available; partner personal Detail has no mutation editor; browser Back restores Savings. No Save/Confirm/settlement/create action is submitted. Primary flow telemetry also retains the progressive Create/Detail boundaries and their previous request topology.

Screenshots: ignored `output/playwright/phase7-{control,after}-{locale}-{theme}-{width}.png`. EN/light 440px and VI/dark 390px were visually inspected. The pre-existing compact header title truncation remains outside this query task. This is unchanged-screen verification, not a new UI design or a full WCAG audit.

## Validation and refactor review

- `npm run lint`: passes without new warnings after the test-fixture cleanup.
- `npm run typecheck`: fails only at the pre-existing Home translator incompatibilities (`home-streaming-sections.tsx:99,340`); no Phase 7 source/test type error.
- Final `npm run test`: **247 files passed / 3 failed; 1,676 tests passed / 5 failed**. The same five failures reproduce in the frozen pre-edit control: i18n EN/VI key parity, Money identity wrapping, and three account-presentation tests missing NextIntl context. Focused Savings/session/progressive navigation collection: **7 files / 121 tests pass**, including all **50 orchestration tests** (41 retained + 9 added). No unrelated fix.
- `npm run test:e2e` with an isolated no-write config: **2 authenticated infrastructure tests pass** (session reload/auth-entry and Transactions/create shell). Financial fixture global hooks and mutating suites are omitted; actual Savings correctness is covered by the browser flow and comparisons above.
- Both corrected disposable production builds pass with type checking bypassed only in scratch copies. This does not establish a clean strict production build; repository Next config is untouched.
- Repository `npm run format:check` retains existing formatting debt. The Phase 7 source/test/report/evidence files pass scoped formatting; no broad formatting edits.
- `refactor-review` applied to the Phase 7 delta against the two pre-edit snapshots and checked the complete existing working-tree file inventory. No new domain literal, enum/constant duplication, unsafe cast, `any`, silent catch, financial formula, policy duplication, hook/state, dependency, dead helper or remote waterfall. The small generic relation normalizer serves the two genuinely different List/Detail row types. The existing Detail cast is renamed, not expanded. Shared calculations and command authority remain intact.

The supplied deeper coding-standard artifact paths are absent from this checkout and no replacement policy files were found. The always-on `.cursor/rules/no-magic-strings.mdc` and canonical PROJECT/skills were read and enforced. New strings are query column/projection identifiers and test fixture labels; no new product/domain value is introduced.

Documentation checked: current Supabase changelog, [PostgREST resource embedding](https://postgrest.org/en/stable/references/api/resource_embedding.html) and [Supabase embedded ordering](https://supabase.com/docs/reference/javascript/order). Existing FK-based left embedding is sufficient for the selected change. No applicable newly introduced API break was needed by this implementation.

## Architecture conclusion

**Was the 151 KB payload materially overfetched?** Yes in bytes: six unused cycle disclosure/activity fields account for a measured **28,624 bytes / 18.9%** of the decoded response. It additionally transports 16 rolled candidates whose financial values do not contribute to this fixture's final list. This does **not** establish that overfetch materially caused the approximately 500 ms remote request.

**Could the list avoid full cycle history?** Yes conceptually: the domain needs exactly its selected lifecycle cycle, including active/matured/terminal priority and tie-breaks. This implementation retains the candidate set. A tested bounded relational alternative returns 47 rather than 50 cycles, saving just 1,297 extra bytes over the column trim. An exact one-cycle read model was not deployed or exhaustively proven.

**Was PostgREST sufficient?** Yes for the selected safe column trim, embedded owner evidence, one-request topology and lifecycle-equivalent list values. The tested aliases support a bounded candidate set. They do not express conditional removal of every lower-priority candidate; plain order/limit is not a complete replacement for the selector. No blanket claim is made that all possible relational/anti-join designs were exhausted.

**Was a new RPC justified?** No. No consistent first-useful gain is established; the remaining rolled payload after narrowing is approximately 13.5 KB of compact cycle objects. A new database lifecycle/security contract is disproportionate to that measured benefit. Existing Home summary is unsuitable. No migration, RPC prototype or privileged production path was added.

**Did fewer bytes measurably reduce first-useful latency?** The final primary pair is faster, but earlier matched and alternating collections contradict a reproducible gain. Report the primary numbers above as observations, not payload causality. The dependable outcome is smaller correct transport at unchanged request count. The result is partial because the proposed expense hypothesis and exact minimal lifecycle/snapshot read model are not established.

## Remaining bottleneck

The approximately half-second hosted Savings header envelope remains the largest measured critical stage; the parallel verified session gate is also variable. Body consumption and mapping are much smaller. No exact SQL, gateway, geographical RTT or per-hop breakdown was collected in Phase 7, so the residual cannot be attributed precisely to database execution or network geography. Session/auth, deployment topology and all other routes remain out of scope and untouched.

## Decision

Keep the inexpensive, equivalent column trim. Do not call the latency hypothesis proven or declare the read model globally minimal: full candidate history, mixed-use snapshots and a small unused provider metadata field remain deliberately conserved. Do not proceed automatically to Phase 8 on inconsistent latency evidence. The primary final pair improved, but the repeated controls/prototype require an investigation conclusion rather than a causal speedup claim.

Companion: [sanitized machine-readable evidence](money-savings-navigation-phase-7-evidence.json). All primary and diagnostic timing samples are retained; no credentials, cookies, token contents or raw financial rows are included. Temporary server/browser and credential-bearing profiling copies are cleaned up. No commit or deployment is created.

**PHASE 7 PARTIAL — INVESTIGATE BEFORE PHASE 8**
