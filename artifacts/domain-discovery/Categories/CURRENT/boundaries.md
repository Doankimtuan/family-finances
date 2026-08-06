# Boundaries

## What Belongs Here

Categories own:

- Category name and meaning.
- Income or expense classification kind.
- Category assignment to transactions.
- Category availability for future use.
- Category vocabulary consistency.
- Category-based filtering and summarization as classification views.
- Category-to-planning interpretation as a boundary contract, not money movement.

## What Belongs In Another Domain

| Concern | Owning domain |
| --- | --- |
| Real transaction amount, date, account, and direction | Transactions / Ledger |
| Real account balance | Accounts / Ledger |
| Payment method or payment rail | Accounts / Transactions / Provider integration |
| Merchant identity | Transactions / Provider enrichment |
| Receipt or document evidence | Transactions / Documents / Provider integration |
| Available-to-spend amount | Planning / Jars |
| Spending limits | Planning / Jars |
| Goal purpose and target | Goals |
| Card MCC, statement, fee, due date, and rewards category | Cards / Provider |
| Loan repayment schedule and liability meaning | Loans |
| Review queue and unresolved decision state | Inbox |
| Health scoring or risk interpretation | Health |
| Household membership and permissions | Together / Tenancy |

## Where Integrations Happen

Categories integrate with:

- Transactions for assignment and reporting.
- Accounts through transaction context only.
- Jars / Planning through category-to-intention mapping.
- Inbox when category meaning is missing, uncertain, or unmapped.
- Cards when merchant-category or reward-category evidence exists.
- Provider integrations when external category hints are imported.
- Health through read-only categorized transaction patterns.
- Together when both partners share or contest category meaning.

## Where Ownership Changes

Ownership changes at the boundary between meaning and financial state.

- A transaction owns the money fact; a category owns its label.
- A jar owns planned capacity; a category may only explain why a transaction should affect that jar.
- A provider owns imported classification evidence; the household category owns final household meaning.
- Inbox owns pending review state; Categories own the vocabulary used to resolve classification.

## Explicit Non-Ownership

Categories must not own balances, allocations, payment execution, partner permissions, financial-product terms, debt schedules, investment classification, or health conclusions.
