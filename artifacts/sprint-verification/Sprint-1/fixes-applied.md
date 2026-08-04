# Sprint 1 Verification Fixes — Applied

| Field | Value |
|-------|--------|
| Date | 2026-08-03 |
| Target | Closing Verification Board blockers B1–B4 |
| Remote project | `family-finances-2` (`bbzffxvgocjwsdbujvgn`) |

## Closed

| ID | Fix |
|----|-----|
| **B1** | `updateTransaction` fail-closed (`LEDGER_ACTION_ERROR_CODE.IMMUTABLE`); SQL `update_transaction` raises; Legacy edit CTA removed; `/edit` redirects to `/correct` |
| **B2** | `transactions.is_reversal` + BEFORE INSERT trigger; `countsTowardMonthlyIncome` / `sumMonthlyIncome` policy; refund/reversal legs excluded from income while cash/jar capacity still apply |
| **B3** | Expanded AC contract tests (`sprint1-ac-contracts.test.ts` + core contracts); command tests assert no mutate RPC |
| **B4** | Migration `sprint1_immutability_income_exclusion` applied to remote; Sprint 1 schema already present |

## Also fixed (financial correctness)

- Account / real-position balance queries no longer filter `status = cleared` (post Sprint 1 statuses use `TRANSACTION_BALANCE_STATUS_VALUES`).

## Verification gates

- Unit: **201 / 201** pass
- Typecheck: pass
- Lint: pass
- Remote SQL: `is_reversal` column, `transactions_set_is_reversal` trigger, `update_transaction` fail-closed body confirmed

## Residual (non-blocking)

- Playwright smoke for category/refund/correct still optional without E2E credentials
- Local Docker Supabase not running this session (remote apply covered B4)
