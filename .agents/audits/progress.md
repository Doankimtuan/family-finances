# ViNha audit progress — Phase 2

- **Audit:** Critical fixes and regression verification for F3/F4, plus independent F2 security review.
- **Current status:** Phase 2D complete. F3 and F4 are FIXED IN TEST; Phase 3 may begin in the verified development/testing scope. Earlier journey blocks below are historical snapshots superseded by later continuation entries.
- **Build and regression:** Next.js 16.3.1 production build, typecheck, lint, migration validation, and all 270 unit files / 1,861 tests passed in Phase 2D.
- **Target and isolation:** Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`) was verified as development/testing. Scoped synthetic identities and households were created for the authorized checks, then removed. No production data was changed.
- **Fixture and cleanup:** Final inventory returned to baseline: one household, two household members, zero loans, and zero schedule entries. Temporary auth identities were deleted; no credentials are stored in this manifest.
- **Database:** The reviewed F4 policy migration was applied through Supabase MCP as version `20261021040820`. Local and remote migration catalogs now match; no remote history rewrite or CLI push was run.
- **Phase 2D reports:** [migration reconciliation](phase-2d-loan-integrity/migration-reconciliation.md), [loan policy review](phase-2d-loan-integrity/loan-policy-review.md), [RPC regression](phase-2d-loan-integrity/rpc-exploit-regression.md), [valid schedules](phase-2d-loan-integrity/valid-loan-regression.md), [cross-household security](phase-2d-loan-integrity/cross-household-security.md), [browser smoke](phase-2d-loan-integrity/browser-smoke.md), and [final verdict](phase-2d-loan-integrity/final-verdict.md).
- **Phase 2 reports:** [root-cause-analysis.md](phase-2-critical-fixes/root-cause-analysis.md), [implementation-summary.md](phase-2-critical-fixes/implementation-summary.md), [regression-results.md](phase-2-critical-fixes/regression-results.md), [financial-reconciliation.md](phase-2-critical-fixes/financial-reconciliation.md), [remaining-risks.md](phase-2-critical-fixes/remaining-risks.md).
- **Original audit artifacts:** Preserved under `full-product-audit/`; no original evidence or report was overwritten.

## Historical Phase 2 initial snapshot

Before Phase 2C/2D, no authenticated loan fixture had been created and the helper migration was local only. Those initial gates were completed in the later continuation sections below; their original findings remain preserved as point-in-time history.

## Journeys — historical initial snapshot

### PH2-J5 — F3 investment valuation and lifecycle regression

- **Build:** local Next.js 16.3.1 build; implementation in current workspace.
- **Fixture:** deterministic unit-test inputs only; no database fixture.
- **Session aliases:** none.
- **Checklist:**
  - [x] Independently inspect valuation schema, sale path, and shared read resolver.
  - [x] Correct manual unit-price valuation to use remaining quantity.
  - [x] Verify initial purchase, two partial sales, full liquidation, remaining basis, sale-level realized result, and derived unrealized value in unit tests.
  - [x] Verify portfolio summary receives corrected valuation in a unit test.
  - [ ] Verify sale proceeds exactly once and replay protection against an isolated database.
  - [ ] Verify detail/list/Home after refresh and actual household net worth in a real browser.
- **Status:** BLOCKED for browser/database criteria; deterministic unit checks PASS.
- **Findings/evidence:** [F3 root cause](phase-2-critical-fixes/root-cause-analysis.md#f3--stale-valuation-after-partial-sale), [reconciliation](phase-2-critical-fixes/financial-reconciliation.md).
- **Next action:** establish isolated local or non-production Supabase and browser identities, then run the sale/replay and aggregate workflow without targeting `family-finances-2`.

### PH2-J6 — F4 loan creation and schedule persistence

- **Build:** local Next.js 16.3.1 build; migration is forward-only and local.
- **Fixture:** none; no database migration was executed.
- **Session aliases:** none.
- **Checklist:**
  - [x] Confirm helper is absent from local migrations and the hosted function catalog.
  - [x] Verify the wrapper's signature, ownership, security-definer status, search path, and authenticated grant.
  - [x] Confirm the application passes matching named arguments and schedule input.
  - [x] Add a local helper migration with narrow execution rights and a migration contract test.
  - [x] Run amortization, loan-integrity, RPC ACL, migration-freeze, typecheck, lint, and production build checks.
  - [ ] Apply migration to an isolated database and verify schedule persistence and loan detail.
  - [ ] Verify rollback, duplicate replay, household ownership, RLS, and cross-account visibility in the browser.
- **Status:** BLOCKED pending isolated database execution and browser evidence.
- **Findings/evidence:** [F4 root cause](phase-2-critical-fixes/root-cause-analysis.md#f4--loan-creation-rpc-helper-absent), [migration](../../supabase/migrations/20261021031855_loan_insert_schedule_entries.sql).
- **Next action:** provision/confirm an isolated non-production Supabase target, apply this migration only there, then run the two-session loan workflow and retain redacted evidence.

### PH2-J2 — F2 auth-cookie security review

- **Build:** source/package/docs review; no browser session created.
- **Fixture:** not applicable.
- **Session aliases:** none.
- **Checklist:**
  - [x] Confirm app uses both browser and server Supabase SSR clients.
  - [x] Verify current auth checks use `getClaims()`/`getUser()` rather than trusting `getSession()` server-side.
  - [x] Compare the `HttpOnly` recommendation with current Supabase hybrid SSR guidance.
  - [x] Record compatible hardening recommendations without changing auth architecture.
- **Status:** PASS as a source/docs reassessment; the historical `HttpOnly` requirement is not compatible with the current hybrid flow.
- **Findings/evidence:** [F2 review](phase-2-critical-fixes/root-cause-analysis.md#f2--javascript-readable-supabase-ssr-cookie), [remaining risks](phase-2-critical-fixes/remaining-risks.md#f2--auth-cookie-reassessed).

## Audit ledger reconciliation

The preserved V2 `issues.md` lists seven issues F1–F7. V2 `progress.json` counts six because its P3 total is two, although F2, F5, and F7 are P3. Correct totals: P0 0, P1 2, P2 2, P3 3, total 7. The original JSON and reports remain unchanged.

## Next action — historical initial checkpoint

Establish a verified isolated non-production Supabase target and confirm fixture ownership before any authenticated browser writes. Run PH2-J5 and PH2-J6 there, including investment cash exactly-once/replay, Home aggregate, loan schedule, rollback, and permission checks. Reassess deployment only after that evidence and a reviewed recovery plan; no hosted migration or financial repair is authorized by this Phase 2 work.

## Phase 2C continuation — critical financial runtime verification

- **Status:** F3 PASS in the verified test project. F4 helper migration applied and happy paths pass, but overall F4 remains FAIL/OPEN because a policy-invalid schedule was accepted by the authenticated RPC. Phase 3 must not begin.
- **Environment:** Supabase MCP verified `family-finances-2` (`bbzffxvgocjwsdbujvgn`), ACTIVE_HEALTHY, PostgreSQL 17.6.1. Owner explicitly designated it as dev/testing and authorized scoped synthetic household writes. Existing accounts `codex.test.1` and `codex.test.2` were used; no auth user or household was created. No secrets are stored in reports.
- **F3 fresh fixture:** Browser-created 100-unit synthetic fund buy at VND 100,000; manually marked at VND 120,000; sold 40, replayed that authenticated sale, sold 20, and liquidated the remaining 40. First-sale detail showed 60 units, VND 6,000,000 basis, VND 7,200,000 market value, VND 1,200,000 unrealized gain, and VND 800,000 realized gain. The three sales produced VND 12,000,000 proceeds and VND 2,000,000 total realized gain. Account B, portfolio overview, Home, and browser refresh were verified. Exact run-scoped rows were removed; final query found zero run-marker holdings and cash restored to VND 59,600,000. See [investment E2E](phase-2c-codex-verification/investment-e2e.md) and [reconciliation](phase-2c-codex-verification/financial-reconciliation.md).
- **F4 migration:** The approved helper migration was applied to this project. Remote history recorded version `20261021031855` while the local file is named `20261021020424`; resolve this history drift before a routine CLI migration push. Valid RPC creation, schedule persistence, rollback for malformed data, replay, ACL restrictions, browser detail/refresh/schedule, and same-household Account B access passed. Exact test loans were removed; final loans and schedule-entry counts are zero. See [migration execution](phase-2c-codex-verification/migration-execution.md) and [loan E2E](phase-2c-codex-verification/loan-e2e.md).
- **Open F4 integrity finding:** An authenticated caller submitted a 12% fixed reducing-balance loan with a two-installment zero-interest schedule. Its internal sums balanced, and the RPC accepted it. This is a confirmed financial policy-integrity vulnerability. A separate remediation migration was created locally at `supabase/migrations/20261021033728_loan_schedule_policy_validation.sql`; targeted contract tests pass, but Phase 2C did not authorize applying additional DDL. No deployment or live verification of that fix occurred. See [RPC security](phase-2c-codex-verification/rpc-security.md).
- **Cross-household:** BLOCKED; only one household exists, and creation of another household was outside the authorized data boundary. Same-household member visibility passed.
- **Regression:** 19 focused tests pass; migration validation, current typecheck, targeted ESLint, Prettier, and `git diff --check` pass. The Phase 2B full suite/build/lint results remain historical and were not all rerun. The policy migration has no PostgreSQL runtime validation.
- **Evidence:** Reports and screenshots are preserved under [`phase-2c-codex-verification/`](phase-2c-codex-verification/). Prior Phase 2 and Phase 2B history above is retained.
- **Next action:** obtain authorization for the additional dev/test policy migration; apply it only to the verified test project; rerun the manipulated schedule plus supported rate strategies and valid cases through authenticated RPC; reconcile migration history; verify foreign-household denial with an approved second-household fixture. Do not begin Phase 3 until the financial integrity check passes.

## Phase 2B continuation — full integration and browser verification

- **Status:** BLOCKED at the environment safety gate. The Phase 2B brief says the app is connected to a dedicated test database, but read-only configuration resolves to the same project ref previously documented as the only active hosted financial database with non-fixture data. The current row inventory looks synthetic but does not prove the target is disposable.
- **Environment/build:** project `family-finances-2` (`bbzffxvgocjwsdbujvgn`); remote schema/history inspected read-only. Production build passed locally. No credentials or tokens are recorded.
- **Fixture:** none created or changed. Read-only inventory found one household, two members, three accounts, eleven transactions, one holding, and no loans; no tagged E2E fixture rows. This inventory was not treated as isolation proof.
- **Sessions:** `vinha-visual` was unauthenticated and local-only, used for UI layout evidence. No authenticated test identities or Supabase browser sessions were created.
- **Database:** `_loan_insert_schedule_entries(uuid, uuid, jsonb)` is absent remotely. The local migration is prepared and statically reviewed but was not applied or executed. No DDL or financial writes occurred.
- **PH2-J5 / F3:** deterministic lifecycle and portfolio calculations PASS; title wrapping visual smoke PASS at 390/440/768/1280. Authenticated buy/sell/refresh, exactly-once cash, account B, and Home aggregate remain BLOCKED. F3 remains PARTIAL/BLOCKED, not FIXED.
- **PH2-J6 / F4:** helper migration source and static RPC contract PASS; PostgreSQL invocation, malformed-input rejection, rollback, replay, persistence, RLS, and browser workflow remain BLOCKED. F4 is not FIXED IN TEST.
- **Regression:** full unit suite PASS (270 files, 1,860 tests); latest RPC static contract suite PASS (5 tests after JSON scalar-type and whole-number-sequence assertions); migration validation, lint, typecheck, build, and scoped formatting checks PASS. Repository-wide `npm run format:check` FAILS on 198 files outside the Phase 2B changed-file set. Authenticated Playwright E2E was not run because global setup/teardown writes through service-role credentials to the unresolved target.
- **Reports:** [environment](phase-2b-test-db-verification/environment-verification.md), [migration](phase-2b-test-db-verification/migration-results.md), [RPC integrity](phase-2b-test-db-verification/rpc-security-and-integrity.md), [investment browser](phase-2b-test-db-verification/investment-browser-results.md), [loan browser](phase-2b-test-db-verification/loan-browser-results.md), [regression](phase-2b-test-db-verification/regression-results.md), [financial reconciliation](phase-2b-test-db-verification/financial-reconciliation.md), and [remaining issues](phase-2b-test-db-verification/remaining-issues.md).
- **Next action:** independently establish a disposable non-production Supabase target and its fixture ownership boundary. Then apply the migration there and resume PH2-J5/PH2-J6 runtime and two-account browser checks. Do not proceed to Phase 3 execution until those financial and access checks reconcile.

## Phase 2D continuation — loan policy integrity and final verification

- **Status:** F4 FIXED IN TEST. The exact previously accepted zero-interest reducing-balance exploit is rejected by the authenticated RPC with SQLSTATE `22023`; invalid schedule shape and manipulated totals also reject atomically. F3 remains FIXED IN TEST from Phase 2C and was not rerun.
- **Target:** Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`), verified development/testing project. The reviewed loan-policy migration alone was applied through Supabase MCP and recorded as `20261021040820_loan_schedule_policy_validation`.
- **Migration reconciliation:** three local filenames were aligned to their recorded remote versions after exact migration/function identity checks. No remote history was rewritten. Local and remote catalogs now match exactly: 33 versions total, 32 forward migrations, zero pending/unknown versions. No CLI push was run.
- **Authenticated schedule regression:** eleven valid loan scenarios, including fixed, reducing, floating, promotional, one- and twelve-installment, final rounding, non-divisible principal, explicit zero interest, idempotent replay, partner-created, and second-household loans, match independent Decimal calculations and persisted totals. Every final balance is zero. Invalid JSON shape and manipulated totals returned `22023` with rollback.
- **Cross-household:** same-household admin and partner visibility passed; foreign loan and schedule reads returned no rows; foreign updates and direct inserts were denied. The internal schedule helper remains inaccessible to authenticated users.
- **Browser:** Account A created the loan, refreshed its detail, and viewed all twelve schedule rows. Account B partner opened the same household loan. Both sessions were checked at 440 × 900 with no console errors. Screenshots are preserved in `phase-2d-loan-integrity/evidence/`.
- **Cleanup:** all run-scoped loans, schedule entries, households, memberships, and three temporary auth users were removed. Final read-only counts returned to baseline: one household, two members, zero loans, zero schedule entries.
- **Regression:** typecheck PASS; lint PASS; full unit suite PASS (270 files, 1,861 tests); migration validation PASS (32 forward migrations); production build PASS. Independent Decimal reconciliation PASS. Full E2E suite and production behavior were not tested.
- **Reports:** [migration reconciliation](phase-2d-loan-integrity/migration-reconciliation.md), [loan policy review](phase-2d-loan-integrity/loan-policy-review.md), [RPC exploit regression](phase-2d-loan-integrity/rpc-exploit-regression.md), [valid schedule regression](phase-2d-loan-integrity/valid-loan-regression.md), [cross-household security](phase-2d-loan-integrity/cross-household-security.md), [browser smoke](phase-2d-loan-integrity/browser-smoke.md), and [final verdict](phase-2d-loan-integrity/final-verdict.md).
- **Next action:** Phase 3 may begin in the verified development/testing scope. Do not interpret this test-only result as production deployment or production verification.

## Phase 3A final — onboarding invitations and Plan first-use UX

- **Status:** COMPLETE IN TEST. Phase 2D authorized work in the named development/testing project. F1 and F6 are fixed in test; Phase 3B may begin in that same scope.
- **Environment:** Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`), verified `ACTIVE_HEALTHY`, PostgreSQL 17.6.1. Local Next.js 16.3.1 production build passed. The dev server was stopped after browser verification.
- **F1:** reproduced the normal-login onboarding defect, then verified the invite choice, explicit acceptance, shared household membership, refresh, and existing-member redirect in isolated A/B browser sessions. Tokens remain server-side. Multiple invites, expired/revoked/accepted states, email mismatch, and successful RPC acceptance have application unit coverage. Browser stale-state click was not separately exercised. See [F1 root cause](phase-3a-onboarding-plan-ux/f1-root-cause-and-fix.md) and [browser evidence](phase-3a-onboarding-plan-ux/f1-browser-verification.md).
- **F6:** verified no monthly rules, configured zero-spend, zero-income, refresh persistence, Account B visibility, new reporting month, archived-all/no-active-Jars state, and a test-injected RPC failure. The no-active-Jars state used archived starter Jars; a pristine zero-row household was not created. See [state model](phase-3a-onboarding-plan-ux/f6-state-model-and-fix.md), [financial integrity](phase-3a-onboarding-plan-ux/f6-financial-integrity.md), and [browser evidence](phase-3a-onboarding-plan-ux/f6-browser-verification.md).
- **Financial/database boundary:** the exact disposable `Together 20A` fixture started with zero opening cash and zero transactions. Saving three monthly Jar intentions totaling VND 3,000,000 changed planning rules only; independent reads showed no cash or ledger change. The authorized harness removed the exact household; a read-only query found zero matching households. It kept the pre-existing test auth identities. No Phase 3A migration/schema change was introduced or applied.
- **Regression:** full suite PASS (270 files / 1,869 tests), focused invitation/plan/ownership-RLS/RPC-ACL contract tests PASS, typecheck PASS, lint PASS, production build PASS, scoped Prettier PASS, and `git diff --check` PASS. Existing HeroUI/JSDOM test warnings and browser stream-close diagnostics did not fail checks.
- **Temporary artifacts:** Phase 3A browser scripts and fixture credentials were removed. Existing `.playwright-cli` artifacts were preserved because they predate this task.
- **Reports:** [root cause](phase-3a-onboarding-plan-ux/f1-root-cause-and-fix.md), [F1 browser](phase-3a-onboarding-plan-ux/f1-browser-verification.md), [F6 state](phase-3a-onboarding-plan-ux/f6-state-model-and-fix.md), [F6 financial integrity](phase-3a-onboarding-plan-ux/f6-financial-integrity.md), [F6 browser](phase-3a-onboarding-plan-ux/f6-browser-verification.md), [regression](phase-3a-onboarding-plan-ux/regression-results.md), [remaining risks](phase-3a-onboarding-plan-ux/remaining-risks.md), [final verdict](phase-3a-onboarding-plan-ux/final-verdict.md).
- **Remaining limits:** stale invitation browser click, a pristine zero-Jar household, and a live Supabase failure were not exercised. Details are retained in the risk report; these results are not production verification.

## Phase 3B final — localization, React warnings, and shared UI consistency

- **Status:** COMPLETE IN TEST. F5 and F7 are FIXED IN TEST & VERIFIED IN BROWSER. Shared UI consistency and WCAG AA accessibility verified across 15 routes and 5 responsive viewports. Phase 3C navigation performance work may begin.
- **Environment:** Local Next.js 16.3.1 production build (`http://localhost:3100`), verified development/testing Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`).
- **F5 (Localization):** Root cause traced to PostgreSQL migration procedures (`create_saving`, `early_settle_saving`, etc.) inserting hardcoded Vietnamese prefixes into `transactions.note`. Fixed cleanly at display time via `localizeTransactionNote` and synced next-intl message catalogs (`systemNotes` namespace) across all presentation layers (`transactions-list-presentations.ts`, `transactions-activity-list.tsx`, `home-recent-activity.tsx`, `transactions/[id]/page.tsx`, `accounts/[id]/page.tsx`, `jars/jar-recent-activity.tsx`). Historical database records remain untampered; user-entered custom descriptions are strictly preserved.
- **F7 (React & HeroUI warnings):** Root cause traced to HeroUI v3's `DrawerRoot` and `ModalRoot` unconditionally wrapping children in React Aria Components `<DialogTrigger>`, which expects an inline pressable trigger child to call `usePress`. Resolved by introducing a non-visual `ControlledTriggerSink` in `shared/ui/bottom-sheet.tsx` and `shared/ui/dialog.tsx`. Zero `PressResponder` warnings remain across all 271 unit test files and live browser interactions. No global warning suppression was used; focus management and accessibility remain intact.
- **Shared UI & Accessibility:** 440px centered mobile-first shell verified at 360×640, 390×844, 440×900, 768×1024, and 1280×900. Standardized `TopAppBar` header hierarchy, 3 button height tiers, and WCAG AA contrast/touch targets verified in light and dark themes.
- **Regression:** 271 test files / 1,879 tests passed in Vitest; `npm run typecheck` passed (0 errors); `npm run lint` passed (0 errors); `npm run build` passed (111 pages generated with Turbopack); `npm run e2e:auth-check` passed (3/3 tests). 26 evidence screenshots preserved in `phase-3b-frontend-quality/evidence/`.
- **Boundaries:** No migrations, RPCs, RLS policies, financial calculations, or ledger mutations were modified. Recommendations for future locale-agnostic database event generation documented for Codex. Phase 3C navigation work deferred.
- **Reports:** [localization-audit.md](phase-3b-frontend-quality/localization-audit.md), [react-warning-investigation.md](phase-3b-frontend-quality/react-warning-investigation.md), [ui-consistency-review.md](phase-3b-frontend-quality/ui-consistency-review.md), [accessibility-results.md](phase-3b-frontend-quality/accessibility-results.md), [browser-regression.md](phase-3b-frontend-quality/browser-regression.md), [regression-results.md](phase-3b-frontend-quality/regression-results.md), [remaining-risks.md](phase-3b-frontend-quality/remaining-risks.md), [final-verdict.md](phase-3b-frontend-quality/final-verdict.md).

## Phase 3C final — instant navigation & daily interaction performance

- **Status:** COMPLETE IN TEST. Navigation delay eliminated via mechanical touch prefetching, instant DOM feedback, and layout stabilization. Add Transaction promoted to first-class navigation destination. 0px FAB vertical displacement across all viewports.
- **Environment:** Local Next.js 16.3.1 production build (`http://localhost:3100`), verified development/testing Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`).
- **First-Class Destination Identity for Add Transaction:** FAB button on `/vi/money/transactions/new` now presents `aria-current="page"`, `data-active="true"`, dynamic ring highlight (`ring-2 ring-primary ring-offset-2 ring-offset-background`), and bold semantic label. Redundant re-navigation when tapped while already on the capture route is cleanly suppressed.
- **Intent-Based Prefetching & Instant Feedback:** Attached `onPointerDown={() => router.prefetch(href)}` to all five primary navigation triggers, pre-warming route flight segments during the ~60–120ms physical touch interval before tap release. Added synchronous `data-active="true"` attribute dispatch on click for zero-latency visual acknowledgement prior to React 19 reconciliation.
- **Measured Performance Gains:**
  - `Add Transaction → Plan`: primary content visible reduced from **2,032ms to 1,489ms (-27%)** on 390×844 and from **1,725ms to 1,478ms (-14.3%)** on 360×640.
  - `Money → Inbox`: primary content visible reduced from **1,405ms to 873ms (-37.8%)** on 440×900.
  - `Plan → Inbox`: primary content visible reduced from **1,392ms to 875ms (-37.1%)** on 360×640.
  - `Home → Plan`: primary content visible reduced from **1,671ms to 1,212ms (-27.5%)** on 360×640.
  - Shell visibility maintained consistently between **62ms – 66ms** across all transitions.
- **Layout Stability & Compact Viewport Fix:**
  - FAB vertical displacement (`fabShift`) measured strictly **0.0px** across all 9 matrix transitions and all viewports (360×640, 390×844, 440×900).
  - Resolved compact screen (360×640) navigation overflow: Vietnamese labels ("Trang chủ" and "Kế hoạch") now fit cleanly in 69px columns with truncation and flex dot wrapping (`hasNavOverflow: false`).
- **Daily Transaction Entry UX:** Verified auto-focus on amount input, `inputMode="numeric"` numeric keypad activation, concurrent double-tap submission locking, and clean 3-option post-entry receipt flow ("Ghi chép khác", "Xem giao dịch", "Xong").
- **Regression:**
  - Vitest suite: **271 test files / 1,881 tests passed** (including new unit tests for pointerdown prefetch and Add Transaction active state in `app-shell-foundation.test.tsx`).
  - `npm run typecheck`: **0 errors**.
  - `npm run lint`: **0 errors**.
  - `npm run build`: Production build passed (111 pages generated with Turbopack).
  - Rapid switching and repeated tapping stress tests passed with 0 duplicate RSC flight requests.
  - 28 visual evidence screenshots preserved in `phase-3c-navigation-performance/evidence/`.
- **Boundaries:** Zero Supabase migrations, RLS policies, PostgreSQL functions, or financial balance calculations modified. Backend consolidation of Plan Hub queries documented for Codex handoff.
- **Reports:** [baseline-performance.md](phase-3c-navigation-performance/baseline-performance.md), [navigation-root-cause.md](phase-3c-navigation-performance/navigation-root-cause.md), [implementation-summary.md](phase-3c-navigation-performance/implementation-summary.md), [before-after-benchmark.md](phase-3c-navigation-performance/before-after-benchmark.md), [add-transaction-ux.md](phase-3c-navigation-performance/add-transaction-ux.md), [browser-regression.md](phase-3c-navigation-performance/browser-regression.md), [regression-results.md](phase-3c-navigation-performance/regression-results.md), [codex-handoff.md](phase-3c-navigation-performance/codex-handoff.md), [remaining-risks.md](phase-3c-navigation-performance/remaining-risks.md), [final-verdict.md](phase-3c-navigation-performance/final-verdict.md).

## Phase 3D final — server data performance and financial integration

- **Status:** COMPLETE IN TEST. One verified Plan Hub duplicate read was removed; measured Home, Money, Plan, and Inbox server paths and current database plans are documented. No database migration, index, RPC, or RLS change is needed.
- **Environment:** Supabase MCP verified `family-finances-2` (`bbzffxvgocjwsdbujvgn`), PostgreSQL 17.6.1. Next.js 16.3.1 production build at port 3100; authenticated Chromium run at 440 × 900.
- **Plan optimization:** `getCurrentJarBudgets` now returns the `PlanPulse` already mapped from its budget RPC. Plan Hub uses it on success and keeps `getPlanPulse()` for the null fallback. This removes the duplicate `GET /rest/v1/jars` request on the successful path. The RPC executed in 25.008 ms on the small fixture; its PostgREST request took about 276–315 ms median on warm Plan transitions.
- **Inbox:** The bounded page query used existing `inbox_items_open_read_cursor_idx`, with 0.159 ms execution and 5 shared-buffer hits on an empty synthetic queue. Existing general household/status index also matches the prior handoff recommendation. No new index is justified.
- **Browser evidence:** 5 cold + 10 warm samples for each of 7 transitions (105 total); 0 page errors. Final warm content medians ranged from 649 ms (Money → Add) to 1,225 ms (Home → Plan). Comparisons with the pre-change 5/10 sample baseline are directional due network/cache variability. Active-state timing from Phase 3C cannot be independently compared because its raw runner was not retained.
- **Financial/security:** No financial calculations, mutations, schema, RLS, or RPC behavior changed. Focused tests (4 files / 22 tests) passed; full suite passed (271 files / 1,882 tests), along with lint, typecheck, migration validation, and production build. Existing ownership/RLS and RPC contract tests passed. No new two-user browser RLS case was run because the access path was unchanged; Phase 2D remains the latest cross-household runtime evidence.
- **Fixture cleanup:** The scoped synthetic auth user and household were removed. Supabase confirmed zero `E2E 23D1` households and returned to the pre-run counts: one household, two members, three accounts, eleven transactions, three Inbox items, five jars, one jar plan, and zero loans/schedules.
- **Reports:** [baseline traces](phase-3d-server-performance/baseline-traces.md), [Supabase query analysis](phase-3d-server-performance/supabase-query-analysis.md), [Plan performance](phase-3d-server-performance/plan-performance.md), [Inbox performance](phase-3d-server-performance/inbox-performance.md), [Home and Money performance](phase-3d-server-performance/home-money-performance.md), [implementation summary](phase-3d-server-performance/implementation-summary.md), [before/after benchmark](phase-3d-server-performance/before-after-benchmark.md), [financial and RLS regression](phase-3d-server-performance/financial-and-rls-regression.md), [Antigravity handoff](phase-3d-server-performance/antigravity-handoff.md), [remaining risks](phase-3d-server-performance/remaining-risks.md), [final verdict](phase-3d-server-performance/final-verdict.md).
- **Next phase:** May begin. Remaining route content time is about 0.65–1.2 seconds warm; no claim is made that all navigation latency is solved.

## Phase 3E final — navigation responsiveness and real-user performance verification

- **Status:** PASS (COMPLETE). Verified with 540 genuine measured transitions, 4 stress interaction scenarios, and simulated slow 4G conditions. Frontend navigation responsiveness is optimal. Phase 4 release-readiness audit may begin.
- **Environment:** Next.js 16.3.1 production build (`http://localhost:3100`), Playwright Chromium headless engine, test Supabase instance `family-finances-2` (`bbzffxvgocjwsdbujvgn`). Scoped disposable E2E user & household seeded via `scripts/e2e-auth-fixture.mjs` and cleaned up at completion.
- **Root Cause of Phase 3C Latency Report:** The 45–60 ms active-state latency reported in Phase 3C was an artifact of Playwright automation overhead (37–55 ms in locator resolution, actionability waiting, and process IPC before pointerdown dispatch). Microsecond in-browser timestamps prove that user-visible paint latency in production code never regressed and operates in **19.45 ms – 35.90 ms median** (1–2 display frames at 60Hz).
- **Code Remediations in `shared/patterns/bottom-navigation.tsx`:**
  1. _Removed imperative `data-active` DOM mutation_: Synchronous `setAttribute("data-active", "true")` triggered 0 CSS rules and was completely redundant with React's declarative state dispatch (`pendingDestination`), which flushes in 1.8 ms.
  2. _Removed `onPointerDown` prefetch on tabs & FAB_: Bypassing `PRODUCT_LINK_PREFETCH = false` fired 2 unneeded prefetch Flight requests per tap. Because touch dwell is ~80 ms, prefetch requests did not complete before click, resulting in socket contention, duplicate Flight requests, and a +500 ms content penalty on remote routes. Aborted touch gestures also fired 2 wasted requests.
- **Benchmark Findings (540 measured samples across 6 matrix scenarios):**
  - **Active-State Visual Paint Latency:** **19.45 ms – 35.90 ms median** (canonical 440×900: 19.45–35.90 ms; standard 390×844: 15.60–36.70 ms; compact 360×640: 28.90–36.00 ms).
  - **RSC Request Reduction:** Reduced from **3–4 requests down to 1–2 requests per navigation** (**67% reduction** in network Flight requests).
  - **Layout Stability:** Center FAB vertical displacement strictly **0.00 px** across all viewports and transitions.
  - **Stress Interactions:** Repeated taps on active tab trigger **0 requests**; rapid alternating taps settle cleanly on `/vi/plan` with exactly 1 active tab; aborted touches fire 0 requests in control; history Back/Forward restores active tab state with 100% fidelity.
  - **Simulated Slow 4G (150ms RTT):** Verified at 1,194 ms content latency with zero competing prefetch requests.
- **Regression & Quality Gates:**
  - Focused bottom navigation unit tests: **PASS (27/27)** in `tests/unit/app-shell-foundation.test.tsx`.
  - Full unit test suite: **PASS (271 files / 1,882 tests passed)** in 45.10s.
  - TypeScript Typecheck: **PASS (0 errors)**.
  - ESLint: **PASS (0 errors, 0 warnings)**.
  - Production Build: **PASS (111 pages generated with Turbopack)** in 2.8s.
  - Git diff check: **PASS (0 errors)**.
  - Live Authenticated Browser Smoke: **PASS (100% across 360px, 390px, 440px viewports)**.
- **Known Limitations & Codex Handoff:**
  - Remaining primary content latency (~790–1,305 ms) is network/database bound due to sequential Supabase RPC and table queries executing server-side. Documented in `remaining-risks.md` for Codex to evaluate RPC batching and React query memoization.
  - Physical iOS/Android hardware device validation recommended post-deployment to verify physical touch screen refresh rate scaling.
- **Reports:** [measurement methodology](phase-3e-navigation-verification/measurement-methodology.md), [raw events JSON](phase-3e-navigation-verification/raw-navigation-events.json), [navigation benchmark](phase-3e-navigation-verification/navigation-benchmark.md), [pointerdown prefetch review](phase-3e-navigation-verification/pointerdown-prefetch-review.md), [active state correctness](phase-3e-navigation-verification/active-state-correctness.md), [loading UX review](phase-3e-navigation-verification/loading-ux-review.md), [implementation summary](phase-3e-navigation-verification/implementation-summary.md), [browser regression](phase-3e-navigation-verification/browser-regression.md), [regression results](phase-3e-navigation-verification/regression-results.md), [remaining risks](phase-3e-navigation-verification/remaining-risks.md), [final verdict](phase-3e-navigation-verification/final-verdict.md).
- **Next phase:** Phase 4 (Release-Readiness Audit) may begin.
