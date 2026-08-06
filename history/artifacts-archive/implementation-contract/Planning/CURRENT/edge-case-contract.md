# Edge Case Contract

## Duplicate Action

Trigger: Same create, update, review, correction, or inbox request is submitted twice.

Expected behavior: Duplicate must not create duplicate active Planning items or duplicate Inbox review for same item and reason.

Business result: Existing valid state is preserved or single intended update is represented once.

User-visible result: Confirmation or duplicate-safe message.

Recovery behavior: User can inspect the single resulting item.

## Expired Or Stale State

Trigger: Expected income, due date, recurring item, or source fact is outdated.

Expected behavior: Item becomes Needs Review when user action is required.

Business result: Stale data is not treated as confirmed.

User-visible result: Review warning.

Recovery behavior: Confirm, update, keep expected, or correct.

## Cancelled Operation

Trigger: User cancels before confirming.

Expected behavior: No state change.

Business result: Prior valid state remains.

User-visible result: Return to prior view/state.

Recovery behavior: User may restart action.

## Provider Changes

Trigger: Cards, Loans, Savings, Transactions, or Accounts facts change after Planning expected data exists.

Expected behavior: Planning reads updated fact; mismatch may create Needs Review.

Business result: Source domain truth wins for real facts.

User-visible result: Expected-versus-confirmed distinction.

Recovery behavior: Adjust, correct, or acknowledge Planning.

## Manual Adjustment

Trigger: User manually changes allocation, date, goal, recurring expectation, or jar.

Expected behavior: Planning updates only if state and validation allow.

Business result: Virtual intention changes.

User-visible result: Confirmation that no money moved when relevant.

Recovery behavior: Correct or edit again.

## Interrupted Process

Trigger: Review, correction, or allocation action is interrupted.

Expected behavior: No partial business transition may imply success.

Business result: Prior valid state remains unless action completed deterministically.

User-visible result: Failure or retry state.

Recovery behavior: Retry action.

## Network Retry

Trigger: User retries after network failure.

Expected behavior: Retry must not duplicate Planning item, review lock, correction, notification, or Inbox item.

Business result: At most one valid business effect.

User-visible result: Current valid state displayed.

Recovery behavior: Continue from current state.

## Partner Conflict

Trigger: Partner challenges or conflicts with a planning assumption.

Expected behavior: Item becomes Needs Review.

Business result: Prior valid plan remains until resolution or explicit adjustment.

User-visible result: Review request.

Recovery behavior: Keep, adjust, pause, cancel, or correct.

## Boundary Confusion

Trigger: User attempts to treat jar as account, goal as product balance, recurring expectation as payment, or emergency reallocation as transfer.

Expected behavior: Reject or require reframing as Planning intention.

Business result: No Ledger or source-domain mutation.

User-visible result: Boundary error.

Recovery behavior: Continue with valid Planning action or use owning domain.

## Locked Period Edit

Trigger: User attempts normal edit on Locked period.

Expected behavior: Normal edit is forbidden.

Business result: State unchanged.

User-visible result: Correction path required.

Recovery behavior: Use Correct Planning action.
