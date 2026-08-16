# PLAN 12 Final Completion Report

## 1. Executive Summary

Plan 12 stabilization work was implemented on top of the existing Plan V2 working tree. The implementation now has one live Jar budget engine, one live Goal funding/progress model, one live Monthly Review route, and one authoritative recommendation ranking engine. Obsolete ritual UI paths were removed from the consumer route, legacy storage and adapters were retained only where required for historical compatibility, and the most serious local migration defects were repaired. The eight Plan 12 migrations plus two corrective migrations were applied to the configured healthy `family-finances-2` Supabase project through App Connect after explicit confirmation.

The repository remains **not ready to commit yet** because the full Playwright suite still contains one unrelated unauthenticated onboard failure, authenticated Plan flows remain skipped without seeded credentials, and local fresh-database/V1-upgrade simulations still require Docker. The application build, lint, typecheck, full unit suite, targeted formatting checks, focused Plan browser smoke tests, whitespace validation, remote schema checks, remote RLS metadata checks, remote RPC privilege checks, and remote invariant queries pass.

## 2. Final Plan V2 Architecture

| Concern | Authoritative implementation | Final status |
| --- | --- | --- |
| Jar rule, spend, remaining, usage, and state | `modules/plan/application/jar-budget.ts` | Single live calculation engine. |
| Period rollover and adjustments | `jar-rollover.ts`, `get-current-jar-budgets.ts`, `jar_period_adjustments` | Period-scoped and derived; negative rollover does not carry. |
| Jar historical rule state | `jar_period_rule_snapshots` | Append-only from the application; missing historical periods are not reconstructed from current configuration. |
| Goal funding/progress | `goal-funding.ts`, active `goal_funding_links` | Derived from Savings, account, Investment, Loan, and Debt sources. |
| Legacy Goal progress | `funded_amount`, `legacy_funded_amount`, `goal_contributions` | Compatibility-only for unlinked legacy Goals and labeled in the UI. |
| Goal actions | Goal action RPCs in `20260816210000_plan10_goal_actions.sql` | Atomic reassignment and lifecycle transitions; no Money transactions. |
| Monthly Review | `getMonthlyReview()`, `monthly-review.tsx`, `actions-review.ts` | Informational only; viewed/reviewed metadata never locks Plan or Money. |
| Legacy ritual history | `month_ritual_runs`, `month-ritual.ts`, `get-month-ritual.ts` | Deprecated compatibility surface; no active consumer route depends on it. |
| Assisted recommendations | `getPlanRecommendations()` in `plan-recommendations.ts` | Authoritative ranking engine; adapters delegate to it. |

The technical `/plan/ritual` path remains for route compatibility, but it renders Monthly Review. The former ritual wizard and preview/approve route actions were removed because they had no remaining consumers.

## 3. Legacy Runtime Cleanup

The active Jar list and Plan pulse no longer select `jars.capacity_delta`. The compatibility mapper retains the old row shape but always maps its live value to zero. The V2 rollover migration converts non-zero legacy values once into household-local `jar_period_adjustments` and documents the physical column as deprecated.

The active Together policy UI now exposes only **Assisted** and **Manual** behavior. Existing stored Auto and Quick Close values normalize to Assisted when read by the V2 application. The physical month-close field and legacy constants remain for reproducible historical migrations and old callers, but they no longer control active Review locking or automatic close behavior.

The active Jar detail screen no longer presents a lock warning. It presents Monthly Review as informational and explicitly states that Plan and Money remain editable. The deleted ritual wizard and deleted preview/approve route actions are not referenced by current routes.

The retained `month-ritual.ts`, `get-month-ritual.ts`, and autolock worker are deprecated compatibility paths. Their unexpected failures are logged with context, and the autolock worker is a no-op that returns zero changes. No V2 route invokes them.

## 4. Final Source-of-Truth Matrix

| Concept | Source of truth | Compatibility note |
| --- | --- | --- |
| Money amount | Ledger/Money transactions | Plan does not create Money transactions for planning actions. |
| Account balance | Money accounts and ledger | Never represented by Jar capacity. |
| Savings value | Savings domain | Used directly by linked Goal funding. |
| Investment value | Current holding valuation | Market value is primary; missing/stale valuation is surfaced. |
| Debt remaining | Loans/Debts domain | Principal reduction drives payoff progress; interest does not. |
| Jar rule | `jar_plans` and Jar configuration | Calculated only by the Jar budget engine. |
| Jar spend | Stored historical `transactions.jar_id` | Current category mapping does not rewrite past assignments. |
| Jar remaining | Derived budget minus stored Jar spend | Reallocation changes Plan metadata only. |
| Goal links | Active `goal_funding_links` | Partial unique indexes permit historical inactive-link reuse. |
| Linked Goal funded amount | Derived current source values | Manual contributions are rejected for linked Goals. |
| Legacy unlinked Goal progress | Legacy funded fields and contribution audit | Never converted into Savings, Investment, Money, or Goal links. |
| Review snapshot | Historical Review metadata and snapshot JSON | Not a live ledger or budgeting source. |
| Recommendations | `getPlanRecommendations()` | Assisted adapters do not maintain a second ranking algorithm. |

## 5. Final Migration Sequence

Apply the committed V1 migrations first, then apply the local Plan V2 migrations in this exact order:

| Order | Migration | Purpose |
| ---: | --- | --- |
| 1 | `20260816150000_plan_v2_jar_rollover_adjustments.sql` | Adds rollover mode, creates period adjustments, and converts legacy `capacity_delta` once using household-local time. |
| 2 | `20260816160000_plan_v2_goal_funding.sql` | Adds Goal type and legacy preservation fields, creates active funding links, uniqueness, RLS, and linked/manual contribution protection. |
| 3 | `20260816170000_plan_v2_review_snapshots.sql` | Adds informational Review status and Goal historical funded snapshots. |
| 4 | `20260816173000_plan_v2_monthly_review.sql` | Adds Review viewed/reviewed timestamps and compact Review snapshot metadata. |
| 5 | `20260816180000_plan_v2_qualifying_monthly_income.sql` | Adds household qualifying income configuration. |
| 6 | `20260816190000_plan_v2_jar_category_mapping.sql` | Adds current category-to-Jar mapping behavior and related protections. |
| 7 | `20260816200000_plan_v2_jar_budget_snapshots.sql` | Extends Jar snapshots with qualifying income, rule budget, rollover, immutability guard, and the reallocation RPC. |
| 8 | `20260816210000_plan10_goal_actions.sql` | Adds Goal lifecycle columns and repaired atomic reassignment/lifecycle RPCs. |
| 9 | `20260816161500_plan12_fix_goal_funding_rls_household_check.sql` | Corrects the deployed Goal funding insert policy to compare the Goal and link households explicitly. |
| 10 | `20260816162000_plan12_revoke_anon_plan_function_acl.sql` | Explicitly revokes anonymous execution from Plan 12 security-definer functions and grants intended authenticated execution. |

Prerequisites are a database backup, all committed V1 migrations applied successfully, and an authenticated Supabase role with the expected extensions and tenancy functions available. Do not run the V2 application before the V2 migrations and corrective migrations are applied.

## 6. Migration Validation

Static migration contract tests pass. They verify the exact local sequence, the repaired Goal RPC SQL, safe security-definer search paths, household-local `capacity_delta` conversion, Review migration ownership, and append-only Jar snapshot behavior.

The configured healthy `family-finances-2` project was then validated through App Connect. All eight Plan 12 migrations and both corrective migrations are recorded in the deployed migration list. Read-only checks confirmed the Plan 12 tables, columns, constraints, RLS policies, RPC definitions, security privileges, one-time legacy conversion counts, and corrected source predicates. Two nonzero legacy `capacity_delta` values produced two migrated adjustment rows with zero duplicate migration rows.

The deployed Goal funding insert policy was found to contain an unqualified household comparison and was corrected through the local migration and a remote corrective migration. The repaired Plan 10 migration removes malformed SQL, qualifies its security-definer objects, checks household ownership for both Goals and the funding link, preserves `initial_principal_snapshot` during reassignment, and deactivates links atomically on completion or cancellation.

Fresh-database execution and V1-upgrade simulation remain unrun because the local Supabase CLI cannot connect to Docker. The exact observed blocker is: `Cannot connect to the Docker daemon at unix:///Users/doantuan/.docker/run/docker.sock`.

## 7. Final Schema and Deprecated Fields

| Field or concept | Runtime use | Migration status | Future removal |
| --- | --- | --- | --- |
| `jars.capacity_delta` | Not read or written by V2 runtime | Preserved and converted once by the first V2 migration | Remove only after all V1 callers and historical repair tooling are retired. |
| `jars.rollover_mode` | Active Jar budget rule | Added by V2 migration | Retain as a core V2 field. |
| `jar_period_adjustments` | Active signed period adjustments | Added by V2 migration with RLS | Retain as the adjustment source of truth. |
| `jar_period_rule_snapshots` | Historical Jar rule/income/rollover state | Created and extended across the V2 sequence | Retain as append-only history. |
| `goals.funded_amount` | Legacy unlinked Goal progress only | Preserved by Goal funding migration | Remove only in a later explicit legacy-retirement migration. |
| `goals.legacy_funded_amount` | Explicit legacy preservation | Added by V2 migration | Retain until legacy Goal migration is complete. |
| `goal_contributions` | Legacy manual contribution audit | Preserved and guarded by the linked-Goal RPC | Retain for compatibility and audit. |
| `goal_funding_links` | Active linked Goal source ownership | Added by V2 migration with active partial uniqueness | Retain as core V2 schema. |
| `goal_period_funded_snapshots` | Historical Review Goal values | Added by Review snapshot migration | Retain as report history, not live SoT. |
| `month_ritual_runs.status` | Historical ritual status | Preserved from V1 | Never use as a V2 lock. |
| `month_ritual_runs.review_status` | Active informational Review status | Added by V2 migration | Retain as the Review state. |
| `month_ritual_runs.viewed_at`, `reviewed_at`, `review_snapshot` | Review metadata/history | Added by Monthly Review migration | Retain. |
| Month-close and Quick Close fields | Historical configuration compatibility | Preserved | Remove only after legacy callers and migrations are retired. |

## 8. Historical Integrity

Jar spend remains tied to the historical `transactions.jar_id` value. Changing a future category mapping does not rewrite prior Jar assignment. Jar rule snapshots are now append-only at runtime, and a missing historical snapshot is not silently reconstructed from today’s Jar configuration. Current-period snapshots are created once and then read back as the current-period rule state.

Rollover credit is computed from the previous period’s snapshot-derived budget and spend. Only positive unused budget carries. Negative overspending never carries. Period adjustments are separate signed Plan metadata and do not create Money transactions.

Linked Goal progress is recalculated from live source values. Savings withdrawals, investment market changes, and principal payments therefore change derived progress without manual Goal mutation. Legacy manual progress remains visible only for unlinked legacy Goals and is not converted into a financial source.

Monthly Review stores viewed/reviewed metadata and a compact snapshot for historical reporting. Marking a Review reviewed does not lock Plan or Money. Later Money corrections are expected to produce current values that may differ from the historical Review snapshot and are reported as updated-after-review behavior.

## 9. Security and Concurrency Audit

Plan reads and writes are household-gated through membership checks. Goal link triggers validate that the Goal and source share a household and that the source kind matches the Goal type. Active partial unique indexes enforce exclusive use of Savings, savings accounts, investment holdings, loans, and debts while allowing inactive historical links to be reused.

Jar reallocation remains an RPC boundary and returns a zero-ledger-impact contract. Goal source reassignment locks the source link and both Goals, deactivates the old link, and creates the new link in one transaction. Goal completion and cancellation lock the Goal and release active links atomically. The repaired security-definer RPCs set an empty search path and use schema-qualified application objects.

Remote database-side schema, RLS metadata, RPC security privileges, constraint definitions, and corrected SQL source were confirmed through App Connect. The main remaining database risks are the unrun local fresh/upgrade simulations and the broader pre-existing Supabase advisor warnings outside Plan 12.

## 10. Acceptance Scenarios A–L

| Scenario | Result | Evidence or limitation |
| --- | --- | --- |
| A. New household, fixed/percent Jar, income, mapping, expense, metrics | Pass at application/domain level | Jar budget tests cover rule, spend, remaining, used percentage, and qualifying income. Fresh DB/browser execution remains pending. |
| B. Overspend 10m to 12m, reallocate 2m, no Money transaction | Pass at application/domain level | Plan 05 Jar budget and zero-ledger-impact contracts pass. RPC execution remains pending. |
| C. Positive rollover, no negative rollover | Pass | Rollover unit tests and append-only snapshot logic pass. |
| D. Category remap affects future posts only | Pass at application/domain level | Historical Jar assignment contract is retained; DB fixture execution remains pending. |
| E. Savings Goal derives 250m/500m and changes after withdrawal | Pass at funding-engine level | Goal funding tests pass; live Savings RPC integration remains pending. |
| F. Investment Goal follows market value, not cost basis | Pass at funding-engine level | Investment funding tests pass; live valuation integration remains pending. |
| G. Debt Goal counts principal reduction, not interest | Pass at funding-engine level | Debt funding tests pass; live Loan/Debt RPC integration remains pending. |
| H. Ready is not auto-completed and can fall back to Active | Pass at view-model level | Derived status tests pass; live lifecycle RPC execution remains pending. |
| I. Whole-source Goal reassignment preserves Money and history | Pass by repaired RPC contract | Static SQL checks pass; DB transaction/RLS execution remains pending. |
| J. Monthly Review is informational and later changes show updated-after-review | Pass at application/UI contract level | Review unit tests and route/build pass; authenticated browser flow was skipped. |
| K. Assisted recommends while Manual reports facts only | Pass | Recommendation and Assisted adapter tests pass. |
| L. Legacy household upgrade preserves data and converts capacity once | Partially validated | App Connect confirmed two legacy values converted to two rows with no duplicates; fresh/upgrade simulation remains pending without Docker. |

## 11. Automated Validation

| Check | Result |
| --- | --- |
| `npm run test` | Pass: 84 test files, 503 tests. |
| `npm run lint` | Pass. |
| `npm run typecheck` | Pass. |
| `npm run build` | Pass; all Plan routes compiled. |
| Targeted `prettier --check` on Plan 12 files | Pass. |
| Repository-wide `npm run format:check` | Not clean because the pre-existing working tree reports 2,211 unrelated files; no broad formatting was applied. |
| `git diff --check` | Pass. |
| Full `npm run test:e2e` | 53 passed, 1 failed, 46 skipped. The failure was the unauthenticated onboard redirect test, where the expected login element was not visible and the run reported an `Unexpected end of JSON input`. |
| Focused Plan E2E | 5 passed, 6 skipped. Authenticated tests were skipped because local E2E credentials were unavailable. |
| Supabase App Connect schema/RLS/RPC/invariant validation | Pass: migrations applied; deployed schema, RLS metadata, RPC privileges, corrected SQL, and one-time conversion invariants verified. |
| Supabase local fresh/upgrade migration execution | Not run; Docker daemon unavailable. |

## 12. Files and Areas Cleaned Up

The cleaned areas include the malformed Plan 10 Goal action migration, duplicate Jar snapshot DDL in the Review migration, active `capacity_delta` selections, mutable current-period Jar snapshot updates, the legacy lock warning on Jar detail, Auto policy UI options, the obsolete ritual wizard, and obsolete ritual route actions. New audit artifacts are `artifacts/plan-12-architecture-map.md`, `artifacts/plan-12-runtime-audit.md`, `artifacts/plan-12-app-connect-validation.md`, and this report. New regression coverage is in `tests/unit/plan12-migration-hardening.test.ts`.

No commit, push, or application deployment was performed. The eight Plan 12 migrations and two corrective migrations were applied to the configured `family-finances-2` Supabase project through App Connect after explicit user confirmation.

## 13. Remaining Risks

The first remaining risk is local migration simulation. App Connect validated the deployed database state, but a disposable local Supabase instance is still needed to exercise both fresh V1-plus-V2 setup and representative V1 upgrade data before commit.

The second risk is authenticated browser coverage. Plan flows requiring credentials, seeded Savings/Investment/Debt data, and legacy households remain skipped. The unauthenticated onboard E2E failure should also be rerun after clearing the local test server/cache because it reported malformed JSON while resolving the login screen.

The third risk is broader database hardening. Supabase advisors still report pre-existing anonymous-callable V1 security-definer functions, one mutable search path, and informational unindexed foreign keys, including several new Plan 12 foreign keys. These findings are outside the focused Plan 12 correctness work but should be tracked before production hardening.

The fourth risk is intentional legacy schema retention. Physical V1 fields and `month_ritual_runs` remain for data preservation. They must not be dropped until a later release supplies explicit data-retirement and rollback procedures.

## 14. Recommended Deployment Order

1. Back up the production database and verify the backup.
2. Apply all committed V1 migrations in repository order.
3. Apply the eight Plan V2 migrations and the two corrective migrations in the exact order listed in Section 5.
4. Verify columns, constraints, active unique indexes, RLS policies, RPC grants, and the one-time `capacity_delta` conversion on a staging-like database.
5. Confirm that no duplicate migrated adjustment exists for a Jar and household-local current period.
6. Deploy the application after the schema is available.
7. Smoke `/plan`, `/plan/jars`, `/plan/goals`, `/plan/recurring`, `/plan/calendar`, and `/plan/ritual` in both English and Vietnamese.
8. Inspect application and database logs for RPC, RLS, migration, and Review metadata errors.

## 15. Rollback Considerations

Before users create V2 data, a schema rollback can remove newly added columns and tables only through a separately reviewed destructive rollback plan. After V2 links, period adjustments, snapshots, or Review metadata exist, do not roll back by dropping them. Roll back the application to a compatible version while preserving the additive schema, or restore from a verified backup if a data-level rollback is required.

The `capacity_delta` conversion is intentionally additive and preserves the legacy column. Goal legacy fields are also preserved. Reversing a converted adjustment is safe only if the migration audit proves it is the exact one-time row and no subsequent Plan movement depends on it.

## 16. Ready-to-Commit Assessment

> **NOT READY TO COMMIT**

The application implementation is materially hardened, the automated code checks pass, and the deployed Plan 12 schema has been validated through App Connect. The repository is still not ready to commit because local fresh/upgrade migration simulations remain unavailable, the full browser suite contains one remaining unauthenticated failure, and authenticated Plan coverage is skipped. Resume with local Docker/Supabase available, run fresh and upgrade-like migration tests, seed the representative legacy household, rerun the focused authenticated Plan flows, then reassess readiness.

## References

[1]: ../supabase/migrations/20260816150000_plan_v2_jar_rollover_adjustments.sql "Plan V2 Jar rollover and period adjustments migration"
[2]: ../supabase/migrations/20260816160000_plan_v2_goal_funding.sql "Plan V2 Goal funding migration"
[3]: ../supabase/migrations/20260816170000_plan_v2_review_snapshots.sql "Plan V2 Review snapshots migration"
[4]: ../supabase/migrations/20260816173000_plan_v2_monthly_review.sql "Plan V2 Monthly Review migration"
[5]: ../supabase/migrations/20260816200000_plan_v2_jar_budget_snapshots.sql "Plan V2 Jar snapshot and reallocation migration"
[6]: ../supabase/migrations/20260816210000_plan10_goal_actions.sql "Plan 10 Goal actions migration"
[7]: ../supabase/migrations/20260816161500_plan12_fix_goal_funding_rls_household_check.sql "Plan 12 Goal funding RLS correction"
[8]: ../supabase/migrations/20260816162000_plan12_revoke_anon_plan_function_acl.sql "Plan 12 anonymous function ACL correction"
[9]: ../modules/plan/application/jar-budget.ts "Authoritative Jar budget engine"
[10]: ../modules/plan/application/goal-funding.ts "Derived Goal funding engine"
[11]: ../modules/plan/application/plan-recommendations.ts "Authoritative Plan recommendation engine"
[12]: ../tests/unit/plan12-migration-hardening.test.ts "Plan 12 migration hardening regression tests"
[13]: ./plan-12-app-connect-validation.md "App Connect Supabase validation report"
