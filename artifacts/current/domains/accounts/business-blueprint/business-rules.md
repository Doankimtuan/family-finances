# Business Rules

## Existing Rules

| Rule | Behavior in Accounts |
|------|----------------------|
| BR-01 Real Ledger is not Virtual Planning | Account balances are real recorded position; jar allocations are intentions and must not be treated as account balances. |
| BR-02 Action context | Household money actions require valid user and household context. |
| BR-02a Membership protection | Account data belongs to a household and is protected by membership. |
| BR-12 One household MVP | Account relevance is evaluated within the active household scope. |
| BR-15 Online-first money mutations | Account-affecting money changes are not offline write behavior in current scope. |
| BR-24 Health read-only | Health may summarize account facts but must never mutate accounts. |

## Clarified Rules

| Rule | Clarification |
|------|---------------|
| Account real-position eligibility | Only eligible owned-money accounts contribute to real position. Credit obligations and credit limits do not inflate owned money. |
| Account history preservation | Historical and closed accounts remain interpretable; closure is not erasure. |
| Account adjustment accountability | Recorded balance changes must be explainable and cannot be silent rewrites. |
| Transfer neutrality | Transfers between household-owned accounts change location, not income or expense. |
| Broad account typing | Account types remain broad and understandable; fine-grained taxonomy is not current scope. |
| Lightweight reconciliation | Accounts support trust repair, but advanced reconciliation workflow is deferred. |
| Simple liquidity | Accounts distinguish liquid from constrained money only at a simple business level. |

## Derived Rules

| Rule | Business behavior |
|------|-------------------|
| Account must represent reality | An account cannot be created for a jar, goal, budget, or plan. |
| Account name must be recognizable | The household must be able to identify the real container from its label. |
| Inactive accounts cannot be active targets | Historical or closed accounts should not be used as ordinary active transaction context. |
| Invalid attempts preserve previous state | Boundary-breaking actions are rejected without changing account state. |
| Read-only consumers cannot repair account truth | Consumers such as Health may identify concern but cannot change Accounts. |

