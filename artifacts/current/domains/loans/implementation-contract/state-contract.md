# State Contract

## Business States

| State | Meaning | Active for repayment? | Historical meaning? |
|-------|---------|-----------------------|---------------------|
| Candidate | Possible obligation not yet recorded. | No | No |
| Draft | Loan facts are being gathered. | No | No |
| Active | Loan is valid for current repayment tracking. | Yes | Yes |
| Needs Review | Truth, payment, balance, or state is uncertain. | Conditional | Yes |
| Completed | Household considers obligation settled. | No | Yes |
| Cancelled | Loan did not become or no longer represents active obligation without completion. | No | Yes if it had household meaning |
| Defaulted | Loan has materially failed normal repayment. | No ordinary repayment | Yes |
| Archived | Loan is removed from current-use view but preserved. | No | Yes |
| Abandoned Draft | Draft was not activated. | No | No |
| Invalid Attempt | Rejected action result; loan remains unchanged. | Not applicable | Not applicable |

## Allowed Transitions

| From | To | Trigger |
|------|----|---------|
| Candidate | Draft | User begins creation. |
| Draft | Active | Create Loan succeeds. |
| Draft | Abandoned Draft | Abandon Draft succeeds. |
| Active | Needs Review | Review or action finds uncertainty. |
| Needs Review | Active | Review/correction confirms active obligation. |
| Active | Completed | Mark Completed or final repayment succeeds. |
| Needs Review | Completed | Review confirms settlement. |
| Active | Cancelled | Cancel Loan succeeds. |
| Needs Review | Cancelled | Review confirms cancellation. |
| Active | Defaulted | Mark Defaulted succeeds. |
| Needs Review | Defaulted | Review confirms default. |
| Completed | Archived | Archive Loan succeeds. |
| Cancelled | Archived | Archive Loan succeeds. |
| Defaulted | Archived | Archive Loan succeeds. |
| Archived | Needs Review | Recovery begins. |
| Completed | Needs Review | Recovery begins. |
| Cancelled | Needs Review | Recovery begins. |
| Defaulted | Needs Review | Recovery begins. |

## Forbidden Transitions

| From | To | Reason |
|------|----|--------|
| Candidate | Active | Required facts must be validated first. |
| Draft | Completed | Draft was never active. |
| Draft | Archived | Draft has no active history. |
| Completed | Active | Must pass through Needs Review. |
| Cancelled | Active | Must pass through Needs Review. |
| Defaulted | Completed | Must pass through Needs Review. |
| Archived | Active | Must pass through Needs Review. |
| Any | Credit-card state | Cards owns revolving credit. |
| Any | Planning/Jar state | Planning owns virtual intentions. |
| Any | Health-mutated state | Health is read-only. |

## Terminal States

Abandoned Draft:

- Terminal for the draft.
- No financial history is created.

Archived:

- Terminal for current-use view.
- Can enter Needs Review if historical truth is questioned.

Invalid Attempt:

- Terminal for attempted action only.
- Underlying loan state does not change.

## Recovery Transitions

| Situation | Required path |
|-----------|---------------|
| Completed incorrectly | Completed → Needs Review → Active or Completed |
| Cancelled incorrectly | Cancelled → Needs Review → Active or Cancelled |
| Defaulted later settled | Defaulted → Needs Review → Completed |
| Archived but still active | Archived → Needs Review → Active |
| Payment mismatch resolved | Needs Review → Active or Completed |

