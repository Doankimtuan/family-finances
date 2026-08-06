# Business Flows

## Create Income Intention

Trigger:

- Household expects income that should inform planning.

Preconditions:

- Household context is valid.
- Income is expected, not claimed as received.
- Amount or basis is known enough for household planning.

Business Rules:

- Expected income is planning intent, not real ledger truth.
- Actual income is confirmed only by Accounts and Transactions.
- Income allocation may be fixed or variable.

Expected Result:

- Income intention becomes Draft or Active.
- It may inform jars, goals, recurring expectations, and review.

Failure Result:

- If the household cannot identify the expectation clearly, no active income intention is created.

## Create Jar

Trigger:

- Household identifies a purpose for planned money.

Preconditions:

- Purpose is recognizable to the household.
- Jar is not represented as a real account.
- Household context is valid.

Business Rules:

- A jar is virtual planning only.
- Active jars may receive allocation intention.
- Paused or archived jars are not active allocation targets.

Expected Result:

- Jar becomes Active with planning meaning.

Failure Result:

- If the jar is framed as a bank balance or real container, creation is invalid.

## Update Jar Or Allocation

Trigger:

- Household changes how expected money should be assigned.

Preconditions:

- Planning period allows normal changes.
- Target intention is active unless the change is a lifecycle change.
- Amount or percentage is valid for planning.

Business Rules:

- Allocation changes do not move real money.
- Planned amounts must remain distinguishable from balances.
- Positive magnitude and explicit direction apply to planning movement.

Expected Result:

- Planning intention is updated.

Failure Result:

- Invalid target, locked period, or balance-like interpretation preserves the prior valid plan.

## Pause Intention

Trigger:

- Household temporarily stops planning toward a jar, goal, recurring expectation, or similar intention.

Preconditions:

- Intention is Active.
- Household has valid authority within shared planning context.

Business Rules:

- Paused intentions are not active allocation targets.
- Pause does not erase history.
- Pause does not move money.

Expected Result:

- Intention becomes Paused.

Failure Result:

- If intention is already terminal or archived, no state change occurs.

## Resume Intention

Trigger:

- Household decides a paused intention should become active again.

Preconditions:

- Intention is Paused.
- Required planning context is still valid.

Business Rules:

- Resumed intention becomes eligible for planning use.
- Resumption does not imply funding.

Expected Result:

- Intention becomes Active.

Failure Result:

- If the intention is cancelled, completed, or archived, normal resume is not allowed.

## Create Or Update Goal

Trigger:

- Household identifies a target purpose such as emergency reserve, baby fund, purchase, or savings preparation.

Preconditions:

- Goal is understandable as intention.
- Goal is not claimed as Savings product truth.

Business Rules:

- Goal progress is planning meaning unless backed by source-domain facts.
- Savings product truth belongs to Savings.
- Goal completion does not prove real money moved.

Expected Result:

- Goal becomes Draft or Active, or an existing goal is updated.

Failure Result:

- If goal is treated as provider balance, the planning action is invalid.

## Create Or Update Recurring Expectation

Trigger:

- Household recognizes a repeating income or expense expectation.

Preconditions:

- Name, expected amount, direction, and recurrence pattern are known enough for planning.

Business Rules:

- Recurring expectation does not prove payment.
- Actual payment belongs to Transactions.
- Provider due truth belongs to the source domain when applicable.

Expected Result:

- Recurring expectation becomes Active or updated.

Failure Result:

- If the expectation implies payment completion, the action is invalid until reframed as expectation.

## Maintain Expected Due Date

Trigger:

- Household records or updates when an obligation is expected.

Preconditions:

- Date is expected or source-confirmed.
- Source of truth is not misrepresented.

Business Rules:

- Expected due date is planning pressure.
- Cards, Loans, Savings, or providers own confirmed due truth.
- Planning may show source facts read-only.

Expected Result:

- Expected pressure becomes visible to Planning.

Failure Result:

- If source truth is unclear, due date remains expected or Needs Review.

## Compare Plan With Facts

Trigger:

- Household or system context reveals actual facts relevant to planning.

Preconditions:

- Planning intention exists.
- Source-domain fact exists or uncertainty is explicit.

Business Rules:

- Comparison explains mismatch.
- Comparison does not judge the household.
- Comparison does not mutate source facts.

Expected Result:

- Planning insight becomes reviewable business context.

Failure Result:

- If facts are missing or stale, comparison is not treated as authoritative.

## Review Period

Trigger:

- Household reaches month-end or another review point.

Preconditions:

- Planning period exists.
- Household can inspect active intentions and relevant facts.

Business Rules:

- Review is household learning.
- Review lock applies to planning state, not real ledger history.
- Corrections remain possible through explicit correction path.

Expected Result:

- Period becomes Reviewed or Locked.
- Household has a stable historical planning record.

Failure Result:

- If required review context is invalid or conflicts remain unresolved, period remains Active or Needs Review.

## Correct Planning

Trigger:

- Household discovers planning information was wrong or incomplete.

Preconditions:

- Planning item or period exists.
- Correction concerns intention, not source-domain fact.

Business Rules:

- Correction preserves interpretability.
- Correction does not rewrite real ledger truth.
- Locked period correction is explicit.

Expected Result:

- Planning record becomes Corrected or returns to valid Active/Historical state.

Failure Result:

- If correction attempts to change another domain's truth, it is rejected.

## Emergency Reallocation

Trigger:

- Emergency disrupts the current plan.

Preconditions:

- Household identifies which intention is affected.
- Change is framed as virtual planning adaptation.

Business Rules:

- Emergency reallocation does not move money.
- Real emergency spending belongs to Transactions and Accounts.
- Debt, card, loan, or savings truth remains with owning domains.

Expected Result:

- Planning adapts and remains understandable.

Failure Result:

- If action claims real money moved without source-domain fact, planning change is invalid.

## Complete Intention

Trigger:

- Household decides planning purpose is fulfilled.

Preconditions:

- Intention is Active or Paused.
- Completion is household intention completion.

Business Rules:

- Completion is not proof of real payment, transfer, or savings settlement.
- Completed items remain historical.

Expected Result:

- Intention becomes Completed, then Historical.

Failure Result:

- If completion conflicts with source-domain facts, item may remain Needs Review.

## Cancel Or Archive Intention

Trigger:

- Household decides an intention no longer applies.

Preconditions:

- Intention exists.
- It is not already terminal.

Business Rules:

- Cancellation or archival does not erase history.
- Archived intentions are not active allocation targets.
- No real money moves.

Expected Result:

- Intention becomes Cancelled or Archived, then Historical.

Failure Result:

- Invalid state preserves prior valid state.
