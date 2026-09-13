# Savings bounded context

Financial product domain for household savings: fixed deposits, digital savings, flexible savings, and manual tracking.

## Design philosophy

Savings NEVER create money. Money always moves through the ledger (BR-01).

Lifecycle: fund → active cycle → interest accrual → maturity. A valid `auto_renew_until_cancelled` configuration renews through the existing rollover ledger flow and reports the result in Inbox; all other policies wait for an Inbox decision. Maturity withdrawal and early withdrawal still require confirmation.

Only `auto_renew_until_cancelled` preauthorizes rollover from the saved package and rule. Invalid saved configuration falls back to Inbox for the user to handle.

Health may read metrics only (BR-24).

## Bounded context: `savings` (ledger-owned application module)

- Does not import `inbox` / `plan` / `health`
- Money truth: ledger `accounts` + `transactions`
- Product truth: `savings`, `saving_cycles`, providers/packages
- App/Inbox orchestration handles manual settle/renew decisions; scheduled or sync maturity processing applies only the preauthorized auto-renew policy
