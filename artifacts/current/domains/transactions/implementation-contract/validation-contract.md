# Validation Contract

## Required Fields

Record income:

- Household context.
- Actor.
- Destination account.
- Amount.
- Currency.
- Date.
- Direction: income.

Record expense:

- Household context.
- Actor.
- Source account.
- Amount.
- Currency.
- Date.
- Direction: expense.

Record owned-account transfer:

- Household context.
- Actor.
- Source account.
- Destination account.
- Amount.
- Currency.
- Date.
- Direction/interpretation: transfer.

Refund:

- Household context.
- Actor.
- Refund account.
- Amount.
- Currency.
- Date.
- Original transaction when known.

Correction:

- Household context.
- Actor.
- Original transaction.
- Correction reason.
- Corrected facts.

Reversal:

- Household context.
- Actor.
- Original transaction.
- Reversal reason.

## Business Validation

- Action must map to a known contract action.
- Transaction must represent real money movement unless action is read-only or meaning-only.
- Meaning-only changes cannot change financial anchors.
- Review resolution cannot hide unresolved financial uncertainty.
- Archive cannot delete history.

## Financial Validation

- Amount must be positive for money movement.
- Currency must be within current household scope.
- Date must be valid.
- Income increases real position unless later classified as transfer/refund/reimbursement context.
- Expense decreases real position unless corrected/reversed/refunded.
- Transfer is neutral to household total by default.
- Refund linked to original expense is not ordinary income.
- Correction/reversal must preserve audit story.

## Ownership Validation

- Actor must belong to household or be authorized system actor.
- Account must belong to household.
- Transfer source and destination must both be household-owned for neutral treatment.
- Category/planning reference must belong to household or accepted shared catalog.

## State Validation

- Candidate can become Recorded only with valid facts.
- Needs Review can resolve only through valid household decision.
- Corrected and Reversed states cannot become Candidate.
- Reversed cannot become ordinary Resolved.
- Historical cannot be active mutation target unless a valid recovery route is defined.

## Cross-Domain Validation

- Accounts must confirm active real container context.
- Categories must confirm valid category meaning.
- Planning must treat jar/reference as virtual only.
- Inbox must avoid duplicate active review item.
- Health must remain read-only.
- Cards, Loans, Savings, and Goals may consume facts but cannot rewrite transaction truth.
- Together may support collaboration but cannot judge or mutate transaction facts.
