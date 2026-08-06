# Business Boundaries

## What Belongs Here

- Card identity and issuer recognition.
- Credit-card obligation visibility.
- Credit limit and available credit as borrowing capacity.
- Statement date, due date, statement balance, paid amount, and remaining due amount.
- Billing-period association.
- Card purchase and repayment distinction.
- Card refund, broad fee, interest, cashback, and statement-credit awareness.
- Card-origin installment awareness without duplicating Loans.
- Lightweight card status.
- Card history preservation.
- Read-only card risk signals for Health.

## What Belongs Elsewhere

- Real money containers belong to Accounts.
- Real money movement belongs to Transactions.
- Virtual repayment preparation belongs to Planning, Jars, or Goals.
- Scheduled non-card loans belong to Loans.
- Savings products and withdrawals belong to Savings.
- Review queues and user attention belong to Inbox.
- Financial risk interpretation belongs to Health as read-only.
- Purchase classification belongs to Categories.
- Household permissions and membership belong to Together.

## What Cards Must Never Own

- Real cash balance.
- Available credit as household money.
- Automatic repayment execution.
- Health mutation.
- Provider-grade statement truth without approved provider confirmation.
- Loan amortization for non-card loans.
- Goal allocation.
- Partner privacy or permission policy.
- Financial advice or reward optimization.

## Responsibility Leakage Prevention

- A credit-card purchase may affect Transactions, but Cards owns only card obligation meaning.
- A repayment may affect Accounts and Transactions, but Cards owns only reduction of card obligation.
- A future payment plan may affect Planning, but Cards owns only current card facts and card-origin obligation awareness.
- Health may interpret Cards, but Cards remains the operational owner of card state.
