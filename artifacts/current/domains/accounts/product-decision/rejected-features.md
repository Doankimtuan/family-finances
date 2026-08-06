# Rejected Features

## ACC-PD-037: Jar-To-Account Mapping

Why rejected:

- Directly conflicts with BR-01.
- Turns real containers into planning containers.
- Makes users believe jar allocations are reserved bank money.

Product philosophy conflict:

- Real Ledger must remain separate from Virtual Planning.

Risk:

- Critical misunderstanding and long-term fragility.

## ACC-PD-038: Account-Level Spending Analytics

Why rejected:

- Accounts should explain where money is, not analyze why money was spent.
- Spending analytics belong to Transactions, Categories, Planning, or Health.

Product philosophy conflict:

- Violates simple before powerful and passive account boundary.

Risk:

- Medium complexity and duplicated domain ownership.

## ACC-PD-039: Health Write-Back To Accounts

Why rejected:

- Health must remain read-only (BR-24).
- Account balances cannot be changed by interpretation or scoring.

Product philosophy conflict:

- Violates Health read-only (BR-24) and financial safety.

Risk:

- Critical trust loss.

## ACC-PD-040: Automatic Money Movement From Accounts

Why rejected:

- Accounts do not make household decisions.
- Automation that moves or allocates money without deliberate human action violates household-first control.

Product philosophy conflict:

- Violates no unnecessary automation and financial safety over convenience.

Risk:

- Critical financial and relationship risk.

