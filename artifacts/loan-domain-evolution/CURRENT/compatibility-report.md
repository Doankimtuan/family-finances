# Compatibility Report

| Concern | Stance |
|---------|--------|
| Inbox kind `emi_complete` | Keep storage value |
| Old `/money/cards` | Redirect to `/money/loans` |
| Repayment method DB values | Keep `fixed_monthly` / `reducing_balance`; UI copy = Equal Monthly / Declining Balance |
| Existing loans | Backfilled `interest_strategy=fixed` + one rate period |
| Variable / promo rates | Now supported via Interest Strategy + rate periods |
| Debts / Cards | Untouched |

## Known gaps (accepted)

- Benchmark+margin, automatic review, refinance, interest-only not implemented (rate-period table is the extension point).
- No backfilled Ledger transactions for pre-migration EMI counters.
