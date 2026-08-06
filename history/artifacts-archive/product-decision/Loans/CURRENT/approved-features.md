# Approved Features

## Approved Capabilities

| ID | Capability | Why approved | Expected product value | Dependencies | Scope |
|----|------------|--------------|------------------------|--------------|-------|
| LOAN-PD-001 | Loan obligation | Core real household problem. | Makes future repayment burden visible. | None. | Scheduled or socially recognized borrowing obligation. |
| LOAN-PD-002 | Lender identity | Users naturally identify loans by who is owed. | Recognition, trust, partner clarity. | Loan obligation. | Lender label/name. |
| LOAN-PD-004 | Original principal | Required to understand starting obligation. | Progress and basic financial meaning. | Loan obligation. | Borrowed principal. |
| LOAN-PD-007 | Repayment term | Users need to know when the burden ends. | Long-term cash-flow awareness. | Loan obligation. | Expected duration. |
| LOAN-PD-009 | Scheduled due dates | Due dates are a direct household safety concern. | Reduces missed-payment risk. | Repayment term. | Planned due dates. |
| LOAN-PD-010 | Expected payment amount | Monthly amount is the natural mental model. | Supports salary-cycle planning. | Schedule. | Expected payment amount. |
| LOAN-PD-012 | Real repayments | Repayment is real money movement and obligation reduction. | Keeps records trustworthy. | Accounts and Transactions. | Actual repayment events. |
| LOAN-PD-013 | Payment source | Users need to know where repayment money came from. | Protects real ledger clarity. | Accounts. | Source account or real payment context. |
| LOAN-PD-014 | Payment history | Households need evidence and reviewability. | Trust, correction, partner review. | Real repayments. | Historical repayment record. |
| LOAN-PD-015 | Loan status | Lifecycle state is fundamental. | Active and completed obligations stay clear. | Loan obligation. | Active, completed, cancelled, defaulted, archived. |
| LOAN-PD-016 | History after completion | Completion should not erase context. | Long-term household memory. | Loan status. | Historical preservation. |
| LOAN-PD-018 | Upcoming / overdue awareness | Strongly validated by household anxiety and risk. | Financial safety and timely attention. | Schedule and status. | Awareness only; no automatic payment. |

## Scope Notes

Approved features form the minimum Loans reality layer:

- What is owed.
- Who is owed.
- When payment is due.
- How much is expected.
- What has actually been paid.
- Whether the obligation is still active.

They do not authorize provider automation, advisory recommendations, virtual allocation, or credit-card balance modeling.

