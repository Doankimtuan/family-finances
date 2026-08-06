# Boundaries

## What Belongs Here

Loans owns:

- Scheduled borrowing obligations.
- Original principal and remaining obligation.
- Lender identity.
- Loan type or purpose.
- Repayment term and schedule.
- Interest and fee concepts tied to the obligation.
- Rate changes tied to the loan.
- Repayment progress.
- Loan lifecycle status.
- Early payoff, delinquency, restructuring, or completion as loan states.

## What Belongs Elsewhere

| Concern | Owning domain |
|---------|---------------|
| Real cash/bank/e-wallet containers | Accounts |
| Real money movements | Transactions / Ledger |
| Open-ended money owed without schedule | Debts |
| Credit-card limit, utilization, statement cycle, billing | Cards |
| Virtual allocation of income | Jars / Planning |
| Household reminders and review tasks | Inbox / Calendar |
| Savings products used as collateral or repayment source | Savings / Accounts |
| Product health summaries | Health |
| Authentication, household membership, permissions | Tenancy |

## Where Integrations Happen

- Account integration: payment source and balance context.
- Transaction integration: repayment becomes a real ledger movement.
- Inbox/Calendar integration: due, overdue, completed, or review-worthy events.
- Card integration: only if a card product creates or references a separate loan-like installment; revolving card behavior remains outside Loans.
- Provider integration: bank or finance-company data may supply read-only facts.
- Document integration: contracts, statements, or proof of payoff may provide evidence.

## Where Ownership Changes

- When a payment leaves a bank account, Transactions owns the money movement; Loans owns the obligation effect.
- When a due date becomes a reminder, Inbox or Calendar owns notification surface; Loans owns the underlying repayment fact.
- When borrowing has no schedule, Debts owns the liability until a schedule exists.
- When a credit card balance revolves by statement cycle, Cards owns it; Loans does not.
- When a loan is refinanced, the old loan ends or changes, and a new obligation may begin.

