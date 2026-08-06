# Edge Case Contract

## Duplicate Action

Trigger:

- User repeats Create, Record Payment, Complete, Cancel, Default, or Archive.

Expected behavior:

- Prevent duplicate business effect.

Business result:

- At most one valid state change or repayment record is accepted.

User-visible result:

- Confirmation of existing success or duplicate rejection.

Recovery behavior:

- User can review loan history.

## Expired State

Trigger:

- User acts on stale loan state.

Expected behavior:

- Revalidate current state before applying action.

Business result:

- Valid action proceeds; invalid action is rejected and previous state remains.

User-visible result:

- User is told loan changed and should review.

Recovery behavior:

- Loan can enter Needs Review.

## Cancelled Operation

Trigger:

- User cancels before confirming action.

Expected behavior:

- No business change.

Business result:

- Previous state remains.

User-visible result:

- Return to prior view.

Recovery behavior:

- User can restart action.

## Provider Changes

Trigger:

- Provider statement, app, family message, or contract conflicts with product record.

Expected behavior:

- Do not overwrite automatically.

Business result:

- Loan enters Needs Review.

User-visible result:

- Discrepancy is visible as review need.

Recovery behavior:

- User corrects, confirms, or keeps under review.

## Manual Adjustment

Trigger:

- User corrects loan facts after discovering wrong entry.

Expected behavior:

- Allow explainable correction; preserve payment history meaning.

Business result:

- Loan facts update or Needs Review persists.

User-visible result:

- Correction confirmation or validation failure.

Recovery behavior:

- Review loan if correction cannot be safely applied.

## Interrupted Process

Trigger:

- Network/session/system interruption during mutation.

Expected behavior:

- Do not assume partial business success.

Business result:

- Previous valid state remains unless success can be confirmed.

User-visible result:

- User sees retry or review message.

Recovery behavior:

- User retries or checks history.

## Network Retry

Trigger:

- Same mutation is retried after interruption.

Expected behavior:

- Prevent duplicate money movement or duplicate state transition.

Business result:

- Existing successful outcome is reused or duplicate is rejected.

User-visible result:

- User sees final confirmed state.

Recovery behavior:

- Review if outcome cannot be determined.

## Conflict

Trigger:

- Two users update the same loan or record conflicting payment/state.

Expected behavior:

- Preserve financially safe outcome.

Business result:

- Non-conflicting updates may survive; conflicting truth enters Needs Review.

User-visible result:

- User sees conflict/review message.

Recovery behavior:

- Authorized user reviews and resolves.

## Invalid Payment Source

Trigger:

- User records repayment from inactive, missing, closed, card, or non-household source.

Expected behavior:

- Reject repayment record.

Business result:

- No ledger movement and no loan progress.

User-visible result:

- Source validation error.

Recovery behavior:

- Choose valid source or review loan.

## Final Payment Leaves Residual

Trigger:

- Payment appears final but recorded remaining principal is not zero or settlement is uncertain.

Expected behavior:

- Do not auto-complete unless business rules are satisfied.

Business result:

- Loan remains Active or Needs Review.

User-visible result:

- User sees residual/uncertainty warning.

Recovery behavior:

- Correct facts, record additional repayment, or confirm settlement.

