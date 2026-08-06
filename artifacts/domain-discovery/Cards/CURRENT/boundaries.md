# Boundaries

## What Belongs Here

- Card instrument identity.
- Card type and role.
- Credit-card limit, available credit, outstanding amount, statement cycle, due date, and repayment status.
- Card-specific transaction lifecycle: authorization, posting, statementing, refund, chargeback, fee, interest, and reward.
- Supplementary-card responsibility.
- Card closure, expiry, blocking, replacement, and revocation as card lifecycle facts.
- Card repayment obligation as a card-specific liability.

## What Belongs in Another Domain

- Accounts: bank payment accounts, cash accounts, e-wallet balances, savings accounts, and other real-money containers.
- Transactions: general household income and expense events, categorization, notes, corrections, and audit trail.
- Loans: scheduled non-card loans, amortization, principal, interest schedules, and long-term lender obligations.
- Debts: informal owed money or non-card liabilities that do not operate as card instruments.
- Jars: household budget allocation and virtual planning containers.
- Planning: calendar projection, cash-flow forecast, and future payment awareness.
- Inbox: user decisions, review items, reminders, and resolution workflows.
- Health: read-only analysis of card usage, utilization, interest burden, and repayment behavior.
- Tenancy: household membership and permissions.

## Where Integrations Happen

- Accounts supplies linked bank accounts for debit funding and credit-card repayment.
- Transactions supplies posted card purchases, refunds, fees, cashback, and repayment transactions.
- Planning reads statement due dates and expected repayments.
- Inbox may receive card-related review items or reminders.
- Health reads card summaries as financial signals.
- External providers may supply issuer data, statements, merchant metadata, and payment status.

## Where Ownership Changes

- Merchant owns sale/refund initiation until routed through acquirer.
- Acquirer owns merchant-side card acceptance and settlement relationship.
- Network owns routing and scheme rules.
- Issuer owns card account terms, authorization, billing, fees, interest, credit limit, and provider-confirmed statement.
- Household system owns only the household's record, interpretation, and planning view unless provider-confirmed data is explicitly imported.
