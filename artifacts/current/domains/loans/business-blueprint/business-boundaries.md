# Business Boundaries

## What Belongs Here

Loans owns:

- Scheduled or socially recognized borrowing obligations.
- Lender identity.
- Household relevance.
- Original principal.
- Recorded remaining principal.
- Broad loan type.
- Repayment term, frequency, due dates, and expected payment amount.
- Real repayment history meaning.
- Loan status and lifecycle interpretation.
- Lightweight rate-change and promotional-rate awareness.
- Early payoff estimate as planning context only.
- Informal loan notes.

## What Belongs Elsewhere

| Concern | Owner |
|---------|-------|
| Money location and payment source | Accounts |
| Real money movement | Transactions |
| Credit-card revolving balance, limits, statements, billing | Cards |
| Open-ended unscheduled owed money | Debts |
| Virtual payoff allocation | Planning / Jars / Goals |
| Savings product lifecycle | Savings |
| Review reminders and attention surface | Inbox |
| Financial health summary | Health |
| Spending or fee categorization | Categories |
| Partner coordination surfaces | Together |

## What Loans Must Never Own

- Credit-card revolving balances.
- Credit limits or utilization.
- Account balances.
- Transaction classification as sole owner.
- Virtual jars or payoff allocation.
- Goal progress.
- Health mutations.
- Automatic repayment execution.
- Provider import and automatic reconciliation in current scope.
- Financial advice about consolidation, refinancing, or best payoff strategy.
- Legal ownership determination for co-borrowers, guarantors, or family disputes.

## Responsibility Leakage Prevention

- A loan payment may reference Accounts and Transactions, but Loans does not become the source of account truth.
- A loan may inform Planning, but Loans does not become a planning tool.
- A loan may inform Health, but Health remains read-only.
- A loan may affect Together, but Loans does not decide relationship fairness.

