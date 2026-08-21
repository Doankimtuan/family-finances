# Investments 12B — P0 Financial Integrity Gate

Date: 2026-08-21

## Scope

Implemented only the five P0 findings from `investments-ux-ui-audit-12a.md`. No hard-delete path was added and no unrelated investment UX redesign was performed.

## Fixes

### P0-01 — Buy/Sell fee semantics

- Buy principal is stored as `investment_buy` and remains neutral.
- Sell gross proceeds are stored as `investment_sell_proceeds` and remain neutral.
- Every cash fee creates its own `investment_fee` transaction and `investment_fees` leg.
- Buy cash delta is `-principal - fee`; sell cash delta is `gross proceeds - fee`.
- Realized P&L uses gross proceeds less disposed basis, non-cash fee value, and cash fee.
- Home/Transactions therefore classify only the fee transaction as Expense.

### P0-02 — Stable idempotency

- Buy, sell, and valuation RPCs use one operation key for the logical mutation.
- Cash principal and fee legs derive deterministic child keys from that operation key.
- Operation/valuation uniqueness returns the original receipt on replay.
- Buy, sell, income, conversion, valuation, and opening/initial flows keep the key stable across retries; the operation form clears it only after success or explicit edit/reset.

### P0-03 — Server-side ownership

- New buy, sell, and valuation RPCs assert `financial_scope` and `owner_membership_id` before touching holdings/accounts.
- Legacy income/conversion paths are protected by ownership checks on investment operation and investment transaction inserts.
- Related fee holdings and cash accounts are checked server-side.
- Existing UI ownership gating remains only an additional presentation guard.

### P0-04 — Per-unit price contract

- Buy, sell, and valuation use `unit_price_vnd` plus quantity for unit-based holdings.
- Persisted operation/valuation rows retain quantity, unit price, and derived total value.
- Fund certificates/CCQ use NAV-per-CCQ semantics.
- Bonds retain explicit total-value semantics as the domain exception.

### P0-05 — Fund/CCQ cost basis

- Funds use explicit FIFO accounting.
- Existing fund balances are imported as an explicit aggregate lot.
- New fund buys create lots; partial/full sells consume oldest remaining lots and update quantity, remaining basis, and realized P&L consistently.
- The operation preview receives the holding accounting method and lots instead of silently forcing weighted average.

## Database migration

Applied to linked development project:

`supabase/migrations/20260821135807_investments_p0_integrity_gate_12b.sql`

Compatibility follow-up:

`supabase/migrations/20260821141419_investments_p0_initial_purchase_compat_12b.sql`

The follow-up preserves the existing initial-purchase RPC while routing it through the new per-unit buy boundary.

Ownership-verification follow-up:

`supabase/migrations/20260821142235_investments_p0_valuation_id_fix_12b1.sql`

This fixes an ambiguous valuation receipt variable found by the authenticated verification run.

Verified remotely:

- New buy/sell/valuation RPC signatures exist and are executable by `authenticated`.
- Legacy buy/sell/valuation signatures were removed.
- `investment_operations.unit_price_vnd`, `investment_valuations.quantity`, `investment_valuations.unit_price_vnd`, and FIFO lots exist.
- Ownership triggers exist for investment operations and investment transactions.
- No deletion function or hard-delete mutation was added.

## Verification

Passed:

- `npm run lint`
- `npm run typecheck`
- `npm run test` — 138 files, 1,016 tests
- `npm run build`
- Focused investment command/form/view-model/lifecycle tests — 25 passed
- Supabase migration application and RPC/grant/schema inspection

## 12B.1 Ownership Negative Verification

Used a fresh isolated household and two fresh authenticated users. Existing fixture users and memberships were not moved or changed.

Passed with direct authenticated RPC calls:

- User A personal holding created.
- User B, same household and not the owner, was rejected server-side for buy, sell, valuation, income, and conversion.
- After every rejected call: operation count, transaction count, fee count, valuation count, lot state, holding quantity/basis, and account transaction delta were unchanged.
- User A successfully performed buy, sell, valuation, income, and conversion.
- Income replay returned the original result and did not create a duplicate operation.
- Isolated household and both temporary auth identities were deleted after verification; database checks confirmed zero remaining `Investments 12B.1` households and zero matching auth users.

Verification runner:

`scripts/investments-ownership-negative-12b1.mjs`

Supabase security advisors still report pre-existing project-wide warnings unrelated to the investment ownership boundary.

Final verification:

- Ownership/RPC/security and investment integrity tests: 11 files, 220 passed.
- Full test suite: 138 files, 1,016 passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Targeted report/verification-runner formatting and `git diff --check`: passed. The repository-wide `npm run format:check` remains baseline-red because approximately 2,200 pre-existing files are not Prettier-clean; no broad formatting was applied.

## Verdict

INVESTMENTS P0 GATE PASS

## Implementation sequence

- 12B P0 integrity
- 12C List/Create
- 12D Detail/Buy/Sell/Price
- 12E Final Quality Gate
