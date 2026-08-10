# Phase G Final Integration Report

## Verdict

REDEVELOPMENT_INTEGRATION_READY_WITH_CONDITIONS

## Results

- Typecheck: PASS (`tsc --noEmit`).
- Lint: PASS with 0 errors. One unrelated existing unused-parameter warning remains in `money-products-actions.ts`.
- Focused tests: PASS for Investments accounting/command coverage and Ledger balance/Transfer coverage (`33` tests total in the closure run).
- Transfer: PASS. Implemented owned-account transfer (RPC + application command + capture mode UI with preview/confirm/receipt). SQL money-safety check: Cash −₫1,234, destination +₫1,234, household total unchanged, linked `transfer_out`/`transfer_in` legs share one `transfer_group_id`, not income/expense.
- Investments: PASS. The canonical F6.1 contract is implemented with exact decimal quantities, weighted-average basis, opening positions, buy/sell, conversion, income, fees, valuation, portfolio aggregation, RLS tables/RPCs, idempotency, and direct Ledger classifications.
- Plan / Goals fixture verification: PASS. Rituals unlocked (`locked_rituals = 0`). Goal contribute + jar reallocate left Cash at ₫1,765,766 and ledger count at 15 (unchanged).
- Savings fixture verification: PASS. Cash top-up fixture applied; create-and-fund of ₫1,000,000 decreased Cash once to ₫1,765,766, created Active saving + Active cycle with `funding_transaction_id`, and exactly one funding expense + one receiving income (no duplicate).
- Browser Playwright for Transfer/Plan/Savings UI: not re-run here — local `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` were absent. Specs added under `tests/e2e/transfer.smoke.spec.ts`, `plan-goals-g1-fixture.smoke.spec.ts`, `savings-g1-fixture.smoke.spec.ts`. Money-safety verified via authenticated RPC/SQL against the E2E household.

## Money Safety

- Transfer: PASS. Source −amount once, destination +amount once, total unchanged, linked transfer legs only.
- Plan / Goals: PASS. Allocate/reallocate/contribute are non-money; balances and transaction count unchanged after fixture unlock.
- Savings: PASS. Funding principal moved once; linked cycle funding transaction present; no duplicate funding rows.
- Investments: PASS. Opening positions, repeated buys, partial/full sells, conversions, fees, valuation invariance, income classification, and coverage-aware portfolio derivation are verified.

## Fixes Applied

- Added `transfer_out` / `transfer_in` ledger types, `transfer_group_id`, and `record_owned_account_transfer` RPC (migration `20260809220000_owned_account_transfer.sql`, applied to project `bbzffxvgocjwsdbujvgn`).
- Added `recordTransfer` command, capture Transfer mode (preview → confirm → receipt), EN/VI copy.
- Seeded minimal E2E fixtures: unlock locked rituals, cash top-up idempotency key `e2e-fixture-cash-topup-v1`, second liquid account when missing (`scripts/g1-seed-e2e-fixtures.mjs` + one-shot SQL).
- Added Investments application accounting/API modules, overview/detail/action routes, EN/VI copy, direct Ledger semantic integration, focused unit coverage, authenticated smoke coverage, and migration `20260810021309_lean_investments_v1.sql` applied to project `bbzffxvgocjwsdbujvgn`.

## Remaining Conditions

- One unrelated existing unused-parameter lint warning remains in `money-products-actions.ts`; it is non-blocking and outside Investments scope.
- Previous authenticated Investments browser evidence passed at 390px Vietnamese light and 440px English dark; no browser rerun was required for this report-only closure.

## Confirmation

- No unrelated modules were redesigned.
- Investments follows the approved canonical contract; no additional tax, advice, market-feed, or non-V1 ownership behavior was introduced.
- Transfer neutrality preserves household Real Position.
- Plan/Goals mutations remain non-money.
- Savings funding uses the existing canonical paired posting path.
