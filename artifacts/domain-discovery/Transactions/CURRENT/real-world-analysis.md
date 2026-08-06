# Real-World Analysis

## Vietnam Context

Vietnamese households commonly use a mixed transaction environment:

- Bank account transfers through mobile banking.
- VietQR / Napas QR payments at merchants and between people.
- E-wallet transactions through providers such as MoMo, ZaloPay, ShopeePay, and Viettel Money.
- Cash spending for markets, street food, parking, tips, household help, small vendors, and family support.
- Debit card and credit card spending at larger merchants.
- Salary and allowance income into a bank account.
- Family transfers between spouses, parents, siblings, and relatives.
- Bill payments for rent, electricity, water, mobile, internet, school, insurance, and subscriptions.
- Refunds from merchants, e-commerce platforms, travel providers, banks, and wallets.

Many transactions are visible in provider apps, but the household's full activity is scattered across several places.

## Common Practices

- People check recent bank or wallet activity after a payment.
- One partner often pays daily expenses while another pays rent, school, loan, or savings obligations.
- Cash expenses are often reconstructed from memory.
- QR transfer descriptions may be meaningful, blank, or vendor-specific.
- E-commerce purchases may appear as wallet payments, bank transfers, card payments, COD cash, or platform refunds.
- A single family shopping trip can mix groceries, baby supplies, pharmacy, household goods, and personal items.
- Credit card purchases are often understood twice: once as the merchant expense and later as a card bill payment.

## Variations

- Manual household tracking: notebook, spreadsheet, chat messages, or mental tracking.
- Bank-first tracking: one main account is treated as the source of truth.
- Wallet-first tracking: daily discretionary spending happens through e-wallets.
- Cash-first tracking: frequent small spending is invisible unless manually recorded.
- Couple-shared tracking: partners review together.
- One-person stewardship: one partner records and interprets most activity.
- Business/personal mixing: self-employed households may have weak separation.

## Terminology

Common real-world terms include:

- Transaction.
- Payment.
- Transfer.
- Receipt.
- Charge.
- Debit.
- Credit.
- Refund.
- Reversal.
- Adjustment.
- Fee.
- Pending payment.
- Posted transaction.
- Statement line.
- Merchant.
- Counterparty.
- Description / memo / note.

Vietnamese users may also say "giao dịch", "chuyển khoản", "thanh toán", "hoàn tiền", "phí", "nội dung chuyển khoản", and "sao kê".

## Industry Standards

- Bank statements are chronological transaction lists.
- Card networks distinguish authorization, clearing, settlement, refunds, reversals, chargebacks, and fees.
- Accounting treats transactions as events that should remain auditable.
- Consumer finance apps commonly support transaction search, categorization, review queues, and provider import.
- Open Banking-style ecosystems normalize imported transaction data, but availability differs by country and institution.

## Important Concepts

- Direction: whether money enters or leaves a real account.
- Amount: positive magnitude plus explicit direction, or signed amount depending on system.
- Transaction date: the date used for household review.
- Posting date: the date the financial institution records the final line.
- Authorization date: the date a card hold begins.
- Settlement: final confirmation between financial institutions.
- Counterparty: merchant, employer, person, lender, provider, or platform.
- Category: household meaning of the event.
- Transfer: movement between the household's own containers.
- Refund: money returned because a prior payment is partially or fully undone.
- Correction: a record-level fix when the household entered or received incorrect information.
- Reconciliation: comparing the household record with bank, wallet, cash, or statement reality.

## International Differences That Affect Product Design

- Some countries have mature bank feed aggregation; Vietnam access is more fragmented.
- Card pending/posted behavior is more visible in some banking markets than others.
- Cash usage remains more important in Vietnam than in highly card-centric markets.
- Tax reporting needs differ by country, but ordinary household transaction tracking should not become business accounting by default.
