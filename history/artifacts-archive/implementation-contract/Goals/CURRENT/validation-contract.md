# Validation Contract

## Required Fields

| Action | Required fields |
| --- | --- |
| Create Goal | Name or purpose, target amount. |
| Edit Goal | Existing goal, valid editable field. |
| Add Contribution | Existing goal, positive amount. |
| Pause Goal | Existing Active goal. |
| Resume Goal | Existing Paused goal. |
| Complete Goal | Existing Active or Paused goal. |
| Cancel Goal | Existing Active or Paused goal. |
| Associate Savings Context | Existing goal, readable savings product. |
| Review Evidence | Existing goal, identified source or explicit missing source. |

## Business Validation

- Goal must represent a future household purpose.
- Target amount must be an estimate, not a guarantee.
- Target date must be household timing.
- Note must be simple context, not advice.
- Completion must be intention completion only.
- Cancellation must end pursuit only.

## Financial Validation

- Target amount must be positive.
- Contribution amount must be positive.
- Progress must never be labeled as real balance.
- Contribution must never be labeled as transfer unless Transactions owns the movement.
- Overfunded progress must not imply available surplus.
- Missing evidence must remain uncertain.

## Ownership Validation

- Actor must belong to the household.
- Actor must have permission for mutation.
- Viewer can read only.
- Background Worker and System can perform read-only evaluation only.

## State Validation

- Create starts Active.
- Active can edit, contribute, pause, complete, cancel.
- Paused can edit, contribute, resume, complete, cancel.
- Completed is terminal for ordinary actions.
- Cancelled is terminal for ordinary actions.
- Invalid Attempt preserves prior state.

## Cross-Domain Validation

- Savings context must reference Savings-owned truth.
- Account evidence must remain Account-owned.
- Transaction evidence must remain Transaction-owned.
- Card pressure must remain Card-owned.
- Loan pressure must remain Loan-owned.
- Health cannot write.
- Inbox cannot move money.
- Planning lock behavior applies where current Planning rules require it.
