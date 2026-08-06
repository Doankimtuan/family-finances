# Modified Features

## Capabilities Approved With Modifications

| ID | Original idea | Required modification | Reason | Expected result |
|----|---------------|----------------------|--------|-----------------|
| LOAN-PD-003 | Borrower / household relevance | Represent household relevance and responsibility simply; do not model complex legal ownership in MVP. | Shared finance needs visibility, but privacy and legal semantics are sensitive. | Household can understand who is affected without overreach. |
| LOAN-PD-005 | Remaining principal | Present as recorded remaining principal, not guaranteed lender outstanding balance. | Provider balance may include fees, penalties, posting delays, or recalculations. | User gets useful progress without false precision. |
| LOAN-PD-006 | Loan purpose or type | Keep broad categories only. | Detailed taxonomy adds clutter and maintenance cost. | Users can recognize loan type without being forced into expert labels. |
| LOAN-PD-008 | Repayment frequency | Treat monthly as primary; keep non-monthly as later consideration. | Monthly is most validated for young households; broader frequency adds complexity. | Simple-first scope remains intact. |
| LOAN-PD-011 | Principal / interest / fee distinction | Distinguish concepts, but do not require detailed fee or split data when unknown. | Users often lack provider-level breakdowns. | Financial safety improves without blocking manual tracking. |
| LOAN-PD-017 | Planned vs actual comparison | Keep lightweight and explanatory; defer advanced reconciliation workflow. | Users need trust checks, not a complex accounting tool. | Mismatch awareness without over-engineering. |
| LOAN-PD-019 | Partner visibility | Support household visibility while leaving consent/privacy rules for later formalization. | Loans are emotionally sensitive and may predate the relationship. | Shared finance improves without assuming all debts are shared. |
| LOAN-PD-020 | Informal loan notes | Keep as simple notes/context, not legal contract modeling. | Family loans are common but relationship-sensitive. | Household memory improves without formalizing social debt too aggressively. |
| LOAN-PD-023 | Variable-rate history | Track rate changes only insofar as they affect repayment understanding. | Benchmark-level precision is too technical now. | Users see relevant changes without financial engineering. |
| LOAN-PD-024 | Promotional-rate period | Represent promotional period plainly and as user-entered/planned unless provider-confirmed. | Vietnam loans often have promo rates; users may mistake them for full-term fixed rates. | Payment-shock risk becomes visible without false provider certainty. |
| LOAN-PD-025 | Early payoff estimate | Treat as estimate, not lender payoff quote. | Real payoff can include fees and date-sensitive lender rules. | Users can plan mentally without relying on it as legal truth. |

