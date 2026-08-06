# Validation Contract

## Required Fields

Create Card:

- Issuer.
- Card type.
- For credit card: credit limit, statement date, due date.

Record Purchase:

- Card.
- Amount.
- Date.
- Purchase meaning.

Record Statement:

- Credit card.
- Billing period.
- Statement amount.
- Due date.

Record Repayment:

- Credit card.
- Real money source.
- Amount.
- Date.

Record Refund, Fee, Interest, Cashback:

- Card.
- Amount.
- Date or known timing.
- Broad business meaning.

Close or Archive:

- Card.
- Closure/archive meaning.
- Unresolved obligation acknowledgement when applicable.

## Business Validation

- Card must be household-relevant.
- Issuer must be identifiable.
- Card type must be debit, credit, or prepaid.
- Credit card must not be treated as real money.
- Revolving card debt must not be treated as Loan by default.
- Card-origin installment must not duplicate Loan obligation.
- Historical meaning must not be silently rewritten.

## Financial Validation

- Money amounts must be positive unless explicitly representing zero due or non-money state.
- Credit limit must be non-negative.
- Available credit must not increase real money totals.
- Repayment must have real money source.
- Refund is not ordinary income by default.
- Cashback is not real income unless real money enters a real account.
- Partial repayment must leave remaining due visible.
- Unknown fees, interest, provider formulas, and minimum-payment consequences must not be invented.

## Ownership Validation

- Actor must be active household member for mutations.
- Viewer is read-only.
- Background Worker can only create approved attention items or deterministic non-money association.
- Health cannot mutate card state.
- Together controls household access policy.

## State Validation

- Action must be allowed from current state.
- Draft cannot have billing obligation.
- Closed, Expired, Archived, or Abandoned Draft cards cannot receive new normal purchases.
- Archived and closed records must recover through Needs Review before active interpretation.
- Billing Settled cannot reopen without Needs Review.

## Cross-Domain Validation

- Accounts source must exist and be eligible for real repayment or debit-card spending.
- Transactions owns real money movement.
- Planning cannot reduce obligation.
- Inbox cannot move money.
- Health cannot write card data.
- Categories can classify purchases but cannot change obligation.
- Loans cannot automatically absorb revolving card balances.
