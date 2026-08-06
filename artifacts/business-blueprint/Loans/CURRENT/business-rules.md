# Business Rules

## Existing Rules

| Rule | Behavior in Loans |
|------|-------------------|
| BR-01 Real Ledger is not Virtual Planning | Loan repayments are real ledger events; schedules and payoff estimates are planning information; payoff jars do not belong to Loans. |
| BR-02 Action context | Household money actions require valid user and household context. |
| BR-02a Membership protection | Loan data belongs to a household and is protected by membership. |
| BR-12 One household MVP | Loan relevance is evaluated within the active household scope. |
| BR-15 Online-first money mutations | Loan-affecting money changes are not offline write behavior in current scope. |
| BR-24 Health read-only | Health may summarize loan burden but must not mutate loans, payments, or balances. |

## Clarified Rules

| Rule | Clarification |
|------|---------------|
| Recorded loan truth | Recorded remaining principal, schedule, rate, and payoff estimate are product truth unless explicitly provider-confirmed. |
| Repayment dual meaning | A loan payment is both real money movement and obligation progress. |
| Completion is not erasure | Completed loans retain repayment history and household meaning. |
| Completion is not provider proof | Completed status does not guarantee lender-confirmed closure unless evidence exists outside current scope. |
| Loan/Card boundary | Revolving credit-card balances are not Loans. |
| Loan/Debt boundary | Scheduled obligations belong to Loans; open-ended unscheduled owed money belongs to Debts. |
| Broad type only | Loan types remain broad and household-understandable. |
| Rate awareness is simple | Variable and promotional rate awareness is allowed only to explain repayment pressure. |
| Early payoff is estimate | Early payoff information is planning context, not formal lender quote. |
| No automatic repayment | Loans must not execute repayment automatically. |

## Derived Rules

| Rule | Business behavior |
|------|-------------------|
| Loan requires a lender | An active loan must identify who is owed. |
| Loan requires principal | An active loan must have positive original principal. |
| Loan requires repayment expectation | An active loan must have enough timing and amount information to support household repayment awareness. |
| Actual beats planned | Actual repayment records must not be forced to match expected schedule when they differ. |
| Unclear truth needs review | Provider mismatch, unclear payment, or contradictory household interpretation moves the loan to Needs Review. |
| Invalid attempts preserve state | Boundary-breaking or invalid actions do not change the previous valid loan state. |
| Active unresolved loans are not safely archived | Active loans with unresolved obligation need review before archive. |
| Informal loans remain lightweight | Family/friend loan context can be recorded, but Loans does not create legal-contract semantics. |

