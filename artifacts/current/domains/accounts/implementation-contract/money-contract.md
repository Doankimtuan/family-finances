# Money Contract

## Universal Money Rules

- Accounts do not execute money movement.
- Transactions own ledger movement.
- Planning owns intention and never changes account balance.
- Inbox acknowledgment never changes money.
- Health never writes account data.
- Credit limit is never owned money.
- Transfer between owned accounts is not income or expense.

## Action Money Effects

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
|--------|--------------|-------------------|---------------|------------------|-------------------|------------------|
| Create Account | None | None | None from creation alone | None | Real position may read new eligible account | Draft invalid, account rejected |
| Edit Account | None | None | None from metadata edit | None | Readers see updated account facts | Invalid edit rejected |
| Review Account | None | None | None | None | Confidence/state may be read | Review cannot complete |
| Reconcile / Manual Balance Adjustment | Real account record discrepancy | Same account record | Only if represented as Real Ledger trust repair by owning money path | None | Real position reflects explainable record after success | Discrepancy not explainable |
| Record Transaction Against Account | Source account for expense, external source for income | Destination account for income, external destination for expense | Owned by Transactions | None | Account recorded position reflects transaction | Account inactive/invalid |
| Recognize Transfer | Source account | Destination account | Owned by Transactions as neutral transfer | None | Source/destination and real position update | Unclear account pair |
| Mark Historical / Archive | None | None | None | None | Active account readers exclude or demote account according to state | Unresolved active meaning |
| Close Account | None | None | None from closure alone | None | Readers treat account as closed/historical | Closure unclear |
| Restore Account | None | None | None | None | Active readers include restored account if eligible | Duplicate or unclear identity |
| Abandon Draft | None | None | None | None | No financial readers affected | Account already active |
| Export Account Records | None | None | None | None | Export reads account facts | Export fails |
| Reject Invalid Attempt | None | None | None | None | Previous state remains visible | Not applicable |

## Real Position Rules

- Active eligible owned-money accounts contribute to real position.
- Historical and Closed accounts do not contribute to active real position unless explicitly restored.
- Credit obligations and credit limits do not inflate owned-money real position.
- Needs Review accounts may be visible but must not be treated as high-confidence.

## Transfer Rules

- Source and destination must be distinct Active household-relevant accounts.
- Transfer decreases source and increases destination.
- Household total remains unchanged except fees or transaction-owned effects.
- Transfer creates no jar, goal, or planning update.

## No Ambiguous Money Movement

If the system cannot determine whether an action is:

- Income.
- Expense.
- Transfer.
- Adjustment.
- Non-money metadata change.

Then the action must not change recorded money until reviewed by the owning domain.

