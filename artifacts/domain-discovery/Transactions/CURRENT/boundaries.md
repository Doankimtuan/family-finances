# Boundaries

## What Belongs Here

- Real money movement events.
- Transaction direction, amount, currency, date, account, note, counterparty, category, and mapping references.
- Activity history.
- Refund, reversal, correction, and audit relationships.
- Evidence used by other domains.
- Unresolved transaction facts that require household review.

## What Belongs In Another Domain

- Account identity, account type, account ownership, and balance container reality: Accounts.
- Credit limit, statement cycle, due date, billing month, and card obligations: Cards.
- Loan principal, schedule, interest, repayment plan, and liability status: Loans.
- Term deposits, maturity, withdrawal, and savings product lifecycle: Savings.
- Jar capacity, allocation rules, month ritual, and virtual intent: Plan.
- Review queues, approvals, reminders, and household decisions about unresolved items: Inbox.
- Trends, warnings, health interpretation, and coaching: Health.
- Household membership, permissions, roles, and visibility: Tenancy.
- Provider connection, credentials, and sync reliability: Integration / Platform.

## Where Integrations Happen

- Accounts provide the real container for every transaction.
- Inbox receives unresolved or decision-worthy transaction facts.
- Plan consumes categorized or mapped transaction facts as virtual context.
- Cards may interpret card transactions in statement and repayment context.
- Savings and Loans may generate or consume transactions when real money moves.
- Health consumes transaction patterns without owning the underlying facts.
- External providers may supply read-only activity or enrichment.

## Where Ownership Changes

- A payment becomes a Transaction when real money movement is recorded as fact.
- A Transaction becomes Plan context only when mapped to virtual intention.
- A Transaction becomes an Inbox item when household review is needed.
- A Transaction becomes Health input only after it is used for interpretation.
- A provider record becomes product-owned transaction data only after accepted into the household record.
