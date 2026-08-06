# State Machine

## Business States

| State | Meaning |
|-------|---------|
| Candidate | Borrowing obligation the household may track. Not yet a loan record. |
| Draft | Loan facts are being gathered. Not active. |
| Active | Loan is valid for current household repayment tracking. |
| Needs Review | Loan truth, payment status, balance, or state is uncertain. |
| Completed | Household considers obligation fully repaid or settled. |
| Cancelled | Loan did not become or no longer represents a real active obligation without repayment completion. |
| Defaulted | Loan has materially failed normal repayment behavior. |
| Archived | Loan is no longer active in current use but remains historical. |
| Abandoned Draft | Draft was not completed. |
| Invalid Attempt | Attempted action violates business rules; the loan remains in previous valid state. |

## Allowed Transitions

| From | To | Allowed when |
|------|----|--------------|
| Candidate | Draft | Household chooses to record the obligation. |
| Draft | Active | Required loan facts are valid. |
| Draft | Abandoned Draft | Household stops before activation. |
| Active | Needs Review | Truth, payment, schedule, or provider match is uncertain. |
| Needs Review | Active | Uncertainty is resolved and obligation remains active. |
| Active | Completed | Obligation is considered fully repaid or settled. |
| Needs Review | Completed | Uncertainty resolves to settled obligation. |
| Active | Cancelled | Obligation did not become real or is voided without repayment completion. |
| Needs Review | Cancelled | Uncertainty resolves to cancellation. |
| Active | Defaulted | Normal repayment has materially failed. |
| Needs Review | Defaulted | Uncertainty resolves to default. |
| Completed | Archived | Household no longer needs it in current view. |
| Cancelled | Archived | Household no longer needs it in current view. |
| Defaulted | Archived | Household no longer needs it in current view while preserving history. |
| Archived | Needs Review | Historical record is questioned or found wrong. |

## Forbidden Transitions

| From | To | Reason |
|------|----|--------|
| Candidate | Active | Required business facts must be established first. |
| Draft | Completed | A non-active draft cannot be completed. |
| Completed | Active | Completion cannot be undone without review. |
| Cancelled | Active | Cancellation cannot be undone without review. |
| Defaulted | Completed | Defaulted loan requires review before completion interpretation. |
| Archived | Active | Archived record must return through Needs Review first. |
| Any | Credit-card revolving state | Revolving card behavior belongs to Cards. |
| Any | Planning/Jar state | Payoff intention belongs to Planning/Jars/Goals. |
| Any | Health-mutated state | Health cannot mutate loan state. |

## Recovery Transitions

| Situation | Recovery transition |
|-----------|---------------------|
| Loan completed by mistake | Completed → Needs Review → Active or Completed |
| Cancelled loan later proves active | Cancelled → Needs Review → Active |
| Archived loan has unresolved obligation | Archived → Needs Review → Active |
| Payment mismatch is resolved | Needs Review → Active or Completed |
| Defaulted loan is clarified as settled | Defaulted → Needs Review → Completed |

## Terminal States

Abandoned Draft:

- Terminal for incomplete setup.
- Does not represent household financial history.

Archived:

- Terminal for current-use purposes.
- May return to Needs Review if historical truth is questioned.

Invalid Attempt:

- Terminal for the attempted action only.
- The loan itself remains in its previous valid state.

