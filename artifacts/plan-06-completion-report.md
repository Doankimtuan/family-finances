# PLAN 06 Completion Report

## 1. Summary

Plan Home now functions as the household's current operational plan view rather than a navigation hub. The page leads with the household-local planning month and plan health, then presents prioritized exceptions, active Jar usage, a compatibility-safe Goal summary, near-term commitments, and an optional Monthly Review entry.

## 2. Existing Prototype Reused / Changed

The existing `getPlanPulse`, `getCurrentJarBudgets`, `listGoals`, `getHouseholdCalendar`, `JarCard`, locale formatting, navigation paths, offline banner, emergency inbox banner, and Monthly Review route were reused. The Plan Home page was reorganized around the approved PLAN 06 hierarchy. Assisted remains a secondary Assisted/Manual indicator; the page no longer renders a separate recommendation feed.

The existing `plan-home-health.ts` module was refined rather than replaced with a second engine. Unmapped transactions now produce `attention`, while overspent Jars produce `off_track`. A small priority helper caps Home exceptions at three items.

## 3. Final Plan Home Information Hierarchy

The implemented order is: offline and emergency context; current household-local planning period with Assisted/Manual context; compact health status; Needs Attention when exceptions exist; active non-income Jars; active Goals; upcoming commitments in the next seven days; optional Monthly Review; and compact secondary links to Money, Goals, and Recurring.

## 4. Plan Health

The states are `no_plan` when no active non-income Jars exist, `off_track` when one or more visible Jars are overspent, `attention` when visible Jars are near their limit, unmapped expenses exist, percentage allocation has no qualifying income, or another factual exception exists, and `healthy` otherwise. No arbitrary numerical score is introduced.

## 5. Jar Cards

Jar cards use the existing current-period Jar budget read model. They show budget, spent, remaining or over-budget amount, usage percentage, and a capped progress bar whose accessible numeric label preserves values above 100%. Income-kind Jars are excluded from the spending stack. Archived and paused Jars remain outside the primary Home list. Overspending uses explicit text such as “Over budget by …” and the page never uses “Jar balance” language.

## 6. Needs Attention

The supported exception types are overspent Jar, unmapped expense, missing qualifying income, over-allocation, near-limit Jar, and legacy Goal backing. Items are prioritized as overspending, unmapped expense, missing income, over-allocation, near-limit Jar, then Goal backing, with a maximum of three displayed. Each item links to an actionable existing destination: Jar detail, Inbox, Plan Jars, or Goal detail.

## 7. Goals Summary

The page shows up to three active or ready Goals, ordered by nearest target date and then lower progress. Completed and cancelled Goals are excluded. Legacy/manual progress is labeled “Legacy progress” rather than presented as verified linked funding. No Goal V2 funding migration or new funding calculation was added.

## 8. Upcoming

Upcoming items reuse the existing household calendar projection and are limited to the next seven days and three items. Recurring projections are labeled “Expected”; card, loan, and liability commitments are labeled “Due”. The section links to the existing Calendar route and does not introduce payment flows.

## 9. Monthly Review Entry

The existing optional Monthly Review entry remains secondary and links to the existing ritual route. No required, pending approval, lock, or close-month semantics were added.

## 10. Responsive / Accessibility Notes

The page is mobile-first, uses a compact one-column flow on narrow screens, and switches Jar, Goal, and upcoming groups to bounded grids on larger screens. Jar links and exception actions are keyboard-focusable. Progress bars expose accessible labels and numeric values, while overspending is communicated in text and not by color alone. English and Vietnamese copy was added for the new states and actions.

## 11. Query / Performance Strategy

The page continues to compose the existing bounded application queries in one parallel server-side load: current Plan pulse, current-period Jar budgets, open Inbox items, Goals, and the household calendar projection. It does not issue one query per Jar, Goal, or event and does not duplicate budget, spending, rollover, adjustment, usage, or Goal-funding calculations in React.

## 12. Database / Migration Impact

No migrations were applied remotely. PLAN 06 only consumes the existing local/application contracts and preserves the unapplied Goal V2 migration boundary.

## 13. Tests / Validation

Focused Plan tests: 4 files, 22 tests passed. Full unit suite: 81 files, 480 tests passed. `npm run typecheck` passed. `npm run lint` passed. Production `npm run build` passed. Prettier checks passed for all Plan Home files. `git diff --check` passed. The available Plan Home Playwright smoke test passed its unauthenticated redirect case; the authenticated case was skipped because E2E credentials were not provided.

## 14. Deferred to PLAN 07+

The full Monthly Review report, Goal V2 architecture, Goal Fund/Withdraw/Reallocate, Assisted V2 recommendation logic, new rollover mechanics, new budget formulas, and final migration cleanup remain deferred.

## 15. Remaining Risks

Authenticated browser verification still requires household credentials and deployed schema state. Goal linked-funding details remain compatibility-safe until the Goal V2 migration is live. Calendar projections remain projections and are intentionally not treated as recorded transactions.
