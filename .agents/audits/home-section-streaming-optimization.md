# Home Section Streaming Optimization

## 1. Executive Summary

Implemented the Home streaming architecture and the savings-only read optimization.

- `home/page.tsx` is now a thin composition layer. The product layout remains the authenticated session boundary.
- Home readiness is separated from period data and product summaries.
- Top bar, overview, inbox, plan, period story, and the existing single product-summary card render behind sibling Suspense boundaries.
- Savings and saving-cycle reads are replaced by one `get_home_savings_summary()` RPC. The public application return type and React request-local cache remain unchanged.
- Account-ledger and investment projection SQL changes were intentionally deferred.

The code-level and focused test evidence passes. An authenticated dev-server browser check confirmed the Home structure and section markers. Because the linked database still lacks the new RPC, the application now has a narrowly scoped compatibility fallback to the previous two-read calculation; the RPC remains the primary path after deployment. Production-like streaming, EXPLAIN ANALYZE, and runtime RLS checks remain open because the repository has an existing TypeScript error, the new RPC is not deployed to the linked database, and the local database is unavailable.

## 2. Scope and Baseline

| Field                          | Value                                                                   |
| ------------------------------ | ----------------------------------------------------------------------- |
| Scope                          | Authenticated Home Server Component streaming plus savings Home RPC     |
| Route                          | `/vi/home`                                                              |
| Baseline                       | Existing P8 production-like profile captured before this implementation |
| Baseline loads                 | Three warm authenticated Home loads at 390 × 844                        |
| Baseline TTFB                  | 309 / 437 / 481 ms; median 437 ms                                       |
| Baseline load                  | 1,247 / 1,576 / 1,830 ms; median 1,576 ms                               |
| Baseline document size         | 78,590 encoded bytes; 369,698 decoded bytes                             |
| Baseline Supabase/Auth fetches | 20 per Home request                                                     |
| Baseline savings wave          | `savings` followed by `saving_cycles` when savings exist                |
| Baseline evidence              | `.agents/audits/home-rsc-performance-investigation.md`, P8              |

The P8 baseline used `npm run build`, `npm run start`, `VINHA_PERF_TRACE=1`, and three warm authenticated loads. The implementation began after that baseline. A second equivalent production profile was attempted but could not start because the current build fails on the pre-existing Welcome translation typing error.

## 3. Architecture Before and After

Before, the Home page awaited params, auth/membership helpers, translations, the complete dashboard, all product summaries, and preferences before returning the page.

After:

```text
ProductLayout
└── requireProductSession()          authenticated security boundary
    └── HomePage
        ├── getHomeReadiness()       shared promise
        ├── Suspense: HomeTopBar
        └── Suspense: HomeContent
            ├── readiness / day-zero / fatal lane
            └── HomePeriodTransition
                ├── Suspense: financial pulse
                ├── Suspense: inbox
                ├── Suspense: plan
                ├── Suspense: period story
                └── Suspense: one product-summary card
                    ├── Suspense: savings row
                    ├── Suspense: investment row
                    ├── Suspense: loan row
                    └── Suspense: debt row
```

The product-summary card remains one visual card. Only its rows stream independently; no product-card redesign was introduced.

## 4. Authentication and Membership Security

The page no longer duplicates login/onboard redirects. `ProductLayout` still calls `requireProductSession()` before Home children render, preserving the existing fail-closed route boundary.

The Home read models call the existing cached `assertMoneyActionAllowed()` gate. React `cache()` remains request-local, so parallel readiness, period, inbox, and product reads reuse the same authenticated user/membership resolution where the existing helpers support it.

No client REST migration, cross-request cache, service-role read, or security-boundary relocation was added.

## 5. Read-Model Split

`modules/home/application/get-home-dashboard.ts` now exposes:

- `getHomeReadiness()`: access allowance, real position, plan pulse, currency, balance, account count, active Jar count, allocation mode, day-zero decision, and existing position/plan/access error sources.
- `getHomePeriodData(period)`: access allowance, selected date range, transaction metrics, and existing partial/error behavior.
- `getHomeDashboard(period)`: compatibility aggregator retained for existing callers and tests. Its existing Inbox fatal-error semantics remain intact.

The page launches independent promises for Inbox attention, savings, investments, loans, debt, and preferences. Shared promise objects are passed to async section components instead of re-reading the domain helpers.

## 6. Suspense and Loading Behavior

Section-specific skeletons contain no fake financial values. The existing visual order remains:

1. financial pulse / overview;
2. Inbox attention;
3. Plan pulse;
4. selected-period story;
5. product summary.

The overview intentionally waits for its savings and investment inputs because its total asset value depends on them. Inbox, plan, period story, and the individual product rows have independent boundaries and can resolve separately from the slower product reads.

Unexpected exceptions continue through the existing product error handling path. No generic error framework or client-side loading state was introduced.

## 7. Request-Local Promise Reuse

The page creates one readiness promise and passes it to both the top bar and content. Home content creates one promise each for Inbox, period, savings, investments, loans, and debt. The same promises are passed to every consumer that needs them.

Existing cached helpers continue to protect duplicate request-local reads:

- `assertMoneyActionAllowed()`;
- session and active-membership helpers;
- `getOpenInboxAttention()`;
- product-domain query helpers;
- `getSavingsHomeSummary()`.

No global or cross-request cache was added for household financial data.

## 8. Financial and UI Semantics

The compatibility dashboard preserves the previous result shape and status behavior. The page preserves:

- day-zero detection from zero accounts and zero active Jars;
- currency and real-position values;
- period selection and focus restoration;
- partial transaction-state rendering;
- investment valuation-quality labels and estimate styling;
- savings, loan, and debt amounts and attention labels;
- the existing single product-summary card;
- existing Home test IDs, with only row markers added for timing;
- shared formatters, design tokens, AppIcon, and existing motion primitives.

The streaming product renderer shares the row renderers with the existing synchronous `HomeProductSummaries` compatibility component, avoiding two financial display implementations.

## 9. Savings RPC Design

Migration: `supabase/migrations/20260910210229_home_savings_summary.sql`.

The RPC returns one row with:

- `active_count`;
- active-cycle `principal`;
- `upcoming_maturity_count`;
- matured current-cycle `action_required_count`;
- nearest active-cycle `nearest_maturity_date`.

The `current_cycles` CTE preserves the old JavaScript selection rule using `distinct on (sc.saving_id)`:

- exclude savings with `closed` and `early_closed` status;
- consider only `active` and `matured` cycles;
- prefer active over matured;
- then prefer the highest cycle number;
- sum principal and count dates only for the selected active cycles;
- return zero counts, zero principal, and a null nearest date for an empty result.

`modules/savings/application/savings-constants.ts` owns the RPC name. `getSavingsHomeSummary()` keeps its public return type and request-local cache and maps Postgres numeric values safely into that type.

Until the migration is deployed, a `PGRST202` function-not-found response uses the exact previous `savings` plus `saving_cycles` calculation. Other RPC errors still fail closed to the existing unavailable state; the fallback does not mask authorization or data errors. This keeps existing authenticated data visible during the migration window without changing the deployed-RPC query shape.

## 10. RPC Security and Tenancy Shape

The migration declares:

- `security invoker`;
- `set search_path to 'public'`;
- `revoke all on function ... from public`;
- `grant execute ... to authenticated`.

The query retains the existing membership predicate and relies on `SECURITY INVOKER` table RLS for `savings` and `saving_cycles`. Existing policies select rows only when `active_membership_id(household_id)` resolves for the authenticated caller.

Source-level tests cover these declarations. Runtime authenticated, anonymous, non-member, and cross-household checks were not run because the migration was not pushed to the hosted project and the local database container is unavailable.

## 11. Query and Fetch Impact

The expected savings reduction is:

```text
before: savings GET → saving_cycles GET
after:  get_home_savings_summary() RPC
```

The expected full Home fetch count is 19 instead of the P8 baseline’s 20 when the household has savings and the RPC is deployed. During the compatibility window, the missing-function fallback intentionally remains a two-read savings wave so data stays visible.

Account-ledger and investment projections remain unchanged. Their ID-dependent waves are deliberately outside this phase.

## 12. Profiler and Timing Instrumentation

`output/vinha-rsc-profile-p8.mjs` was extended only as needed to:

- navigate with `waitUntil: "commit"`;
- wait for stable Home marker IDs rather than the load event;
- record first visible timestamps for shell, financial pulse, Inbox, plan, period story, each product row, and capture action;
- count the new savings RPC in the savings wave;
- retain TTFB, document timing, request count, RSC paths, payload sizes, and server trace parsing.

The profiler remains read-only with respect to application financial data. Login may update the auth provider’s sign-in timestamp, as in the existing profiler contract.

## 13. Post-Change Measurement Results

### Authenticated dev-server check

Using the supplied E2E account against the existing Next dev server at 390 × 844, three warm full-document `/vi/home` loads completed with these client-observed values:

| Load |     Wall |     TTFB | Load event |  Encoded |   Decoded |
| ---- | -------: | -------: | ---------: | -------: | --------: |
| 1    | 3,939 ms | 1,417 ms |   3,158 ms | 89,037 B | 452,843 B |
| 2    | 2,593 ms |   692 ms |   2,210 ms | 89,023 B | 452,713 B |
| 3    | 1,927 ms |   867 ms |   1,754 ms | 92,809 B | 452,799 B |

The shell marker appeared before the remaining sections in all three observations. All section markers and exactly one product-summary card were present after completion. The first load showed the shell at approximately 1,811 ms and later product markers at approximately 3,462 ms; the warm loads showed the shell at approximately 775–1,041 ms and later markers at approximately 1,910–2,586 ms.

This is dev-server evidence, not the required production-like measurement. Full-document navigations embed the RSC stream in the document response, so the browser recorded zero separate RSC subrequests; that is not a valid standalone RSC payload-size measurement. Browser request counts were 64 on the first load and 49 on each warm load, but these are client asset/document requests and do not count server-side Supabase fetches. The dev overlay also intercepted a follow-up client-navigation probe, so no client-transition RSC request result is claimed.

Before the compatibility fallback was added, the savings row was present but unavailable because the linked database did not yet expose the new RPC. A read-only authenticated comparison of the existing two-read shape returned:

- active savings: `30`;
- active principal: `184,253,507`;
- upcoming maturity count: `30`;
- action-required count: `0`;
- nearest maturity date: `2026-09-12`.

The new RPC returned PostgREST `PGRST202` (function unavailable or not deployed). No remote schema was changed.

The fallback is covered by the focused Home orchestration test and preserves the comparison values above when the RPC returns `PGRST202`. A subsequent login retry encountered the existing dev login-flow timeout, so no new full browser screenshot is claimed after the fallback; the visible regression is covered by the read-model test and the prior authenticated data probe.

The attempted production-like run was blocked at `next build` / `next start` by:

```text
welcome-screen.tsx(116): "previewNetLabel" is not a valid typed auth.welcome key
```

A supplementary production-like run therefore remains unavailable. The following fields remain unmeasured after the change:

- TTFB;
- production shell first visible timestamp;
- production first visible timestamp for each section;
- full completion;
- request count;
- auth count;
- RSC payload size;
- server trace;
- production ordering proof that fast sections beat Savings/Investment.

The implementation topology and the dev observation support the intended ordering, but a real authenticated production build measurement is still required before calling the phase fully verified.

## 14. Database and EXPLAIN ANALYZE Evidence

`supabase db lint --linked --schema public` reached the hosted schema and reported four existing unrelated function errors. It did not include the new RPC because the migration was intentionally not pushed.

`supabase migration list` also showed local/remote history drift: remote version `20260908115411` is absent locally, while local version `20260908114845` is absent remotely. The new `20260910210229_home_savings_summary.sql` is local only. A linked `supabase db push --dry-run` refused to proceed until that history is reconciled. No migration repair, push, or other remote schema mutation was performed.

Local `supabase db lint` could not connect because the local Postgres container is not running. No `EXPLAIN ANALYZE` was run against the current savings query or the new RPC, and no remote schema was changed.

The prior audit’s representative PostgreSQL evidence remains the only database performance baseline: approximately 0.06–1.6 ms for current-size hot reads and approximately 4–9 ms on the 10,000-transaction fixture. Those values are not a substitute for an EXPLAIN of this new function.

## 15. Account and Investment Waves Deferred

Deferred, as requested:

- account position → account ledger balances / owner-membership IDs;
- investment holdings → instruments / prices / FX / summary-input RPC.

The existing P8 evidence shows both are ID-dependent waves. They need separate read-model benchmarks with exact ownership and valuation-equivalence checks before SQL changes. This phase does not add a mega-RPC, cross-domain SQL, browser REST calls, or speculative cache.

## 16. Validation Results

| Check                                                            | Result                                                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Focused Home orchestration, query shape, component, and IA tests | Passed: 24 tests                                                                    |
| Savings RPC-missing compatibility check                          | Passed: 13 tests across Home orchestration and query-shape files                    |
| Affected source-contract group                                   | Passed: 18 tests                                                                    |
| Full unit suite                                                  | 1,443 passed / 3 pre-existing failures across 230 files                             |
| Migration freeze validation                                      | Passed: baseline plus 19 forward migrations                                         |
| `npm run typecheck`                                              | Blocked by pre-existing `welcome-screen.tsx` translation key error                  |
| `npm run build`                                                  | Compiled, then blocked by the same pre-existing TypeScript error                    |
| `npm run lint`                                                   | Blocked by 10 pre-existing profiler `no-console` errors and one warning             |
| `npm run test:e2e:smoke`                                         | Blocked by an existing Next dev server on port 3000 while config expected port 3100 |
| Runtime Home browser evidence at 390/440/768/1280                | Not verified; authenticated browser setup did not complete                          |
| Local SQL lint / EXPLAIN                                         | Not run; local Postgres unavailable                                                 |
| Runtime RLS matrix                                               | Not run; migration not pushed and no local database                                 |

The three full-suite failures are unrelated source-contract expectations for BottomActionBar, the Welcome preview, and transaction loan-breakdown placement. They were not changed by this task. The authenticated browser check was completed only at 390 × 844; the 440/768/1280 smoke matrix remains open.

## 17. Risks and Open Verification Items

The implementation has three material verification gaps:

1. The new SQL function has not been applied to a database in this worktree, so its PostgreSQL parse/plan and live RLS behavior remain unverified.
2. The linked database has migration-history drift, and the new RPC is unavailable there; the compatibility fallback keeps authenticated savings data visible, but live post-migration RPC equivalence remains unverified.
3. The streaming response has not been observed in an authenticated production build, so production section timing and the 440/768/1280 visual matrix remain unverified.

The compatibility aggregator, focused orchestration tests, source security assertions, and savings numeric-row mapper reduce risk but do not replace those checks.

## 18. Disposition and Next Step

Implementation status: **code complete, verification incomplete**.

To close the phase:

1. Reconcile the local/remote migration history with an explicit approved database operation, then apply the new RPC; do not repair history implicitly.
2. Fix the pre-existing `auth.welcome.previewNetLabel` message/type mismatch and run `npm run build` plus `npm run start`.
3. Run EXPLAIN ANALYZE for the old two-read shape and new RPC, and execute authenticated/anonymous/non-member/cross-household RLS checks.
4. Run three warm authenticated Home loads with the updated profiler at 390px, then smoke-check 440px, 768px, and 1280px in light/dark themes as required by the UI constitution.
5. Confirm the deployed RPC returns the same fallback values, then record the resulting section timestamps, request reduction, RSC payload, and server trace in this report.

No account-ledger or investment SQL change should be added until its own benchmark proves a full hosted round-trip reduction without changing financial or tenancy semantics.
