# PLAN 08 Completion Report

## 1. Summary

PLAN 08 implements the Goal Funding Model foundation in the existing `family-finances` repository. Goals can now link to real Savings, savings-type Accounts, Investment holdings, Loans, or informal Debt sources according to semantic compatibility. A Goal may have multiple compatible sources, while each active source is exclusively owned by at most one Goal. Linking is allocation metadata only; it never creates a Money transaction, contribution row, transfer, withdrawal, sale, or repayment.

The implementation preserves the existing Plan V2 prototype and legacy Goal behavior while replacing linked Goal progress with a shared derived read model. New Goals use a soft backing requirement: they may be created without a source, but are marked as needing a funding source and do not expose manual progress entry.

## 2. Existing Prototype Reused / Changed

The existing `goal-funding.ts`, `link-goal-funding.ts`, `list-goal-funding-options.ts`, Goal read model, Goal detail UI, Goal create form, and `20260816160000_plan_v2_goal_funding.sql` migration were reused and refined. The calculation core was changed so asset values are derived centrally, while payoff progress is explicitly deferred to PLAN 09 rather than being inferred from a remaining-balance snapshot. The option query now exposes ownership conflicts instead of silently hiding used sources. The migration was rewritten cleanly to include the approved schema, partial unique indexes, RLS, audit fields, and tenancy/semantic trigger.

## 3. Final Goal Type Model

The existing `save_up`, `invest`, and `payoff` Goal types remain. `save_up` and `invest` are both treated as asset Goals for funding compatibility, which allows the approved mixed Savings + Investment model. `payoff` Goals are debt-only and may link to Loans or informal Debt. Asset sources cannot be linked to payoff Goals, and debt sources cannot be linked to asset Goals.

## 4. Funding Source Types

| Source | Allowed? | Reason |
| --- | ---: | --- |
| Savings product | Yes | Uses the Savings domain's current cycle principal and active/matured lifecycle. |
| Account with type `savings` | Yes | Stable savings-type account semantics; archived and transactional account types are excluded. |
| Investment holding | Yes | Uses the holding-level current value; brokerage cash is not a Goal source. |
| Loan | Yes, payoff only | Stable debt source; final paid-down progress is deferred to PLAN 09. |
| Informal liability/debt | Yes, payoff only | Stable remaining amount and lifecycle semantics; final payoff progress is deferred. |
| Checking, cash, e-wallet, payment, credit-card, brokerage cash, other Account | No | Normal transactional balances fluctuate and cannot safely represent dedicated Goal backing. |

## 5. Goal Funding Link Architecture

`goal_funding_links` stores one typed source reference per row and supports multiple rows per Goal. Partial unique indexes on each source foreign-key column apply only while `is_active = true`, enforcing whole-source exclusivity and resolving concurrent attempts at the persistence layer. Soft unlink preserves `linked_at`, `linked_by`, `unlinked_at`, and `unlinked_by` audit information.

## 6. Source Eligibility Rules

Server validation checks household membership, Goal ownership, source ownership, Goal/source semantic compatibility, source lifecycle, positive/relevant source value, savings account type, and currency compatibility. The database trigger repeats household and semantic checks for direct authenticated writes. Historical links remain readable when a source disappears, while the read model marks the source as missing or unavailable instead of crashing.

## 7. Create/Edit Goal UX

Goal creation now includes an optional grouped source selector for Savings, Investments, and Debt. Used sources remain visible but disabled with an explanation. Selecting a source creates the Goal and then links the source through the authoritative server command. If no source is selected, the Goal is still created as `needs_backing`. Goal editing preserves linked sources and blocks changing a linked Goal to an incompatible type. Goal detail supports adding and unlinking sources, with confirmation controls that explain that unlinking stops counting the source and does not move money.

## 8. Legacy Goal Compatibility

Existing Goals are backfilled into `legacy_funded_amount`; `funded_amount` remains available for legacy compatibility and `goal_contributions` remains available only for unlinked legacy Goals. A Goal with active links displays only the derived linked value, never `legacy_funded_amount + derived value`. A new unlinked Goal has a null legacy marker, is labeled `needs_backing`, and does not expose the manual contribution control. Legacy-only Goals remain labeled as legacy progress.

## 9. Derived Funding Contract

For asset Goals, `fundedAmount` is the sum of the current authoritative value of linked Savings, savings-type Accounts, and Investment holdings. Progress is allowed to exceed 100 percent and is not stored as a capped value. For payoff Goals, the shared read model returns a typed deferred value status and funded amount zero; current debt balances are exposed as source metadata only. PLAN 09 must define original-principal and paid-down progress semantics before payoff progress is derived.

## 10. Plan Home / Monthly Review Integration

The shared `PlanGoal` read model now carries `backingState` (`linked`, `legacy`, or `needs_backing`) and `fundingValueStatus` (`derived`, `legacy`, or `deferred`). Existing Plan Home and Monthly Review consumers continue to read the same `fundedAmount`, `progressPercent`, and `fundingLinks` fields without duplicating funding calculations.

## 11. Database / Migration Changes

The exact migration is `supabase/migrations/20260816160000_plan_v2_goal_funding.sql`. It adds Goal type and legacy compatibility columns, creates the typed funding-link table, adds active-source uniqueness indexes, adds audit fields, configures RLS, preserves the legacy contribution RPC boundary, and adds a database tenancy/semantic integrity trigger. No migration was applied remotely in this task.

## 12. Security / Concurrency

All reads and mutations are household-scoped through the active membership gate and explicit `household_id` predicates. The database trigger rejects cross-household Goal/source combinations and semantically invalid Goal/source combinations. Partial unique indexes prevent one active source from backing multiple Goals even when requests race.

## 13. Tests / Validation

The focused Goal funding and Goal mapping tests pass: 14 tests passed. The full unit suite passes: 82 test files and 483 tests passed. `npm run lint` passes, `npm run typecheck` passes, `npm run build` passes, and `git diff --check` passes. Browser smoke testing was not run because no authenticated browser session was available in this task.

## 14. Deferred to PLAN 09+

Final Investment market-value freshness behavior, final Debt/Loan payoff progress, Fund/Withdraw/Reallocate actions, lifecycle automation, Assisted Goal recommendations, explicit source reassignment UX, and final legacy cleanup remain deferred. The implementation does not apply unrelated Plan migrations and does not start PLAN 09.

## 15. Remaining Risks

The source resolver currently uses the safe current values already exposed by the Money domain. Savings interest treatment, investment valuation freshness, and debt original-principal history need domain-specific refinement in PLAN 09. The migration should be applied and tested in the target Supabase environment before production use; it was intentionally not applied remotely here.
