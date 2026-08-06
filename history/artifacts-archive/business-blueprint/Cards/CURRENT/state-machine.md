# State Machine

## Business States

| State | Meaning |
|-------|---------|
| Candidate | Card the household may track. Not yet a card record. |
| Draft | Card facts are being gathered. Not active. |
| Active | Card is valid for current household card tracking. |
| Needs Review | Card truth, statement, payment, refund, fee, or responsibility is uncertain. |
| Billing Open | A credit-card billing period has known obligation and remaining due. |
| Billing Partially Paid | A credit-card billing period has recognized payment but remaining due remains. |
| Billing Settled | A credit-card billing period is fully paid, credited, or otherwise settled by household record. |
| Closed | Card relationship is no longer active by household understanding. |
| Expired | Card is no longer valid due to expiry. |
| Replaced | Card credential changed while history remains connected. |
| Archived | Card is no longer current in household use but remains historical. |
| Abandoned Draft | Draft was not completed. |
| Invalid Attempt | Attempted action violates business rules; card remains in previous valid state. |

## Allowed Card Transitions

| From | To | Allowed when |
|------|----|--------------|
| Candidate | Draft | Household chooses to record the card. |
| Draft | Active | Required card facts are valid. |
| Draft | Abandoned Draft | Household stops before activation. |
| Active | Needs Review | Card truth, payment, statement, or responsibility is uncertain. |
| Needs Review | Active | Uncertainty is resolved and card remains active. |
| Active | Closed | Household determines card is no longer active. |
| Active | Expired | Card is past validity and not replaced as active. |
| Active | Replaced | Card credential changes while card relationship continues. |
| Active | Archived | Household removes card from current use while preserving history. |
| Closed | Archived | Household no longer needs closed card in current view. |
| Expired | Archived | Household no longer needs expired card in current view. |
| Replaced | Archived | Prior card identity no longer needs current visibility. |
| Archived | Needs Review | Historical card truth is questioned. |

## Allowed Billing Transitions

| From | To | Allowed when |
|------|----|--------------|
| Active | Billing Open | A credit-card billing period has a recognized statement obligation. |
| Billing Open | Billing Partially Paid | A payment is recognized but remaining due remains. |
| Billing Open | Billing Settled | Full payment, credit, refund, or correction settles the period. |
| Billing Partially Paid | Billing Settled | Remaining due reaches zero by recognized payment or adjustment. |
| Billing Partially Paid | Needs Review | Payment, fee, interest, refund, or statement truth becomes uncertain. |
| Billing Open | Needs Review | Statement or obligation truth becomes uncertain. |
| Billing Settled | Needs Review | Settled interpretation is challenged. |
| Needs Review | Billing Open | Review confirms unpaid obligation. |
| Needs Review | Billing Partially Paid | Review confirms partial payment. |
| Needs Review | Billing Settled | Review confirms settlement. |

## Forbidden Transitions

| From | To | Reason |
|------|----|--------|
| Candidate | Active | Required business facts must be established first. |
| Draft | Billing Open | Inactive draft cannot have active billing obligation. |
| Closed | Active | Closed card cannot become active without review. |
| Expired | Active | Expired card cannot become active without review or replacement interpretation. |
| Archived | Active | Archived card must return through Needs Review first. |
| Billing Settled | Billing Open | Settlement cannot be undone without review. |
| Any | Real cash balance | Credit capacity is not cash and cannot become account money. |
| Any | Loan by default | Revolving card obligation is not a Loan by default. |
| Any | Health-mutated state | Health cannot mutate card state. |
| Any | Automatic payment executed | Cards cannot execute repayment automatically. |

## Recovery Transitions

| Situation | Recovery transition |
|-----------|---------------------|
| Closed card has remaining obligation | Closed -> Needs Review -> Active or Closed |
| Expired card receives refund | Expired -> Needs Review -> Expired or Archived |
| Archived card has disputed history | Archived -> Needs Review -> Archived or Active |
| Settled billing period later shows fee | Billing Settled -> Needs Review -> Billing Open or Billing Settled |
| Payment recorded but not recognized by issuer | Billing Partially Paid or Billing Settled -> Needs Review |
| Wrong due date discovered | Active -> Needs Review -> Active |

## Terminal States

Abandoned Draft:

- Terminal for incomplete setup.
- Does not represent household financial history.

Archived:

- Terminal for current-use purposes.
- May return to Needs Review if historical truth is questioned.

Invalid Attempt:

- Terminal for the attempted action only.
- The card itself remains in its previous valid state.
