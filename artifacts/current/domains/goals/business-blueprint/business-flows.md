# Business Flows

## Create Goal

Trigger:

- Household identifies a future purpose worth tracking.

Preconditions:

- Household context is valid.
- Purpose is understandable.
- Target amount is positive and known enough for planning.
- Goal is framed as intention, not balance.

Business Rules:

- Goal is a named future intention.
- Target amount is an estimate, not a contract.
- Creating a goal does not move money.

Expected Result:

- Goal becomes Active.

Failure Result:

- If purpose, target, household context, or BR-01 meaning is invalid, no goal is created.

## Update Goal Meaning

Trigger:

- Household changes goal name, purpose, target amount, target date, or simple context.

Preconditions:

- Goal is Active or Paused.
- New meaning remains understandable.
- New target amount, if changed, remains positive.

Business Rules:

- Update changes intention only.
- Target date is desired household timing, not provider truth.
- Simple context must not become advice or source-domain fact.

Expected Result:

- Goal remains Active or Paused with updated intention.

Failure Result:

- Invalid meaning, invalid target, or balance-like interpretation preserves prior valid state.

## Add Contribution Update

Trigger:

- Household wants to record perceived progress toward a goal.

Preconditions:

- Goal is Active or Paused.
- Contribution amount is positive.
- Household understands this as progress update, not automatic transfer.

Business Rules:

- Contribution is goal progress unless Transactions owns a real movement.
- Contribution does not create account, cash, wallet, or savings balance.
- Progress may reach or exceed target.

Expected Result:

- Goal perceived progress increases.
- If progress reaches or exceeds target, the goal may become Completed according to approved completion semantics.

Failure Result:

- Invalid amount, terminal goal, or real-transfer implication preserves prior valid state.

## Pause Goal

Trigger:

- Household temporarily stops pursuing the goal.

Preconditions:

- Goal is Active.

Business Rules:

- Pause does not erase history.
- Pause does not move money.
- Paused goal remains household intention but is not actively pursued.

Expected Result:

- Goal becomes Paused.

Failure Result:

- If goal is Completed or Cancelled, no state change occurs.

## Resume Goal

Trigger:

- Household decides a paused goal should be pursued again.

Preconditions:

- Goal is Paused.
- Purpose remains relevant.

Business Rules:

- Resume does not imply new funding.
- Resume returns the goal to active pursuit.

Expected Result:

- Goal becomes Active.

Failure Result:

- Completed or Cancelled goals cannot resume as ordinary continuation.

## Complete Goal

Trigger:

- Household considers the goal intention fulfilled.

Preconditions:

- Goal is Active or Paused.
- Household has enough confidence to mark the intention done.

Business Rules:

- Completion is an intention state.
- Completion does not prove payment, purchase, transfer, withdrawal, or balance.
- Completion preserves history.

Expected Result:

- Goal becomes Completed.

Failure Result:

- If completion is being used to claim real money movement, action is invalid until source-domain fact exists.

## Cancel Goal

Trigger:

- Household decides the goal should no longer be pursued.

Preconditions:

- Goal is Active or Paused.

Business Rules:

- Cancellation is not failure by default.
- Cancellation does not move money.
- Cancellation does not erase history.

Expected Result:

- Goal becomes Cancelled.

Failure Result:

- If goal is already terminal, prior terminal state remains.

## Associate Savings Product Context

Trigger:

- Household wants to understand that a savings product is related to a goal purpose.

Preconditions:

- Goal exists.
- Savings product fact exists in Savings.
- Association is context only.

Business Rules:

- Savings owns balance, rate, tenor, maturity, withdrawal, renewal, and settlement.
- Goal may carry purpose context but cannot override Savings truth.

Expected Result:

- Goal can be understood alongside savings product context.

Failure Result:

- If association implies goal owns the savings product, association is invalid.

## Review Real-Money Evidence

Trigger:

- Household or system context compares goal progress with source-domain facts.

Preconditions:

- Goal exists.
- Source-domain facts are available or uncertainty is explicit.

Business Rules:

- Evidence is read-only.
- Source domains own real money truth.
- Missing evidence cannot be treated as proof.

Expected Result:

- Household can understand whether goal progress appears supported, unsupported, or uncertain.

Failure Result:

- If evidence is stale, missing, or contradictory, no authoritative conclusion is made and prior goal state remains.

## Handle Deadline Pressure

Trigger:

- Target date approaches, passes, or changes.

Preconditions:

- Goal has target timing.

Business Rules:

- Target date is household timing.
- Deadline pressure is not punitive.
- Passing a date does not automatically complete or cancel the goal.

Expected Result:

- Goal remains Active, Paused, Completed, or Cancelled based on household decision.

Failure Result:

- If timing is misread as provider due truth, prior valid state remains until clarified.
