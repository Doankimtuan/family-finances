# Money Flow Validation

## Result

PASS WITH RECOMMENDATIONS

Every VND can be tracked if implementation preserves the documented event boundaries.

## Validated End-to-End Flow

```text
External income
-> Account recorded position increases
-> Transaction records income fact
-> Planning allocates virtual capacity under BR-04
-> Category/Jar mapping explains actual spending under BR-12
-> Product domain records savings, loan, card, or investment meaning when applicable
-> Inbox captures required human decisions
-> Month Ritual locks final plan interpretation
-> Health reads locked and current facts without writing
```

## No Duplication

Money is not duplicated when:

- Transfers between owned accounts are neutral to total household position.
- Credit-card purchases create obligations, not cash outflow from a bank account.
- Card repayment is distinct from original card purchase.
- Loan repayment is both a real ledger outflow and a liability-progress fact, with ownership split between Transactions and Loans.
- Savings expected interest remains non-ledger until provider-confirmed or manually confirmed.
- Investment market value changes do not create cash transactions.
- Goals and jars never become account balances.

## No Disappearing Money

Money does not disappear when:

- Every real movement is owned by Transactions and grounded in an Account or product source.
- Savings funding, maturity, withdrawal, settlement failure, and correction have explicit ledger-impact rules.
- Refunds and corrections preserve linked audit history.
- Month Lock freezes planning interpretation, not transaction history.

## No Impossible Money

Impossible money is blocked by:

- BR-01: jars and plans never move real funds.
- Credit limit and available credit are not treated as owned money.
- Expected income, expected interest, recurring expectations, reminders, Health factors, and AI explanations cannot create balances.
- Inbox acknowledgements do not certify payments, withdrawals, renewals, or transfers.

## Required Safeguard

Implementation must provide a cross-domain money invariant test:

```text
household real position =
  eligible account cash
  + provider-held savings value when recognized as product value
  + confirmed investment cash proceeds only when settled
  - recorded liabilities where modeled
```

The exact report formula may vary by surface, but every amount must be traceable to one owner and one source event.

