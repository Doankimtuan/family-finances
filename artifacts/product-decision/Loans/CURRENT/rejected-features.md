# Rejected Features

## Permanently Rejected Capabilities

| ID | Capability | Why rejected | Conflict with product philosophy | Complexity | Low value | Financial risk | Maintenance cost |
|----|------------|--------------|----------------------------------|------------|-----------|----------------|------------------|
| LOAN-PD-043 | Credit-card revolving balance as Loan | Revolving card balances are not scheduled loan obligations. | Violates Cards/Loans boundary and user understanding. | Medium | High confusion | High | Medium |
| LOAN-PD-044 | Virtual loan payoff jar | Loans must not own virtual payoff allocations. | Violates BR-01 Real Ledger is not Virtual Planning. | Medium | Duplicates Planning | Critical | Medium |
| LOAN-PD-045 | Health mutates loans | Health cannot change loan state, balance, or payments. | Violates Health read-only (BR-24). | High | No household value | Critical | High |
| LOAN-PD-046 | Automatic repayment execution | Loan domain must not initiate real repayments. | Violates financial safety over convenience and no unnecessary automation. | High | Convenience only | Critical | High |

## Rejection Rationale

Rejected capabilities either blur domain truth, create unsafe automation, duplicate other domains, or violate explicit product principles.

They should not be reintroduced under another name unless the underlying product principle changes.

