# Current Product Gap

This document compares the discovered real-world Cards domain with the current product artifacts and code. It lists factual gaps only and does not propose solutions.

## Current Product Observations

- The current product includes `credit_card` as an account type.
- Credit-card accounts have settings for credit limit, statement day, due day, and optional linked bank account.
- The current database includes `credit_card_settings`, `card_billing_months`, and `card_billing_items`.
- Card billing months store billing month, statement amount, paid amount, due date, and status.
- Card billing month statuses include open, partial, and settled.
- Card billing items store transaction linkage, installment plan linkage, description, amount, fee amount, item type, paid flag, and converted-to-installment flag.
- Card billing item types include standard and installment.
- Credit-card summaries compute outstanding, available credit, utilization percentage, next due remaining, and next due date.
- Credit-card spending checks whether a new expense would exceed the credit limit.
- Card transactions are assigned into billing months based on transaction date and statement day.
- Card repayments settle open months oldest-first.
- Card cashback is recorded as income on the credit-card account and routed to the latest unpaid cycle.
- The real-position query excludes credit cards from liquid account balances.
- Household calendar projection reads card due dates and next due amounts.
- `/money/cards` and `/money/cards/[id]` exist as compatibility redirects to `/money/loans` routes.
- Product-definition artifacts identify cards under Money and include a card installment journey.

## Factual Gaps Against Real-World Domain

| Real-world concern | Current product evidence | Factual gap |
|--------------------|--------------------------|-------------|
| Debit, credit, and prepaid cards have distinct financial behavior. | Current card-specific behavior is centered on `credit_card`; debit cards appear as access to account types. | No factual evidence of standalone debit-card or prepaid-card instrument records. |
| Card identity includes issuer, network, masked PAN, BIN/IIN, expiry, physical/virtual form, and status. | Credit-card settings store account id, limit, statement day, due day, and linked account. | No factual evidence of issuer, network, mask, expiry, card form, or card status fields. |
| Primary and supplementary cardholders may differ. | Household membership exists; card settings are account-level. | No factual evidence of supplementary-cardholder attribution or primary-cardholder responsibility tracking. |
| Real card lifecycle includes activation, block, unblock, replacement, expiry, revocation, and closure. | Account archive exists; card billing records persist. | No factual evidence of card-specific lifecycle states beyond account archive and billing settlement states. |
| Real transactions may be authorized, held, pending, posted, reversed, or settled. | Current billing item assignment happens after a cleared transaction is recorded. | No factual evidence of authorization holds, pending card transactions, capture differences, or posting date separate from transaction date. |
| Issuer statements may differ from household-computed billing months. | Current billing month is derived by app-layer cycle math. | No factual evidence of provider-issued statement import, statement id, statement date confirmation, or provider-confirmed balance. |
| Fees and interest are first-class card consequences. | Billing items include `fee_amount`; cashback exists. | No factual evidence of interest calculation, late fee, annual fee, cash-advance fee, FX markup, or fee category semantics. |
| Card repayment may have provider-specific allocation order. | Current settlement applies FIFO across open months. | No factual evidence of issuer-specific payment allocation priority. |
| Minimum payment differs from statement balance. | Billing month stores statement amount and paid amount. | No factual evidence of minimum payment amount, required payment, or delinquency threshold. |
| Refunds, reversals, and disputes follow card-specific lifecycles. | General refund and correction policies exist; cashback can credit billing cycles. | No factual evidence of card-specific refund timing, reversal, dispute, chargeback, or provisional credit states. |
| Cash advances behave differently from purchases. | Billing item type supports standard and installment. | No factual evidence of cash advance as a distinct card transaction type. |
| Cross-border card usage involves FX and issuer conversion. | Product generally uses default currency patterns. | No factual evidence of card transaction original currency, settlement currency, FX rate, or FX markup. |
| Rewards may include points, miles, vouchers, waivers, and cashback reversal. | Cashback can be manually recorded. | No factual evidence of points, miles, reward expiry, annual-fee waiver conditions, or reward reversal. |
| Card replacement can preserve old history while changing card credentials. | Account identity is stable. | No factual evidence of multiple card credentials under one card account. |
| Card data is highly sensitive. | No full card credential storage was observed in inspected card code. | No factual evidence of an explicit card-data sensitivity policy inside this domain artifact set. |

## Product-Definition Alignment Observations

- Current product is materially aligned with the credit-card billing-cycle concept.
- Current product already separates credit-card outstanding from liquid bank balance in real-position logic.
- Current product covers credit limit, statement day, due day, billing months, billing items, repayment, cashback, utilization, and due-date projection.
- The main factual gaps are around non-credit-card card types, provider-confirmed statement data, card identity, card lifecycle states, supplementary-cardholder attribution, pending/authorization states, minimum payment, issuer-specific fees and interest, dispute lifecycle, FX, rewards, and card credential replacement.

No implementation changes are proposed in this discovery phase.
