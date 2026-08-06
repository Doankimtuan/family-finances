# UI Behavior Contract

This file defines required UI behavior only. It does not design UI.

## State-Based Behavior

| State | Visible actions | Hidden actions | Disabled actions | Required messaging |
|-------|-----------------|----------------|------------------|--------------------|
| Empty | Create Loan | Repay, Complete, Cancel, Archive | None | Empty state explains no loans are currently tracked. |
| Draft | Continue, Abandon Draft | Repay, Complete, Default, Archive | None | Draft is not active and has no repayment effect. |
| Active | Edit, Review, Record Payment, Estimate Payoff, Mark Completed, Cancel, Mark Defaulted | Abandon Draft | Actions requiring invalid account/source | Recorded values are not provider-confirmed unless stated. |
| Needs Review | Review, Edit, Recover, Mark Completed, Cancel, Mark Defaulted | Abandon Draft | Record payment if payment source or meaning unclear | Loan truth is uncertain. |
| Completed | View history, Archive, Recover through Review | Record Payment, Cancel directly, Default directly | Edit payment-affecting facts unless review begins | Completion is product record, not automatic lender proof. |
| Cancelled | View history, Archive, Recover through Review | Record Payment, Complete directly | Repayment actions | Cancellation is not repayment. |
| Defaulted | View history, Archive, Recover through Review | Record normal scheduled payment directly, Complete directly | Payoff estimate if not meaningful | Default is serious and not a reminder. |
| Archived | View history, Recover through Review | Record Payment, Edit active facts, Complete directly | Active actions | Archived loan remains historical. |
| Abandoned Draft | None or remove draft from active view | All loan actions | All mutation actions | No financial history exists. |

## Confirmation Dialogs

Confirmation is required for:

- Mark Completed when provider confirmation is absent.
- Cancel Loan.
- Mark Defaulted.
- Archive Loan if status is not Completed.
- Recover from Archived, Completed, Cancelled, or Defaulted.
- Record irregular repayment when amount differs from expected schedule.

## Warning Messages

Warnings must appear when:

- User sees recorded remaining principal that may not equal lender outstanding balance.
- User views early payoff estimate.
- User records payment without complete component split.
- User attempts to archive active unresolved loan.
- User attempts forbidden card, jar, Health, or automatic-payment behavior.

## Loading Behavior

- Mutating actions must show pending state.
- Duplicate submission must be prevented or treated idempotently.
- During pending state, destructive or duplicate actions must not be available.

## Empty States

- No loans tracked: explain that no current loan obligations are recorded.
- No payment history: explain no repayments have been recorded.
- No upcoming payment: explain there is no upcoming payment in current record.

## Error States

- Permission failure: explain user cannot perform action.
- Validation failure: identify missing or invalid business facts.
- State failure: explain current state does not allow action.
- Money-source failure: explain no repayment was recorded.
- Unclear truth: route to Needs Review behavior.

