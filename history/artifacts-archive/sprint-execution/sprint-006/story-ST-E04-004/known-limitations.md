# ST-E04-004 — Known Limitations

1. **Debt payment** reduces `remaining_amount` only — does not auto-create a ledger expense transaction.
2. **Authenticated e2e** skips without `E2E_USER_*`.

## Resolved

- Remote migration `ledger_debts_savings_installments` applied via Supabase MCP to `bbzffxvgocjwsdbujvgn` (`2026-08-03`).
