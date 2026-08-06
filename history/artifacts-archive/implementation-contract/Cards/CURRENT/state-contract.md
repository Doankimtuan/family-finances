# State Contract

## Business States

| State | Meaning |
|-------|---------|
| Candidate | Potential card not yet recorded. |
| Draft | Card facts are being gathered; not active. |
| Active | Card is valid for current household tracking. |
| Needs Review | Card, statement, payment, refund, fee, or responsibility truth is uncertain. |
| Billing Open | Billing period has known obligation and remaining due. |
| Billing Partially Paid | Billing period has recognized payment but remaining due remains. |
| Billing Settled | Billing period is fully paid, credited, or corrected to zero due by household record. |
| Closed | Card relationship is no longer active by household understanding. |
| Expired | Card is no longer valid due to expiry. |
| Replaced | Card credential changed while history remains connected. |
| Archived | Card is removed from current use but remains historical. |
| Abandoned Draft | Draft was not completed. |
| Invalid Attempt | Attempted action violates contract; card remains in previous valid state. |

## Allowed Transitions

| From | To | Allowed when |
|------|----|--------------|
| Candidate | Draft | User starts card setup. |
| Draft | Active | Required facts pass validation. |
| Draft | Abandoned Draft | User abandons setup before activation. |
| Active | Needs Review | Any card truth becomes uncertain. |
| Needs Review | Active | Review resolves active card truth. |
| Active | Closed | User closes active card. |
| Active | Expired | Card is past validity and not treated as replaced. |
| Active | Replaced | Replacement preserves relationship/history. |
| Active | Archived | User removes active card from current view with understood consequence. |
| Closed | Archived | Closed card no longer needed in current view. |
| Expired | Archived | Expired card no longer needed in current view. |
| Replaced | Archived | Replaced prior identity no longer needed in current view. |
| Archived | Needs Review | Historical truth is questioned. |
| Active | Billing Open | Statement obligation exists. |
| Billing Open | Billing Partially Paid | Payment less than remaining due is recorded. |
| Billing Open | Billing Settled | Remaining due reaches zero. |
| Billing Partially Paid | Billing Settled | Remaining due reaches zero. |
| Billing Open | Needs Review | Statement truth is uncertain. |
| Billing Partially Paid | Needs Review | Payment or consequence is uncertain. |
| Billing Settled | Needs Review | Settlement is questioned. |
| Needs Review | Billing Open | Review confirms unpaid statement. |
| Needs Review | Billing Partially Paid | Review confirms partial payment. |
| Needs Review | Billing Settled | Review confirms settlement. |

## Forbidden Transitions

| From | To | Reason |
|------|----|--------|
| Candidate | Active | Required facts must be gathered first. |
| Draft | Billing Open | Draft cannot carry active billing obligation. |
| Closed | Active | Closed card requires review before reactivation interpretation. |
| Expired | Active | Expired card requires review or replacement interpretation. |
| Archived | Active | Archived card must return through Needs Review. |
| Billing Settled | Billing Open | Settled period must pass through Needs Review before reopening. |
| Any | Real cash balance | Credit capacity is not cash. |
| Any | Loan by default | Revolving card debt is not Loan by default. |
| Any | Health-mutated state | Health cannot mutate Cards. |
| Any | Automatic payment executed | Cards cannot execute repayment automatically. |

## Recovery Transitions

| Situation | Recovery transition |
|-----------|---------------------|
| Closed card has remaining due | Closed -> Needs Review -> Active or Closed |
| Expired card receives refund | Expired -> Needs Review -> Expired or Archived |
| Archived card has unresolved truth | Archived -> Needs Review -> Active or Archived |
| Settled period later shows charge | Billing Settled -> Needs Review -> Billing Open or Billing Settled |
| Payment truth unclear | Billing Open or Billing Partially Paid or Billing Settled -> Needs Review |
| Wrong date or limit found | Active -> Needs Review -> Active |

## Terminal States

Abandoned Draft:

- Terminal for incomplete setup.
- No financial history.

Archived:

- Terminal for current-use visibility.
- Can recover to Needs Review.

Invalid Attempt:

- Terminal for attempted action only.
- Underlying card remains in previous valid state.
