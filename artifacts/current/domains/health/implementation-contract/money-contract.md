# Money Contract

## Money Behavior By Action

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
| --- | --- | --- | --- | --- | --- | --- |
| Assess Household Health | None | None | None | None | Health assessment output only | Invalid permission, unavailable facts |
| Refresh Health Assessment | None | None | None | None | Refreshed Health assessment output only | Same facts, unavailable facts |
| Determine Data Completeness | None | None | None | None | Completeness context only | Source visibility unknown |
| Explain Health Factors | None | None | None | None | Factor explanation only | Factor ungrounded or unsafe |
| Present Read-Only Scenario | None | None | None | None | Scenario output only | Scenario would require action or invention |
| View Source Factor Context | None | None | None | None | Read-only source context only | Permission failure |
| Forbidden Action Attempt | None | None | None | None | Invalid Attempt only | All forbidden attempts |

## BR-01 Contract

- Health never treats Planning or Goals as real money.
- Health never treats jar amount, goal progress, or allocation as spendable balance.
- Health never includes available credit as real money.
- Health never creates ledger movement from assessment, scenario, or factor review.

## BR-24 Contract

- Health writes no source-domain facts.
- Health creates no commands that mutate money, planning, decisions, or membership.
- Health can only produce read-only assessment output.

## No Ambiguous Money Movement

If a user wants to:

- Transfer money: action belongs outside Health.
- Repay debt: action belongs outside Health.
- Correct a transaction: action belongs outside Health.
- Change a plan: action belongs outside Health.
- Resolve an Inbox item: action belongs outside Health.

Health may show source context only. It must not perform the action.
