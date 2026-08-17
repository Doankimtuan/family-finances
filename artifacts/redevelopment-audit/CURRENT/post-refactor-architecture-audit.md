# Post-Refactor Architecture and Code-Quality Audit

Audit date: 2026-08-17
Repository: family-finances
Scope: current tracked application, modules, shared infrastructure, tests, route composition, and validation scripts. No production code was changed.

## 1. Executive Summary

The repository is healthy enough to return to feature development, with a short list of targeted refactors worth doing opportunistically. The previous refactor sequence materially improved the high-risk areas: financial classification is centralized and cross-screen tested, Goal funding is derived in application code, Savings no longer writes during server render, error presentation has a shared StatusAlert path, route revalidation is centralized, and the current dependency graph has no confirmed cycles.

There are no current P0 findings. The largest remaining risks are:

1. Several application queries catch provider failures and return null or empty objects without logging, making infrastructure failure look like an empty or missing product state.
2. Only nine product forms use the established RHF/shared-field architecture; many meaningful Money and Plan action forms still manage submitted fields with local useState and manual validation.
3. money/savings/savings-actions.ts remains a large Server Action that directly queries and mutates Inbox/household tables while also deciding cross-module workflow branches.
4. A few semantic calculations still bypass canonical helpers, notably Goal completion-copy progress and non-Savings day-count calculations.
5. Expected signed-out auth failures are logged as errors, producing large build and E2E logs and obscuring unexpected tenancy failures.

Recommended posture: complete only the small, high-confidence items in the roadmap, then stop refactoring until feature work exposes a real need. Do not start another repository-wide decomposition or introduce a new state-management/form abstraction.

## 2. Validation Baseline

| Check | Result | Evidence / notes |
|---|---|---|
| bun run lint | PASS | ESLint exited 0. |
| bun run typecheck | PASS | tsc --noEmit exited 0. |
| bun run test | PASS | 107 files, 693 tests passed. Existing stderr includes intentional provider/auth failure fixtures and a PressResponder warning. |
| bun run build | PASS | Next build compiled, typechecked, and generated 94 routes. Repeated expected AuthSessionMissingError / dynamic-cookie logs are a quality signal. |
| bun run test:e2e:smoke | PASS | 5 passed, 2 skipped for credentials. |
| bun run test:e2e | PASS | 54 passed, 46 skipped; authenticated tests are fixture/credential gated. |
| bun run test:constitution | PASS | 7 files, 26 tests passed. |
| bun run format:check | FAIL (pre-existing hygiene) | Prettier reported 2,206 files, primarily archived artifacts and skill/reference content. No formatting changes were made during this audit. |

The full E2E suite exercises unauthenticated redirects and fail-closed flows well, but the 46 skipped authenticated tests leave the highest-value money mutation paths dependent on unit/integration coverage and local fixture setup.

## 3. Current Architecture Map

The actual dependency direction is:

    app/[locale] routes and layouts
      -> tenancy/session/membership gates
      -> module application queries and commands
      -> module infrastructure/query mappers
      -> modules/platform Supabase adapters

    client route leaves
      -> shared/ui and shared/patterns
      -> server actions
      -> application Result/status contracts

    shared/ui, shared/patterns, shared/i18n, shared/theme, shared/utils
      -> shared-kernel contracts and platform-neutral utilities

    providers
      -> theme, Supabase browser context, modal/status overlays

### Layers observed

| Layer | Current ownership |
|---|---|
| Route/app | app/[locale] route groups for auth, invite, onboarding, product, and system chrome. Pages authenticate, resolve membership, load application view models, and compose UI. Server Actions sit beside the route feature. |
| Modules/features | tenancy, ledger, plan, inbox, savings, investments, health, home, and platform. Cross-module reads are mostly application-level imports. |
| Application commands/queries | Commands validate input or trust a command schema, resolve the money/membership gate, call Supabase/RPC, map provider failures to typed codes, and return Result-style values. Queries map rows into product view models. |
| Domain logic | Strongest in ledger semantics, Savings calculations, Plan goal funding, jar budget, loan amortization, and health policies. Several domain/ directories remain scaffolds rather than active domain packages. |
| Infrastructure/platform | modules/platform/supabase/*, read-only Health shields, server/browser/route-handler clients, and row mappers. Direct platform imports from active TSX are effectively isolated to the Supabase provider; the notable exception is the Savings Server Action described below. |
| Shared kernel/UI | modules/shared-kernel contains Result, logging, route/path and small shared contracts. shared/ui owns controls and StatusAlert; shared/patterns owns shell, form adapters, cards, and product patterns. |
| Forms | RHF + Zod + shared/ui/form + shared/patterns/controlled-fields for the migrated forms. There is no literal FormHelper symbol in the current source; the current equivalent is the shared field/FormField infrastructure. |
| Errors | Typed domain/action codes, Result, action status unions, named provider-error classifiers, logActionFailure, and StatusAlert. The repository intentionally has both ok and status contracts because action/UI semantics are not identical. |
| Tests | 108 unit files, 40 E2E specs, one integration directory, 693 unit/integration tests in the full Vitest run, and Playwright smoke/critical flows. |

The direction is mostly sound. The main boundary bypass is not a general app-to-Supabase problem; it is the Savings action’s Inbox orchestration and the large amount of form/workflow logic still colocated under route files.

## 4. Previous Audit Resolution Matrix

| Historical issue | Status | Current evidence |
|---|---|---|
| Writes during Savings render | RESOLVED | savings/page.tsx renders SavingsLifecycleSync; savings-lifecycle-sync.tsx calls syncSavingsLifecycleAction from useEffect. savings-page-no-write-on-render.test.ts and savings-lifecycle-sync*.test.* protect the boundary. |
| Inconsistent financial transaction classification | RESOLVED for core reporting; PARTIALLY_RESOLVED for specialized breakdowns | modules/ledger/application/financial-semantics.ts is the canonical classifier. financial-classification-consistency.test.ts compares Home and Monthly Review across income, expense, reversals, investment proceeds, and transfers. get-monthly-review.ts still has direct Savings-event-kind and specialized type checks for some sub-breakdowns. |
| Divergent Goal progress semantics | PARTIALLY_RESOLVED | goal-funding.ts and goal-recurring-types.ts centralize linked funding, status, and progress. goal-detail-controls.tsx:251 still computes completion-copy progress with Math.round((fundedAmount / initialTarget) * 100) instead of calculateGoalProgressPercent, which returns two-decimal precision and handles invalid targets. |
| Duplicated Jar validation | PARTIALLY_RESOLVED | category-jar-policy.ts centralizes base category mapping and is used by category creation. configure-jar.ts still contains operation-specific category/conflict validation, while the form repeats client filtering for preview. This is legitimate trust-boundary duplication, but the shared invariant is not fully named across all paths. |
| Duplicate error presentation | RESOLVED for canonical migrated forms; PARTIALLY_RESOLVED repository-wide | Capture and migrated RHF forms use one form-level StatusAlert path and have behavioral tests. Manual flows such as credit-card installments, goal controls, and recurring/debt actions still use local boolean/code state and independently authored alerts. No evidence of the old same-error double-render in the canonical capture flow. |
| Inconsistent day-count/date semantics | PARTIALLY_RESOLVED | Savings uses shared/utils/iso-date.ts and differenceInUtcCalendarDays. plan-recommendations.ts defines its own DAY_MS/daysBetween; Home and list-goals.ts still contain raw millisecond day calculations. No failing date test was found, but the semantic contract is not repository-wide. |
| Duplicated percentage/basis-point/utilization calculations | MOSTLY_RESOLVED | shared/utils/percentage.ts centralizes percentage/basis-point conversion, and jar budget owns jar utilization. Remaining direct formulas are domain-specific or presentation-only, with the Goal detail formula above as the meaningful exception. |

## 5. Findings by Category

### 5.1 Forms and state ownership

The established architecture is present but not complete. Product useForm usage is concentrated in nine files: investments, loans creation, Savings creation/catalog, transaction capture/transfer, and Jar configuration/reallocation. Those forms use RHF, Zod-derived schemas, and shared field adapters appropriately. Complex workflows such as multi-step investment/Savings flows are valid reasons to retain direct RHF JSX and local step/preview state.

Meaningful mutation forms still bypass the architecture with submitted fields held in useState, including:

- money/accounts/add-account-form.tsx
- money/debts/debt-create-sheet.tsx and debt-payment-sheet.tsx
- loan edit/interest/pay actions
- Savings renewal and settlement actions
- transaction correction/refund forms
- goal creation/detail controls
- recurring creation/detail forms
- household preferences and invitation forms

This is not a reason to force every sheet into one generic helper. It is a consistency and stale-state risk: validation, reset-on-close, dependent-field clearing, server error ownership, and mutation result handling are reimplemented in many places. The strongest next candidate is one cohesive family such as Plan recurring/Goal actions or Money account/debt actions, with behavior tests before and after.

Native primary selects remain in correct-transaction-form.tsx, inbox-decision-panel.tsx, reallocate-jar-form.tsx, create-category-form.tsx, and household-preferences-form.tsx. This is UI-constitution drift, not a domain architecture defect.

### 5.2 TypeScript and domain modeling

Strengths:

- Domain constants and literal-derived types are widely used for ledger types, action codes, statuses, and route paths.
- Financial semantics, Goal funding, Savings date calculations, jar budget, and percentage conversion have named APIs.
- Map/Set are used for row joins, source resolution, and calendar membership where they improve clarity.

Remaining issues:

- loan-detail-panels.tsx:39 defines the translator as (key: any, values?: any) => string.
- list-goals.ts casts database source_kind directly to a domain union without runtime validation.
- goal-funding.ts uses as unknown as to make array includes accept broader status values, obscuring the actual status boundary.
- Some tenancy code still uses raw partner/admin role values instead of the repository’s constant-derived role type.
- Several query row types intentionally use raw string for database statuses and types. They are acceptable at the provider boundary only if mapping validates them; some current mappers rely on casts/default branches instead.

No broad any pattern or impossible-state boolean explosion was found. These are targeted typing improvements, not a case for adding a new domain type framework.

### 5.3 Error handling

The typed error infrastructure is substantially better than the historical baseline. Provider errors are classified in named adapters, application commands return codes, and unexpected command failures are logged. UNKNOWN is a legitimate terminal code in this repository and should not be counted as a defect by string occurrence alone.

The largest remaining issue is silent query fallback. A repository search finds 48 bare catch blocks in active app/modules/shared/provider code; many are legitimate parse or compatibility fallbacks, but at least these active query files return null or empty objects from bare catches without logging: modules/plan/application/queries/list-goals.ts, list-goal-funding-options.ts, list-jar-categories.ts, list-recurring.ts, get-household-calendar.ts, modules/savings/application/queries/list-savings.ts, modules/investments/application/queries/investment-queries.ts, modules/ledger/application/queries/list-money-products.ts, and related query paths. This collapses provider failure into no data and can produce a plausible but incomplete financial screen.

There are six active message-sniffing sites: Investments, Savings, Plan reallocation, Ledger, Inbox, and category creation. Five are named legacy RPC compatibility classifiers with marker constants and are appropriately isolated. create-category.ts still uses a broad message.includes("jar") check locally; it should eventually reuse the Ledger classifier or structured provider code.

The Supabase server cookie catch is a documented Server Component compatibility no-op and is acceptable. Savings lifecycle enrichment catches and logs a non-fatal failure by design. No raw Supabase error was found rendered directly to product UI, and no swallowed worker failure was found without either an explicit non-fatal comment or a typed failure return.

### 5.4 Application/domain boundary and Server Actions

Most actions follow the intended pattern: call an application command, map the typed result, revalidate named routes, and return a narrow action state. Investments and Monthly Review still return application ok results directly, and Savings provider actions rely on command-level parsing rather than an explicit action-level parse. These are contract outliers, not correctness failures.

The meaningful boundary outlier is app/[locale]/(product)/money/savings/savings-actions.ts:

- 528 lines combine ordinary action delegation, Inbox enrichment, household currency lookup, Inbox insert/update fallback behavior, and maturity/withdrawal workflow branching.
- It directly imports createSupabaseServerClient and writes inbox_items/reads households.
- It does scope queries by the resolved householdId, maps failures, and has tests, so no cross-household exposure was demonstrated.

This should be extracted only as a cohesive Savings/Inbox application command when the workflow changes again. A generic “all actions must look identical” rewrite would add churn without improving the current contract.

### 5.5 Next.js architecture and data access

Current structure is Server Component-first. Product pages authenticate and redirect before loading module data. Client boundaries are generally leaves for forms, filters, charts, and interactive panels. Supabase is not imported directly by active feature TSX except the provider; the Savings action is the server-side exception above.

Positive evidence:

- Independent reads commonly use Promise.all.
- React cache() is used for request-level deduplication; no unstable_cache or persistent authenticated cache was found.
- assertMoneyActionAllowed memoizes the household allowance per request, not across users.
- Mutation revalidation is centralized in app/mutation-revalidation.ts and uses named route groups.
- notFound() is used for locale validation; auth/membership failures use redirects rather than misclassifying infrastructure failure as not-found.

No cache-isolation regression, duplicate persistent fetch, or client boundary moved high enough to expose authenticated data was found. Product layout does fetch the Inbox count for the global shell badge on every product route; that is intentional shared chrome behavior, not currently proven waste.

Loading/error support exists at product and selected segment levels. Only the auth login page uses an explicit Suspense boundary; the product tree relies on route loading/error files and server composition. Missing route-local boundaries are a resilience consistency gap, but parent boundaries cover the current route groups and no failing route was observed in E2E.

### 5.6 State management and performance

Active state has clear local responsibilities for overlays, filters, wizard steps, previews, online status, and pending transitions. RHF owns state in the migrated forms. There is no Zustand, Redux, or Jotai usage.

@tanstack/react-query is installed and QueryProvider is mounted globally, but repository search found no useQuery, useMutation, or useQueryClient consumer. This is an OVER_ENGINEERED / unused provider layer: it adds a client provider and dependency without serving current product state. Remove only after confirming no planned near-term feature depends on it; do not replace it with another state library.

Performance review found no obvious sequential independent-await hotspot in the inspected route/application paths, no unbounded query added by the recent optimization work, and no evidence-based need for dynamic imports. Existing useMemo/useCallback usage is concentrated in actual derived collections, context values, and event handlers; no broad memoization purge is justified.

### 5.7 Complexity and module shape

Largest active files are still concentrated in route-colocated workflows:

| File | Lines | Mixed responsibility |
|---|---:|---|
| money/savings/new/create-saving-wizard.tsx | 1,050 | Multi-step state, schema/RHF, preview, action submission, lifecycle reset, and full rendering. |
| money/savings/savings-catalog-manager.tsx | 940 | Provider/product list management plus two CRUD forms and result presentation. |
| money/investments/investment-operation-form.tsx | 830 | RHF, operation-dependent fields, accounting preview, confirmation, mutation, and receipt state. |
| plan/page.tsx | 811 | Server data composition, recommendations, exception translation, and large page rendering. |
| plan/goals/[id]/goal-detail-controls.tsx | 743 | Goal lifecycle, contribution, edit state, confirmation UI, and result copy. |
| modules/ledger/application/commands/loans.ts | 688 | Multiple loan command contracts and provider/RPC error paths. |

Ledger, Savings, and Inbox were decomposed into application commands/queries and mappers, so the historical “one god module” problem is reduced but not eliminated. The remaining large files are mostly workflow-heavy UI and a few broad barrels (modules/ledger/application/index.ts, shared/patterns/index.ts). Split them only when a feature change identifies a stable responsibility boundary.

### 5.8 Dependency graph and duplication

A static import scan over 720 active TS/TSX files and 3,573 resolved local import edges found zero confirmed cycles. No feature-to-shared-kernel reverse dependency or platform-to-feature cycle was found. modules/tenancy/application/app-path.ts re-exports route constants from shared-kernel; it is a façade, not a duplicate definition.

Semantic duplication remains in only a few places:

- Core financial classification: centralized and cross-tested.
- Goal funding/status: centralized, with one presentation formula bypass.
- Jar mapping: base policy centralized; operation-specific conflict validation remains local by design.
- Savings day counts: centralized; Plan/Home still have local UTC day arithmetic.
- Revalidation: centralized in one app helper; broad route sets are named and intentional.

### 5.9 Tests and coverage gaps

The test suite is a strength: financial commands, reversal/classification semantics, Goal funding, Jar budget, Savings lifecycle, errors, RHF controlled fields, StatusAlert behavior, and mutation freshness are represented. The no-write-on-render regression has dedicated coverage.

Remaining high-risk gaps:

- Many manual-state forms have no behavioral tests comparable to create-saving-wizard, jar-configuration-form, or transfer-capture-flow; priority candidates are recurring detail, renewal policy, debt create/payment, transaction correction/refund, and account creation.
- Server Actions have uneven contract tests, especially Investments, Ritual, and the direct-Inbox Savings orchestration.
- 46 authenticated E2E tests are skipped without credentials/fixtures, including investments, Savings, Goals, Transfers, and several responsive/product flows.
- Query failure-to-empty-state behavior is not consistently tested; this is the main test gap behind silent catches.
- Existing test output has a PressResponder warning and intentionally noisy provider-error fixture logs. They do not fail the suite but reduce signal.

### 5.10 Dead code and repository hygiene

Proven hygiene findings:

- React Query is an active provider with no active consumer.
- Compatibility routes /money/add, /money/cards, and /money/cards/[id] remain in the generated route table.
- Deprecated action aliases remain in Savings/Money product actions.
- components/, packages/, many module domain/infrastructure directories, and parts of app/api/v1 remain scaffold/placeholder surfaces.
- archive/legacy-v1 and extensive historical/skill content cause the full Prettier check to inspect 2,206 already-unformatted files.

These are not all safe deletions. Compatibility routes and aliases may still protect old links; scaffold cleanup is low value while feature work is active. No dependency-unused tool is configured, so unused package claims beyond the React Query consumer search are not proven.

### 5.11 Security and data isolation

No P0 isolation issue was found in this architectural pass. Evidence supporting the current posture:

- Money reads and writes use assertMoneyActionAllowed and resolve an active household membership.
- Direct Savings Inbox reads/writes filter by the resolved householdId and use the server Supabase client.
- No persistent authenticated cache was found; request-level React cache() is used instead.
- Active feature TSX does not directly hold server Supabase clients.
- RLS/schema/RPC contracts were not changed or audited as requested.

The main residual risk is observability: expected unauthenticated getUser() errors are logged through logTenancyFailure as errors, and provider error objects may contain provider messages. The logs observed did not contain user financial payloads or cross-household identifiers beyond operation context, but expected-vs-unexpected auth classification should be tightened.

## 6. Priority Matrix

| ID | Priority | Finding | Impact | Effort | Confidence |
|---|---|---|---|---|---|
| ERR-001 | P1 | Application queries silently return null/empty objects from bare catches across roughly ten active query files. | HIGH | MEDIUM | HIGH |
| FORM-001 | P1 | Important Money/Plan mutation forms still own submitted fields and validation in local state instead of the established RHF/shared-field path. | HIGH | LARGE | HIGH |
| BOUND-001 | P1 | Savings Server Action directly owns Inbox/household persistence and cross-module workflow orchestration in a 528-line file. | HIGH | LARGE | HIGH |
| AUTH-001 | P2 | Expected signed-out auth failures are logged as errors during build, smoke, and full E2E, obscuring real tenancy failures. | MEDIUM | SMALL | HIGH |
| DOMAIN-001 | P2 | Goal detail confirmation copy bypasses canonical progress calculation. | MEDIUM | SMALL | HIGH |
| DATE-001 | P2 | Plan/Home/list-goal paths retain separate UTC day arithmetic beside the shared ISO-date helper. | MEDIUM | SMALL | MEDIUM |
| ERROR-002 | P2 | One local broad “jar” message sniff remains beside otherwise isolated compatibility classifiers. | MEDIUM | SMALL | HIGH |
| TYPE-001 | P2 | Translator any, provider-row casts, and as unknown as status checks weaken a few domain boundaries. | MEDIUM | SMALL | HIGH |
| NEXT-001 | P2 | Investments/Ritual action contracts remain outliers from the current status/result boundary convention. | LOW | MEDIUM | HIGH |
| STRUCT-001 | P2 | Large workflow files and broad shared/application barrels still mix responsibilities. | MEDIUM | LARGE | HIGH |
| STATE-001 | P2 | Globally mounted React Query provider/dependency has no active consumer. | LOW | SMALL | HIGH |
| UI-001 | P2 | Several product forms still use native primary selects contrary to the current UI constitution. | MEDIUM | MEDIUM | HIGH |
| HYGIENE-001 | P3 | Compatibility aliases, scaffold folders, archive noise, and broad Prettier scope remain. | LOW | MEDIUM | HIGH |
| PERF-001 | P3 | No measured bundle or render regression was found; further memoization/dynamic-import work would be speculative. | LOW | SMALL | HIGH |

Counts: P0 0, P1 3, P2 9, P3 2 actionable findings. PERF-001 is a deliberate “do not invent work” finding rather than a defect.

## 7. Current Scores

| Area | Score | Evidence-based reason |
|---|---:|---|
| Architecture | 8/10 | Clear route groups, bounded contexts, application APIs, centralized revalidation, and zero confirmed cycles; Savings orchestration and broad barrels remain. |
| Domain Modeling | 8/10 | Financial semantics, Goal funding, Savings calculations, and Jar budget are named/tested; a few raw status/date/formula edges remain. |
| React Structure | 7/10 | Client leaves and providers are mostly disciplined; several large workflow components still mix state, mutation, and rendering. |
| Next.js Structure | 8/10 | Server-first routes, request deduplication, fail-closed redirects, and scoped freshness are strong; action outliers and noisy auth logs remain. |
| State Management | 7/10 | Local state and RHF have real responsibilities, with no global store sprawl; many forms still duplicate field state and an unused QueryProvider is global. |
| Forms | 6/10 | Shared RHF/Zod/FormField infrastructure is real and tested, but only a minority of meaningful product forms use it. |
| Error Handling | 7/10 | Typed codes, classifiers, logging, and StatusAlert exist; silent query catches and expected-auth log severity reduce trust. |
| Data Access | 8/10 | Household gating, request-level caching, parallel reads, and application query boundaries are strong; Savings action bypasses the boundary. |
| Performance | 8/10 | No obvious waterfall, broad authenticated cache, or memoization abuse was found; unused React Query adds small overhead. |
| Testing | 8/10 | 693 passing tests and 40 E2E specs cover financial invariants and core shells; authenticated E2E and manual-form coverage remain incomplete. |
| Maintainability | 7/10 | The architecture is navigable and typed, but large workflows, manual forms, compatibility surfaces, and unformatted archive scope add friction. |

## 8. Before / After Comparison

The prior repository audit scored architecture readiness 7/10 and identified large route UI, catch-all shared patterns, compatibility routes, repeated gates, and app-to-module orchestration as the main risks. Current evidence shows meaningful progress:

| Old finding | Current status | Current evidence |
|---|---|---|
| Savings writes during render | RESOLVED | Explicit client effect/action boundary plus regression tests. |
| Core cross-screen money classification | RESOLVED | Shared classifier and Home/Monthly Review consistency tests. |
| Goal funding/progress split | MOSTLY RESOLVED | Central linked-source view model; one Goal detail presentation bypass remains. |
| Form architecture inconsistency | PARTIALLY_RESOLVED | Nine product RHF forms are on the canonical path; many action sheets remain manual-state. |
| Silent error swallowing | PARTIALLY_RESOLVED | Commands generally log/map failures, but roughly ten query files still silently return empty fallbacks. |
| Dependency cycles | RESOLVED | Static scan: 720 files, 3,573 edges, zero cycles. |
| Large route-colocated workflows | PARTIALLY_RESOLVED | Domain/application decomposition improved; Savings/Investment/Plan forms remain very large. |
| Compatibility/scaffold noise | STILL_PRESENT | Compatibility routes, deprecated wrappers, archive, and empty scaffolds remain active/reachable. |

## 9. Over-Engineering Findings

- OVER_ENGINEERED — React Query provider: one global provider and dependency with no consumer. Delete when no near-term consumer is committed; do not replace it with a new state layer.
- DEFER — generic controlled-field abstraction: shared/patterns/controlled-fields.tsx has multiple real consumers and solves RHF/UI adaptation. It is not a one-consumer abstraction; leave it alone.
- DEFER — dual Result/action status contracts: the distinction is currently intentional and readable. A repository-wide envelope unification would create migration churn without a demonstrated bug.
- DEFER — shared/patterns barrel: it is broad and contains product-specific cards, but ownership cleanup has low risk-adjusted value until a feature needs to move a pattern. Do not split by file count alone.
- SHRINK LATER — Goal funding compatibility parameter/casts: deriveGoalFundedAmount still accepts an unused snapshot parameter and status checks use avoidable casts. Small cleanup, not a roadmap blocker.
- DEFER — dynamic imports and memoization: no bundle or render measurement shows that more optimization is needed. Adding them speculatively would make the code harder to reason about.

## 10. Recommended Next Roadmap

Maximum five tasks, ordered by current risk:

### REF-001 — Make query fallback failures observable

Scope: Replace silent application-query catches with named logging and an explicit fallback policy; preserve intentional parse/compatibility fallbacks.
Why: A failed provider read currently becomes an empty product state.
Risk: P1 correctness/operational ambiguity; no schema or RPC change.
Expected files: modules/plan/application/queries/*, modules/savings/application/queries/list-savings.ts, modules/investments/application/queries/investment-queries.ts, modules/ledger/application/queries/list-money-products.ts.
Acceptance criteria: no unclassified provider query catch returns empty data; tests distinguish empty success from provider failure; expected parse fallbacks remain narrow.

### REF-002 — Migrate one high-risk manual form family

Scope: Choose either Plan recurring/Goal actions or Money account/debt actions; migrate only that family to shared schema/RHF/FormField patterns.
Why: Reduce duplicated validation/reset/result ownership without inventing a generic form hook.
Risk: P1 maintainability/regression risk; medium-to-large focused change.
Expected files: one route family plus its existing schema/tests.
Acceptance criteria: dependent fields reset explicitly, close/reopen starts from canonical defaults, one form-level error path exists, and behavioral tests cover invalid/submit/error/reset flows.

### REF-003 — Isolate Savings Inbox orchestration

Scope: Move only the direct Inbox/household persistence branch from savings-actions.ts into an application command/query boundary; keep the Server Action as validation/result/revalidation adapter.
Why: Reduce the clearest current app-to-platform bypass.
Risk: P1 boundary/maintenance risk; large enough to require existing Savings/Inbox tests.
Expected files: Savings application command/query, existing Savings action, focused tests.
Acceptance criteria: action has no direct .from("inbox_items")/.from("households"); household scoping remains explicit; typed errors and revalidation behavior are unchanged.

### REF-004 — Remove remaining semantic formula drift

Scope: Replace Goal detail’s raw progress formula and consolidate the small set of Plan/Home day-count calculations behind existing helpers.
Why: Finish the correctness refactor at the last observable edges.
Risk: P2 consistency; small.
Expected files: goal-detail-controls.tsx, modules/plan/application/plan-recommendations.ts, relevant Home/Plan query files, unit tests.
Acceptance criteria: all user-visible Goal progress uses the canonical function; date tests cover timezone-independent calendar boundaries; no new formatter/helper abstraction is added.

### REF-005 — Quiet expected auth failures and close only proven contract outliers

Scope: Classify missing auth as expected control flow in tenancy logging; then, only when those actions are touched, align Investments/Ritual action result contracts and the category error classifier.
Why: Improve operational signal without hiding unexpected auth/provider failures.
Risk: P2 observability/consistency; small-to-medium.
Expected files: get-session-user.ts, tenancy-error.ts, action outliers, related tests.
Acceptance criteria: signed-out build/E2E paths do not emit error-level provider stacks; unexpected auth errors still log; action contract changes are covered and do not alter user-facing codes.

## 11. Things That Should NOT Be Refactored

- Do not introduce Zustand, React Query consumers, or another global state library to solve local form state.
- Do not build a generic useServerAction/universal FormHelper solely for uniformity; the current action and form differences are partly legitimate.
- Do not rewrite the database schema, RLS, RPC contracts, or migration history as part of this roadmap.
- Do not split every file over an arbitrary line count; split only when a stable responsibility boundary is demonstrated.
- Do not remove compatibility routes or deprecated wrappers until repository-wide caller/link evidence proves they are unused.
- Do not replace request-level cache() with persistent caching for authenticated data.
- Do not add dynamic imports, memo, useMemo, or useCallback without a measured bottleneck.
- Do not refactor the shared controlled-field adapter, StatusAlert infrastructure, financial classifier, or Goal funding model; they are current strengths.

Conclusion: the repository should switch from broad refactor mode to feature development after the targeted P1 items are scheduled. No further large-scale architecture program is justified by the current evidence.
