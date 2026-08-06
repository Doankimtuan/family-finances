# Business Rules Impact

This file identifies business-rule impacts only. It does not rewrite existing Sources of Truth.

## New Business Rules Identified

| Proposed rule area | Affected decisions | Need |
|--------------------|-------------------|------|
| Loan recorded truth | LOAN-PD-005, LOAN-PD-017, LOAN-PD-025 | Clarify that product-calculated loan values are recorded/planned values unless provider-confirmed. |
| Loan repayment ledger effect | LOAN-PD-012, LOAN-PD-013, LOAN-PD-014 | Clarify that repayment is a real money movement and loan obligation update, not only expense categorization. |
| Loan completion evidence | LOAN-PD-015, LOAN-PD-016 | Clarify that completed loans retain history and should not imply provider closure without evidence. |
| Loan/Card boundary | LOAN-PD-043 | Clarify that revolving credit-card balances are not Loans. |
| Loan/Planning boundary | LOAN-PD-044 | Clarify that payoff intentions belong to Planning/Jars/Goals, not Loan balance. |

## Modified Business Rules Identified

No direct modifications to existing frozen Business Rules are made here.

Potential future SoT modification areas:

- BR-01 may need a Loans-specific clarification for planned schedule, recorded payment, and virtual payoff intentions.
- Health read-only (BR-24) may need an explicit statement that Health cannot mutate loan state or balances.

## Clarified Business Rules Identified

| Existing principle | Clarification needed |
|--------------------|---------------------|
| BR-01 Real Ledger is not Virtual Planning | Loan payments are real ledger events; payoff targets are virtual planning and must remain separate. |
| Health read-only (BR-24) | Health may summarize loan burden but cannot create payments, close loans, or alter balances. |
| Financial safety over convenience | Automatic repayment execution is rejected; provider imports and reconciliation remain deferred. |
| User understands where money is | Loan repayment must preserve payment source and not hide account impact. |

