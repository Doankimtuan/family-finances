# Business Boundaries

## What Belongs Here

- Read-only household financial condition.
- Factor explanation.
- Data completeness context.
- Read-only scenario interpretation.
- Current visible pressure and resilience interpretation.
- Safe omission or blocking of unsafe factors.

## What Belongs Elsewhere

| Concern | Owning domain |
| --- | --- |
| Real money containers and balances | Accounts |
| Real money movement | Transactions |
| Card statements, repayments, and utilization | Cards |
| Loan obligations and repayment lifecycle | Loans |
| Savings products, maturity, renewal, withdrawal | Savings |
| Planning intention and jars | Planning |
| Future target intentions | Goals |
| Decision queue and outcomes | Inbox |
| Classification meaning | Categories |
| Household membership and permissions | Together |

## What Health Must Never Own

- Money.
- Balances.
- Transactions.
- Transfers.
- Repayments.
- Reconciliations.
- Account state.
- Card state.
- Loan state.
- Savings product state.
- Planning allocations.
- Goal progress truth.
- Inbox item state.
- Category taxonomy.
- Household membership or permission.
- Medical, insurance, credit, investment, tax, or legal advice.
- AI-invented financial facts.

## Responsibility Leakage Prevention

- If a source fact is wrong, Health marks the assessment partial or wrong-looking; correction belongs elsewhere.
- If a decision is needed, Inbox owns the decision lifecycle.
- If money must move, the owning money domain handles it.
- If a plan should change, Planning owns the change.
- If a Health scenario suggests a possible effect, it remains observation only.
