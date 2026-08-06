# Rejected Features

## Rejected Capabilities

| Capability ID | Capability | Why rejected | Conflict with product philosophy | Complexity | Low value | Financial risk | Maintenance cost |
|---------------|------------|--------------|----------------------------------|------------|-----------|----------------|------------------|
| CARD-PD-042 | Treat credit-card outstanding or available credit as cash balance. | It misrepresents borrowing capacity as real money. | Violates BR-01 and "user always understands where money is." | Medium | High harm | Critical | Medium |
| CARD-PD-043 | Treat revolving card debt as Loan by default. | It collapses different financial behaviors. | Conflicts with Cards/Loans boundary and can confuse repayment models. | Medium | Low | Critical | Medium |
| CARD-PD-044 | Let Health change card state. | Health must remain interpretive and read-only. | Violates BR-24. | High | Low | Critical | High |
| CARD-PD-045 | Automatic repayment execution. | The product should not initiate real card payments automatically. | Conflicts with financial safety over convenience and no unnecessary automation. | High | Medium convenience only | Critical | High |

## Rejection Rationale

These capabilities are permanently rejected for this product direction because they create direct conflicts with foundational principles. They would make household money less understandable, blur domain ownership, or introduce high-risk financial automation.
