# Edge Case Contract

## Duplicate Action

Trigger:

- User submits the same mutation repeatedly.

Expected behavior:

- Only one valid business result may apply.

Business result:

- Prior valid state is not corrupted.

User-visible result:

- User sees final valid state or duplicate-action error.

Recovery behavior:

- Refresh or retry only after current action resolves.

## Expired Target Date

Trigger:

- Target date passes.

Expected behavior:

- No automatic state transition.

Business result:

- Goal remains Active, Paused, Completed, or Cancelled.

User-visible result:

- Timing pressure may be shown.

Recovery behavior:

- User edits date, completes, pauses, or cancels explicitly.

## Cancelled Operation

Trigger:

- User abandons form or confirmation.

Expected behavior:

- No state change.

Business result:

- Prior valid state remains.

User-visible result:

- Current goal state remains visible.

Recovery behavior:

- User may restart action.

## Savings Product Changes

Trigger:

- Associated savings product changes, matures, is withdrawn, or becomes unavailable.

Expected behavior:

- Goals does not copy or alter Savings truth.

Business result:

- Goal context is read-only, unavailable, or conflicting.

User-visible result:

- User sees source context as unavailable or changed.

Recovery behavior:

- User reviews goal progress or removes context if allowed by future scope.

## Manual Adjustment

Trigger:

- User edits target, date, note, or progress through contribution update.

Expected behavior:

- Adjustment affects intention only.

Business result:

- Goal remains valid state.

User-visible result:

- User sees updated intention.

Recovery behavior:

- User can correct non-terminal goals with another valid edit.

## Interrupted Process

Trigger:

- System interruption occurs during mutation.

Expected behavior:

- No partial state may imply money movement.

Business result:

- Either full valid mutation applies or prior valid state remains.

User-visible result:

- User sees success, failure, or retryable error.

Recovery behavior:

- Retry with same business intent after state is known.

## Network Retry

Trigger:

- User retries after offline or network failure.

Expected behavior:

- Validation reruns against current state.

Business result:

- Action succeeds once or fails without corrupting state.

User-visible result:

- User sees latest valid state.

Recovery behavior:

- Retry only when connected.

## Partner Conflict

Trigger:

- Partner disagrees with goal meaning or progress.

Expected behavior:

- No automatic state change.

Business result:

- Prior valid state remains until explicit action.

User-visible result:

- Conflict is not treated as system truth.

Recovery behavior:

- Household uses edit, pause, complete, or cancel when agreed.

## Terminal Mutation Attempt

Trigger:

- User tries to edit, contribute, pause, or resume a Completed or Cancelled goal.

Expected behavior:

- Reject mutation.

Business result:

- Terminal state remains.

User-visible result:

- Error explains terminal state.

Recovery behavior:

- Corrected terminal meaning requires explicit future business handling outside ordinary actions.

## Real-Money Misinterpretation

Trigger:

- User attempts to treat goal action as transfer, balance, payment, or withdrawal.

Expected behavior:

- Reject or reframe as intention-only action.

Business result:

- No ledger write.

User-visible result:

- BR-01 warning is shown.

Recovery behavior:

- User records real movement in the proper money domain if needed.
