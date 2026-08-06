# Action Contract

## Create Goal

Trigger: Household identifies a future purpose worth tracking.

Actor: Owner, Partner, or Admin.

Preconditions:

- Actor is an active household member with Goals rights.
- Household context is valid.
- Purpose is understandable.
- Target amount is known.
- Goal is framed as intention.

Validation:

- Name or purpose is present.
- Target amount is positive.
- Optional target date is a valid date when supplied.
- Initial progress, if supplied, is non-negative and intention-only.
- Initial status is Active.

Business Rules:

- BR-01, BR-02, BR-02a, BR-06, BR-15.
- Creating a goal does not move money.

Success Result:

- Goal becomes Active.
- No ledger write occurs.

Failure Result:

- No goal is created.
- User-visible failure identifies invalid field, permission, or BR-01 boundary issue.

## Edit Goal

Trigger: Household changes goal name, purpose, target amount, target date, or note.

Actor: Owner, Partner, or Admin.

Preconditions:

- Goal exists.
- Goal is Active or Paused.
- Actor has Goals rights.

Validation:

- Name or purpose remains present.
- Target amount remains positive.
- Target date is valid or absent.
- Note remains simple household context, not advice or source-domain fact.

Business Rules:

- Edit changes intention only.
- Target date is household timing.
- Real-money truth remains in source domains.

Success Result:

- Goal remains in its current Active or Paused state with updated meaning.
- No ledger write occurs.

Failure Result:

- Goal remains unchanged.

## Add Contribution Update

Trigger: Household records perceived progress toward a goal.

Actor: Owner, Partner, or Admin.

Preconditions:

- Goal exists.
- Goal is Active or Paused.
- Actor has Goals rights.

Validation:

- Amount is positive.
- Optional note is simple household context.
- Action is not presented as bank transfer, payment, or withdrawal.

Business Rules:

- Contribution updates goal progress only.
- Transactions owns any real movement.
- Progress above target is allowed only as progress interpretation.

Success Result:

- Goal progress increases by the contribution amount.
- If progress reaches or exceeds target, goal may become Completed according to completion rules.
- No ledger write occurs.

Failure Result:

- Progress remains unchanged.
- Terminal goals reject contribution updates.

## Pause Goal

Trigger: Household temporarily stops pursuing the goal.

Actor: Owner, Partner, or Admin.

Preconditions:

- Goal exists.
- Goal is Active.

Validation:

- Goal is not Completed or Cancelled.
- Actor has Goals rights.

Business Rules:

- Pause does not erase progress.
- Pause does not move money.

Success Result:

- Goal becomes Paused.

Failure Result:

- Goal remains in prior state.

## Resume Goal

Trigger: Household decides a paused goal should be pursued again.

Actor: Owner, Partner, or Admin.

Preconditions:

- Goal exists.
- Goal is Paused.

Validation:

- Goal is not Completed or Cancelled.
- Purpose remains present.
- Target amount remains positive.

Business Rules:

- Resume does not imply funding.

Success Result:

- Goal becomes Active.

Failure Result:

- Goal remains Paused or terminal.

## Complete Goal

Trigger: Household considers the goal intention fulfilled.

Actor: Owner, Partner, or Admin.

Preconditions:

- Goal exists.
- Goal is Active or Paused.

Validation:

- Actor has Goals rights.
- Completion is not used as proof of purchase, payment, transfer, withdrawal, or balance.

Business Rules:

- Completed is an intention state.
- Completion preserves history.
- Completion does not move money.

Success Result:

- Goal becomes Completed.

Failure Result:

- Goal remains unchanged.

## Cancel Goal

Trigger: Household decides the goal should no longer be pursued.

Actor: Owner, Partner, or Admin.

Preconditions:

- Goal exists.
- Goal is Active or Paused.

Validation:

- Actor has Goals rights.
- Goal is not already terminal.

Business Rules:

- Cancellation ends ordinary pursuit.
- Cancellation does not move money.
- Cancellation does not erase history.

Success Result:

- Goal becomes Cancelled.

Failure Result:

- Goal remains unchanged.

## Associate Savings Product Context

Trigger: Household relates an existing savings product to goal purpose context.

Actor: Owner, Partner, or Admin.

Preconditions:

- Goal exists.
- Savings product exists in Savings.
- Goal is Active or Paused.

Validation:

- Savings product is readable by household.
- Association is explicitly context only.
- Association does not copy or overwrite Savings truth.

Business Rules:

- Savings owns balance, rate, tenor, maturity, withdrawal, renewal, and settlement.
- Goals owns purpose context only.

Success Result:

- Goal can display or use the savings product as read-only context.
- No ledger write occurs.

Failure Result:

- Association is not created or is ignored.

## Review Real-Money Evidence

Trigger: Household or system context compares goal progress with source-domain facts.

Actor: Owner, Partner, Admin, System, or Background Worker.

Preconditions:

- Goal exists.
- Source-domain facts are available or explicitly unavailable.

Validation:

- Evidence source is identified.
- Evidence remains read-only.
- Missing evidence is treated as uncertainty.

Business Rules:

- Source truth wins for real money.
- Goals cannot mutate source facts.

Success Result:

- Goal interpretation may be shown as supported, conflicting, or uncertain.
- Goal state does not change automatically.

Failure Result:

- No authoritative conclusion is shown.
- Prior goal state remains.

## Handle Deadline Pressure

Trigger: Goal target date approaches, passes, or changes.

Actor: Owner, Partner, Admin, System, or Background Worker.

Preconditions:

- Goal has target date.

Validation:

- Date is valid.
- Deadline is household timing, not provider due truth.

Business Rules:

- Passing a target date does not automatically complete, cancel, pause, or move money.
- Deadline pressure is not punitive.

Success Result:

- UI may show timing pressure.
- Goal state changes only by explicit household action.

Failure Result:

- If date is invalid or misrepresented as provider truth, prior valid state remains.
