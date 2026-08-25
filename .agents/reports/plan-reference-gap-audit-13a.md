# PLAN 13A — Reference Gap Audit

Date: 2026-08-23  
Scope: Plan Home, Jars, Goals, Monthly Review, recommendations, linked Money
sources, adjustments/rollover, ownership, privacy, i18n, and browser UX.  
Implementation changes: none.

## Verdict

**PLAN AUDIT BLOCKED**

Plan’s core calculation and non-money movement contracts are mostly aligned,
but the following gaps prevent reference-ready status:

## Findings

### P0 — financial/security/data-integrity

| ID    | Finding                                                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Impact                                                                                                                                                                        |
| ----- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 | Plan financial values bypass `FinancialValue` in several visible paths. | `app/[locale]/(product)/plan/page.tsx` interpolates formatted jar, goal, event, and exception amounts into `Text`/translation strings; `shared/patterns/jar-card.tsx` and `shared/patterns/goal-card.tsx` render amount labels as plain nodes; `app/[locale]/(product)/plan/ritual/monthly-review.tsx` renders metrics, jar/goal amounts, changes, and issue amounts as plain text; `app/[locale]/(product)/plan/recommendation-list.tsx` interpolates recommendation amounts. Only `Amount` is privacy-wrapped. | Privacy mode can expose Plan financial values in Home, Jars, Goals, Review, and recommendations. This violates the global `FinancialValue` contract and is a release blocker. |

### P1 — broken or misleading core UX/domain behavior

| ID    | Finding                                                                            | Evidence                                                                                                                                                                                                                                                                                                                                        | Impact                                                                                                                                                                                                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 | Investment valuation `UNKNOWN` is collapsed into Plan `missing` and progress zero. | `modules/plan/application/queries/list-goals.ts` derives holding status from `currentValuationDate` only; `modules/investments/application/market-valuation.ts` has explicit `MarketValuationQuality.UNKNOWN` / `MarketValuationFreshness.UNKNOWN`; `modules/plan/application/goal-funding.ts` treats missing/unavailable as zero contribution. | A Goal linked to a holding with unknown valuation can display 0 progress as if the holding were worth zero. The UI shows “missing” rather than “unknown valuation,” which is misleading. Preserve UNKNOWN as an explicit non-zero/indeterminate state and do not silently substitute zero for progress. |
| P1-02 | Plan action forms do not use the required shared action-sheet/footer composition.  | No Plan route under `app/[locale]/(product)/plan` imports `ActionSheetLayout`, `SheetActionFooter`, or `BottomActionBar`; create/edit/reallocate/contribute actions use inline page forms/buttons.                                                                                                                                              | Required mobile action hierarchy, sticky safe-area footer, and consistent action-sheet behavior are not proven for Plan’s primary actions at 390/440px.                                                                                                                                                 |
| P1-03 | Required authenticated browser matrix is incomplete.                               | Plan E2E smoke has authenticated credentials and the targeted run passed the visible hub/goals/recurring checks plus unauthenticated guards, but no recorded evidence covers all Plan screens at 390, 440, 768, and 1280 in EN/VI, light/dark, reduced motion, privacy-hidden, offline, and no-overflow states.                                 | Reference readiness cannot be signed off for the specified browser UX contract.                                                                                                                                                                                                                         |

### P2 — polish/debt

| ID    | Finding                                                                                                                                           | Evidence                                                                                                                                                                                                                                 | Impact                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-01 | Plan Home recommendations omit `currency` and `locale` when rendering `RecommendationList`.                                                       | `app/[locale]/(product)/plan/page.tsx` passes recommendation data, names, and translator but not the optional `currency`/`locale` props; `recommendation-list.tsx` then interpolates numeric amounts without shared currency formatting. | Home recommendation amounts can render as raw numbers instead of localized currency. This is a display-quality issue after the P0 privacy wrapper is fixed.                           |
| P2-02 | Legacy Ritual/Quick Close contracts and translation keys remain in the Plan application/messages even though the exposed route is Monthly Review. | `modules/plan/application/commands/month-ritual.ts`, `ritual-types.ts`, `plan-constants.ts`, and `messages/{en,vi}/plan.json` retain deprecated Quick Close/Ritual strings and compatibility actions.                                    | No current route was found exposing Quick Close, so this is not a current mutation blocker; remove or isolate when the compatibility surface is retired to prevent terminology drift. |

## Verified as aligned

- Jars support fixed and percentage plans, active/paused/archived behavior,
  category linkage, period-local budgets, rollover, negative remaining/true
  overspend, near-limit state, and no Money creation/movement for allocation or
  reallocation. Focused jar tests passed.
- Qualifying income priority is configured household income, recurring income,
  then posted qualifying income. The posted fallback uses financial semantics,
  excludes transfers, investment principal, loan/debt principal, reversals, and
  non-income event types. Period bounds and snapshots are deterministic.
- Goal funding derives from Savings, investment holdings, and Loan/Debt
  principal contracts; generic accounts are not a generic goal source, with the
  explicit `savings_account` source remaining supported. Ready ↔ Active,
  terminal states, unlink/reassign conflict rules, stale/missing values, and
  mixed sources have focused coverage.
- Savings rollover uses the current lifecycle cycle selector, so old rolled
  cycles are not added to the current position. Settled/early-closed sources
  resolve unavailable rather than being treated as active funding.
- Loan/Debt payoff progress uses original/initial principal minus remaining
  principal, not transaction signs or generic account balance inference.
- Monthly Review’s exposed UI is optional metadata/reporting; its mark-reviewed
  action does not lock Plan or Money. Historical review data is household and
  period scoped, and snapshots are stored separately from live calculations.
- Recommendation generation is deterministic and deduplicated by stable IDs;
  recommendations navigate to review surfaces and do not perform financial
  mutations. Focused recommendation tests passed.
- Jar adjustments and rollover are period-scoped, positive-only rollover is
  enforced, and reallocation validates zero ledger impact. Historical snapshots
  are not rewritten by normal current-period reads.
- Household membership gates Plan reads/actions. The ownership/RLS suite and
  the recorded 14D live matrix cover cross-household and personal-source
  denial; no Plan mutation path was found to grant User B authority over User A
  personal Money source at the protected database boundary.
- EN/VI message parity tests passed; no raw translation-key failure was found in
  the focused suite.

## Regression results

| Check                                                                                            | Result                                                                                                                                              |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused Plan, jar, goal funding, Monthly Review, recommendations, ownership, privacy, i18n tests | PASS — 11 files, 137 tests                                                                                                                          |
| Typecheck                                                                                        | PASS                                                                                                                                                |
| Build                                                                                            | PASS                                                                                                                                                |
| Plan E2E smoke subset                                                                            | PARTIAL evidence — authenticated/unauthenticated smoke began and visible checks passed; full required viewport/theme/privacy matrix not run         |
| Lint                                                                                             | FAIL — 3 pre-existing diagnostics in `scripts/home-compact-cta-check.cjs` (`require()` imports and `console`); no Plan-file diagnostic was reported |
| Full regression families requested                                                               | Not all rerun; no implementation changes were made, so broader unrelated suites were not repeated                                                   |

## Recommended implementation sequence

1. Fix P0-01 centrally: make every Plan financial leaf and financial
   interpolation consume `FinancialValue` (including shared Jar/Goal cards,
   Home, Review, recommendations, and action previews), then add Plan privacy
   regression coverage.
2. Preserve investment valuation UNKNOWN through the Plan funding contract and
   render an explicit indeterminate/stale explanation; add the valuation/Goal
   integration cases before changing UI copy.
3. Normalize Plan create/edit/reallocate/contribute actions onto the shared
   action-sheet layout with sticky safe-area footer and verify the complete
   responsive/accessibility matrix.
4. Pass currency/locale into Home recommendations and remove/isolate obsolete
   Ritual terminology after the current compatibility callers are confirmed
   absent.

P0 count: **1**  
P1 count: **3**  
P2 count: **2**

**PLAN AUDIT BLOCKED**
