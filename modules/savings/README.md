# Savings bounded context

Financial product domain for household savings: fixed deposits, digital savings, flexible savings, and manual tracking.

## Design philosophy

Savings NEVER create money. Money always moves through the ledger (BR-01).

Lifecycle: fund → active cycle → interest accrual → maturity Inbox decision → settle / renew / early withdraw.

Renewal preference is a suggestion only — never auto-executed (BR-10).

Health may read metrics only (BR-24).

## Bounded context: `savings` (ledger-owned application module)

- Does not import `inbox` / `plan` / `health`
- Money truth: ledger `accounts` + `transactions`
- Product truth: `savings`, `saving_cycles`, providers/packages
- App/Inbox orchestration calls settle/renew after typed ReviewItem acknowledgment
