# Exceptional Scenarios

## Cancellation

Business expectation:

- Cancellation ends an intention without erasing history.
- Cancellation does not imply real money moved.
- Cancelled intention becomes historical after active work ends.

## Correction

Business expectation:

- Corrections are explicit.
- Corrections fix planning intent only.
- Corrections cannot alter Accounts, Transactions, Cards, Loans, or Savings truth.

## Recovery

Business expectation:

- Planning must recover from mistakes, stale data, emergency pressure, and partner conflict.
- Recovery returns to a valid business state or preserves prior valid state.

## Emergency

Business expectation:

- Emergency adaptation changes household intention.
- Emergency spending, withdrawal, transfer, or debt use must be represented by the owning real-money domain.
- Emergency handling must not shame the household.

## Conflict

Business expectation:

- Partner disagreement moves the item to Needs Review or leaves prior valid state intact.
- Disagreement does not silently change planning assumptions.
- Shared policy from Together governs who may act.

## Expired Data

Business expectation:

- Expected income, due dates, recurring assumptions, and calendar pressure may become stale.
- Stale data must not be treated as confirmed fact.
- Item may become Needs Review.

## Invalid State

Business expectation:

- Forbidden transitions produce Invalid Attempt.
- Prior valid state remains unchanged.
- Invalid Attempt is not a new active Planning state.

## Unexpected User Behavior

Examples:

- User tries to create a jar as a bank account.
- User marks recurring bill as paid from Planning.
- User treats goal as savings balance.
- User completes debt payoff intention without loan/card fact.

Business expectation:

- Boundary-breaking action is rejected or reframed as intention.
- No source-domain fact is created by Planning.

## System Interruption

Business expectation:

- If Planning change cannot be safely completed, prior valid business state remains.
- No partial business change should imply money movement.
- Online-first mutation constraints remain in force.

## Source-Domain Conflict

Business expectation:

- If source facts contradict planning assumptions, Planning becomes Needs Review or Adjusted.
- Source-domain truth wins for real money facts.
- Planning may preserve the prior intention as historical context.
