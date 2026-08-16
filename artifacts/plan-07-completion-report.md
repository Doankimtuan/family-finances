# PLAN 07 Completion Report

## 1. Summary

The legacy multi-step Month Ritual is no longer the active consumer experience. `/plan/ritual` now renders a read-oriented, optional **Monthly Review** report with current and historical month navigation, cash-flow facts, Jar performance, compatibility-safe Goal status, material changes, factual issues, limited Assisted actions, and an informational reviewed state.

Skipping or marking the report has no operational consequence. The new actions only write review metadata; they do not lock Plan or Money, approve transactions, create a new month, reset Jars, force rollover, move money, reallocate budgets, or change Goal funding.

## 2. Existing Ritual Components Reused / Replaced

The route, legacy `month_ritual_runs` table, existing household membership gate, household-local period helpers, historical Jar budget query, and existing translation namespaces were reused. `ritual-wizard.tsx` and the older preview/approve/correct actions remain as compatibility code, but the route no longer imports or renders the wizard. The new report is implemented in `app/[locale]/(product)/plan/ritual/monthly-review.tsx`.

## 3. Final Monthly Review Information Hierarchy

The report follows this order: month header and selector, cash-flow summary, Jar performance, Goal progress, important changes, things to review, Suggested actions for Assisted households, and review state. The current month is explicitly labeled as in progress and historical months are not locked.

## 4. Cash-Flow Semantics

| Financial event | Review classification |
| --- | --- |
| Posted ordinary income | Income |
| Posted ordinary expense | Expenses |
| Savings principal placement | Added to Savings; excluded from Expenses |
| Savings principal return | Savings withdrawn; excluded from Expenses |
| Investment purchase | Investment buy; included in Net invested, not Expenses |
| Investment sale proceeds | Investment sale; reduces Net invested, not Income |
| Liability or debt cash payment | Debt cash paid; separated from Expenses |
| Debt principal movement supported by the existing transaction type | Debt reduced |
| Internal transfer legs | Neutral; savings transfer pairs are deduplicated by transfer group |

The summary uses Money transaction facts for the reviewed calendar period. It does not use `qualifying_monthly_income` as actual Income and does not calculate cash flow from Jar data.

## 5. Jar Performance

Jar performance reuses `getJarBudgetsForPeriod`, including the existing Plan 03–05 historical budget, rollover, adjustment, and qualifying-income snapshot behavior. The UI displays budget, spent, remaining or over-budget, usage percentage, and a compact attention count. The UI does not recalculate Jar formulas.

## 6. Goals Compatibility

The report uses the current Goal read model. Goals with linked funding are labeled as linked funding; legacy/manual progress is explicitly labeled as legacy and not verified Money funding; Goals without backing are surfaced as a factual configuration issue. Goal monthly movement is left unset rather than inferred from arbitrary current-versus-old values.

## 7. Important Changes

The default comparison is the previous household-local calendar month. A change is shown only when the absolute movement is at least 100,000 in the household currency or 10% of the previous value. Comparisons are hidden when there is no previous activity or meaningful baseline.

## 8. Issues / Suggested Actions

The report surfaces uncategorized expense transactions, overspent Jars, percentage Jars without an income base, and Goals without linked backing. Assisted mode shows at most three deterministic actions. Manual mode hides recommendation-style actions while keeping factual issues visible.

## 9. Review State

Opening an unstarted report records `viewed_at` and changes the informational state to viewed. Marking the report records `reviewed_at`, `review_status = marked_reviewed`, and a compact report snapshot. Later transaction activity after the snapshot displays **Updated after review**. These states never affect Plan or Money availability.

## 10. Historical Snapshot Strategy

The stored snapshot contains the captured time and compact cash-flow, Jar, and Goal KPI data. It does not duplicate transaction lists and is not a source of truth for Money. Before marking reviewed, the page is a live historical calculation. After marking reviewed, the stored record is retained for understanding what was reviewed, while the report continues to expose that later Money activity may differ.

## 11. Database / Migration Changes

Added:

- `supabase/migrations/20260816173000_plan_v2_monthly_review.sql`
- `viewed_at`, `reviewed_at`, and `review_snapshot` columns on `public.month_ritual_runs`
- An index covering household, period, and `review_status`

Nothing was remotely applied. The migration is present locally only and should be applied through the repository's normal Supabase migration workflow.

## 12. Query / Performance Strategy

The route uses one application-level `getMonthlyReview(periodMonth)` read model. It loads the bounded period transaction dataset once, composes the existing Jar budget query, Goals query, Jars query, and review metadata, and derives changes from one bounded previous-month read. React components do not query Money, Plan, Goal, or transaction tables independently.

## 13. EN/VI UX Changes

English and Vietnamese copy were added for Monthly Review, current-month progress, historical navigation, cash-flow labels, Jar metrics, Goal backing states, factual issues, Suggested actions, review state, and post-review updates. The Plan Home entry remains product-facing as **Monthly Review / Tổng kết tháng**.

## 14. Tests / Validation

The following checks passed:

- `npm run lint`
- `npm run typecheck`
- Focused Plan and Monthly Review tests: 32 tests passed
- Full unit suite: 82 test files and 482 tests passed
- `npm run build`
- `git diff --check`

An authenticated browser smoke test was not run because no authenticated browser session was available in this task. The production build completed successfully for the dynamic `/[locale]/plan/ritual` route.

## 15. Deferred to PLAN 08+

Goal V2 funding architecture, Goal Fund/Withdraw/Reallocate, investment-backed Goal engine, debt Goal engine, full Assisted V2 recommendation engine, new Jar formulas, new rollover rules, major Recurring/Calendar redesign, and final legacy Plan migration cleanup remain deferred.

## 16. Remaining Risks

The repository still contains legacy ritual names and compatibility actions internally. They are not active in the consumer route. The debt headline currently uses the existing transaction-level debt semantics available to the Plan layer; deeper loan principal-versus-interest reconciliation should be expanded only when the Money debt projection contract is intentionally extended. Historical Jar participation follows the existing `getJarBudgetsForPeriod` read model and should be revisited if the later Plan cleanup changes how paused or archived Jar snapshots are queried.
