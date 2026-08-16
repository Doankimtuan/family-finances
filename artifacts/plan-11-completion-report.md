# PLAN 11 Completion Report

## 1. Summary

PLAN 11 Assisted V2 is implemented as a deterministic, derived recommendation layer. Assisted mode now explains current financial states, why they matter, and a safe next step. Manual mode continues to expose factual financial states while returning no recommendation objects and rendering no recommendation copy.

The implementation stops at PLAN 11. It does not create automatic money movement, transaction writes, Jar mutations, Goal-link mutations, investment buy/sell behavior, forecasting, AI-generated advice, notifications, or database persistence for recommendations.

## 2. Existing Assisted Logic Reused / Changed

The existing `assisted-suggestions.ts` implementation was reduced to a compatibility adapter. Recommendation detection and priority now live in `modules/plan/application/plan-recommendations.ts`. Existing Plan Home health and exception logic remains factual and continues to power the health summary and Manual-mode visibility.

Monthly Review no longer derives its suggested actions from a local issue slice. It composes the same engine from the selected period's already-loaded Jar, Goal, budget, and transaction read models. Historical periods set historical action semantics, so an old month does not produce a current-period budget reallocation action.

## 3. Recommendation Architecture

The authoritative entry point is `getPlanRecommendations(input)`. It returns a typed `PlanRecommendation[]` containing a stable ID, recommendation type, priority, localization keys, reason code, structured reason data, optional numeric amount, entity identity, and a non-mutating action descriptor.

The UI localizes `titleKey` and `descriptionKey`, formats Money amounts with the shared currency formatter, resolves existing application routes, and renders the CTA as an explicit user navigation step. Recommendations are not stored in the database.

## 4. Recommendation Priority

The exact deterministic ordering is:

1. `jar_overspent`
2. `uncategorized_transactions`
3. `missing_qualifying_income`
4. `plan_over_allocated`
5. `goal_source_unavailable`
6. `goal_missing_backing`
7. `goal_valuation_missing`
8. `goal_ready_regression`
9. `goal_target_date_risk`
10. `jar_near_limit`
11. `goal_valuation_stale`
12. `recurring_amount_mismatch`

Recommendations are sorted by priority, then category rank, then stable ID, and are limited to three for Plan Home and Monthly Review.

## 5. Jar Recommendations

Overspent Jars use the existing Jar budget state and near-limit threshold. A donor is eligible only when it is active, different from the destination Jar, in the same loaded household read model, and has positive remaining capacity. The donor is selected by largest remaining amount, with Jar ID as a deterministic tie-breaker. The suggested amount is `min(overspentAmount, donorRemainingAmount)`.

If no donor exists, the engine recommends reviewing the Jar budget instead of fabricating a reallocation. Historical overspending uses a review-Jar-rule action rather than a current-period reallocation action. Overspent Jars suppress their near-limit recommendation.

## 6. Goal Recommendations

The engine supports missing backing, unavailable or missing linked sources, missing or incomplete investment valuation, stale valuation, Ready-to-Active regression when prior Ready state is supplied, and target-date risk using a 30-day window with progress below 80 percent. It does not recommend buying, selling, contributing, or changing the Goal lifecycle.

A missing valuation suppresses stale valuation for the same Goal. An unavailable source suppresses valuation-quality follow-up for the same Goal because the source itself must be reviewed first.

## 7. Recurring Recommendations

The engine includes a material recurring mismatch detector for callers that have a trustworthy expected-to-actual mapping. It ignores trivial differences below the existing materiality floor and below a 10 percent relative difference. PLAN 11 does not invent fuzzy transaction matching, and the current application read models do not yet provide a reliable mapping to wire into Plan Home or Monthly Review. Therefore recurring mismatch is implemented as a safe engine capability but deferred at the data-integration boundary.

## 8. Assisted vs Manual Behavior

In Assisted mode, `getPlanRecommendations` returns derived recommendations and the Plan Home and Monthly Review consumers render them. In Manual mode, the engine returns `[]`; factual health, Jar budgets, transaction issues, Goal progress, and review facts remain visible.

The implementation uses no AI language and makes no financial strategy recommendations. Copy is operational and review-oriented, such as reviewing a budget, linking a funding source, or updating a recorded valuation.

## 9. Plan Home Integration

Plan Home continues to use the existing factual Needs Attention cards. A compact Suggestions section now renders the shared recommendation list, capped at three items, with EN/VI localized copy and existing-route CTAs. The loaded Plan Home data is reused for the recommendation composition rather than re-querying per recommendation.

## 10. Monthly Review Integration

Monthly Review composes recommendations from the selected period. Assisted mode renders the shared recommendation list; Manual mode renders the factual Things to review section only. For historical months, budget issues use reflective actions such as reviewing a Jar rule rather than current-month reallocation.

## 11. Safety / Side Effects

The recommendation engine is a pure application-level derivation. It does not call Supabase mutations, create transactions, move Money, change Jar allocations, alter qualifying income, link or unlink Goal sources, update investment values, modify recurring rules, mark Review completed, close months, or change Goal lifecycle. Every CTA navigates to an existing explicit user flow, where any mutation still requires the existing form and confirmation path.

## 12. Performance Strategy

Plan Home and Monthly Review compose recommendations from already-loaded read-model data. The engine performs in-memory iteration and deterministic sorting. It does not query transactions, Jars, Goals, or recurring rules once per recommendation.

## 13. EN/VI UX

Added the `recommendations` catalog to `messages/en/plan.json` and `messages/vi/plan.json`, covering section headings, Jar states, allocation issues, uncategorized transactions, Goal backing and valuation states, target-date risk, recurring mismatch copy, and CTA labels. Money values are formatted at render time through the shared formatter.

## 14. Database / Migration Changes

No database migration was added or applied for PLAN 11. Recommendations are derived from current application read models and are not persisted.

## 15. Tests / Validation

| Check | Result |
| --- | --- |
| Focused recommendation, Assisted, Jar, Home health, Monthly Review, and allocation tests | 24 passed |
| Full unit suite | 497 tests passed across 83 files |
| TypeScript | Passed with `npx tsc --noEmit` |
| ESLint | Passed with `npm run lint` |
| Production build | Passed with `npm run build` |
| Browser smoke: unauthenticated Plan Home and Monthly Review redirects | 2 passed; authenticated cases skipped because E2E credentials were unavailable |
| `git diff --check` | Passed |
| Repository-wide `npm run format:check` | Reports 2,215 pre-existing formatting warnings across the repository; no formatting changes were applied outside PLAN 11 scope |

## 16. Deferred to PLAN 12

Deferred items include reliable recurring-to-Money matching integration, recommendation dismissal or history persistence, notification delivery, automatic execution, AI-generated advice, forecasting, investment strategy, tax advice, debt optimization, partial Goal funding, migration cleanup, and final legacy cleanup.

## 17. Remaining Risks

The current engine can express recurring mismatches but intentionally does not display them until a trustworthy expected-to-actual mapping is supplied. Ready-state regression requires a reliable prior Ready-state set; without that input it does not fabricate a detector. Authenticated browser evidence for populated Assisted and Manual fixtures was not available in this environment, so the validation covered route redirects and the full automated test/build pipeline instead.
