# Edge Cases

## Card Identity and Access

- Card expired but outstanding balance remains.
- Card replaced with a new number while historical transactions belong to the old masked number.
- Virtual card cancelled while physical card remains active.
- Physical card lost but tokenized wallet card still works, or vice versa.
- Supplementary card blocked while primary card remains active.
- Cardholder name changes.
- Card issuer rebrands, merges, or migrates products.

## Transaction Events

- Authorization approved but merchant never captures.
- Authorization amount differs from posted amount.
- Hotel, fuel, deposit, or rental hold temporarily reduces available credit.
- Transaction posts after statement close.
- Merchant splits one purchase into several charges.
- Merchant combines several purchases into one charge.
- Merchant descriptor is unclear or different from the shop name.
- Duplicate charge.
- Offline card transaction posts late.
- Subscription renews on old card token.

## Billing and Repayment

- Payment due date falls on weekend or holiday.
- Statement date changes.
- Issuer changes interest rate or fee schedule.
- User pays before statement closes.
- User pays after due date but before issuer posts late fee.
- User pays minimum amount only.
- User overpays, creating a credit balance.
- Autopay fails.
- Payment initiated from bank account but not yet posted by issuer.
- FIFO or issuer-defined payment allocation differs from household expectation.

## Refunds, Corrections, and Disputes

- Refund arrives in a later statement cycle.
- Refund posts after the card was already paid in full.
- Refund goes to closed or replaced card.
- Partial refund.
- Merchant cancellation before posting.
- Chargeback creates provisional credit that can be reversed.
- Dispute succeeds and interest or fees are refunded.
- Dispute fails and obligation remains.

## Fees, Interest, and Rewards

- Annual fee waived only after spending threshold.
- Cashback reversed after refund.
- Reward points expire.
- Foreign-currency amount changes between authorization and posting.
- Cash advance creates immediate interest or fee.
- Installment fee is charged separately from purchase amount.
- Promotional zero-percent installment ends or is violated.
- Late fee and interest appear in the next cycle.

## Missing or Unexpected Information

- Statement unavailable.
- User knows only last four digits.
- Credit limit unknown.
- Due date unknown or changed.
- Missing supplementary-card identifier.
- Provider data delayed.
- Imported transaction lacks merchant category.
- Household member records repayment but not original purchase.
- Household member records purchase but not repayment.

No solutions are proposed in this discovery phase.
