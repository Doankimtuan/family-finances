# Domain Analysis — Card Leaks & Boundaries

## Philosophy alignment

Domain philosophy (`artifacts/domain-philosophy/CURRENT/domains/installments.md`) already describes installments as loans, store financing, and BNPL — not revolving card products. Implementation incorrectly framed EMI under Cards (`card_label`, `card_account_id`, convert-from-billing).

## Card concept inventory (removed from Loan)

| Concept | Where it leaked | Disposition |
|---------|-----------------|-------------|
| `card_label` / `cardLabel` | Schema, types, create form, list subtitle | → `lender` |
| `card_account_id` | `installment_plans`, convert command, card detail query | Dropped from loans |
| `source_billing_item_id` / `source_transaction_id` | Convert path | Dropped |
| `convertToInstallment` | Ledger command + account UI | Removed from Loan/Card surfaces |
| `linkedInstallments` | Credit card detail | Removed |
| Route `/money/cards`, i18n “Thẻ / Trả góp” | App path + messages | → `/money/loans`, Loan / Installment |
| Empty-state “card installment” | Cards page | Loan copy |
| Counter-only payment (no Transaction) | `record_installment_payment` | Replaced by transactional payment |

## Kept in Card BC (unchanged)

- `AccountType.CREDIT_CARD`, `credit_card_settings`
- `card_billing_months` / `card_billing_items`
- `CardBillingItemType.INSTALLMENT` (statement line type — not Loan entity)
- Settle, cashback, utilization, calendar `CARD_DUE`

## Loan vs Debts vs Card

```
Loan          → scheduled obligation (principal, monthly payment, next due, interest)
Debts         → open-ended liability (creditor, remaining) — no schedule migration
Card          → revolving instrument — future home of Card Installment
```

Friend/Family loans **with** a repayment schedule belong in Loan (`loan_type` family/friend). Schedule-less borrowing stays in Debts.

## Required Loan concepts

- Obligation, borrowed principal, remaining principal, interest rate
- Lender, loan type, repayment frequency, monthly payment, next payment date
- Payment history (`LoanPayment`: amount, principalPaid, interestPaid, paidAt, transactionId)
- Completion when remaining principal ≤ 0 → ReviewItem (BR-11)
- Early payoff / variable payment amount allowed
- Loan never changes Account ownership, Card limits, or Card utilization
