# Exceptional Scenarios

## Cancellation

Scenario:

- Source domain cancels the underlying event or determines attention is no longer valid.

Business expectation:

- Inbox item may be Dismissed, Expired, or recovered according to source meaning.
- Cancellation does not erase decision history.

## Correction

Scenario:

- Prior source information or household decision was wrong.

Business expectation:

- Prior history remains traceable.
- Item returns to Pending or new linked attention is created.
- Inbox does not silently rewrite source truth.

## Recovery

Scenario:

- Deferred, dismissed, expired, resolved, or archived item needs renewed attention.

Business expectation:

- Recovery must have explainable reason.
- Prior outcome remains understandable.
- Active attention resumes as Pending when valid.

## Emergency

Scenario:

- Household emergency creates many urgent transactions, transfers, reminders, or savings decisions.

Business expectation:

- Inbox can hold unresolved attention.
- Inbox must not block real-world care.
- Staleness remains non-punitive.

## Conflict

Scenario:

- Partners disagree about an item or prior outcome.

Business expectation:

- Inbox may preserve outcome history.
- Inbox must not score partner behavior.
- Relationship policy belongs outside Inbox.

## Expired Data

Scenario:

- Time-bound attention is no longer active.

Business expectation:

- Item may become Expired.
- Expiration does not mean payment, cancellation, or resolution of source obligation.

## Invalid State

Scenario:

- A transition is requested that business rules forbid.

Business expectation:

- Item enters Invalid Attempt for the failed action only or remains in the prior valid state.
- No source truth changes.

## Unexpected User Behavior

Scenario:

- User tries to dismiss required attention, resolve without context, or use Inbox as deletion.

Business expectation:

- Invalid action is rejected.
- Item remains in prior valid state.

## System Interruption

Scenario:

- Household cannot complete a review because the product is unavailable or context cannot be loaded.

Business expectation:

- Prior valid state remains.
- No partial financial meaning is assumed.
- Household can resume from the last valid business state.

## Duplicate-Looking Attention

Scenario:

- Two items appear to describe the same real-world event.

Business expectation:

- Current approved scope does not own duplicate matching.
- Household should not be forced to treat duplicate-looking items as one event unless source ownership validates it.

## Generic Notification Attempt

Scenario:

- Marketing, awareness-only alert, or provider message tries to enter Inbox.

Business expectation:

- Candidate is rejected as not Inbox-eligible.
