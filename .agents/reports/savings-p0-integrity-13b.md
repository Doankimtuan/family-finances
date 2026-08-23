# SAVINGS 13B — P0 Financial Integrity Hardening

Date: 2026-08-22  
Scope: the seven P0 findings from `savings-domain-ux-audit-13a.md`. No Savings UI redesign was implemented.

## Verdict

`SAVINGS P0 GATE PASS`

No remaining Savings P0 blocker was found after implementation and linked-development verification.

## Implemented

- Added forward migration `supabase/migrations/20260822131617_savings_p0_integrity_hardening_13b.sql`.
- Added forward security migration `supabase/migrations/20260822133134_savings_p0_integrity_security_13b.sql`.
- Replaced the malformed/client-authored early-withdrawal RPC with `early_withdraw_saving(uuid, uuid, text)`.
- Added the server-authoritative `preview_early_withdraw_saving(uuid, date)` RPC.
- Added one account predicate, `savings_is_eligible_liquid_account`, covering active liquid accounts, ownership, and exclusion of credit-card, savings-product, brokerage, and other non-liquid types.
- Added shared server calculation helpers for simple, compound-daily, and compound-monthly interest plus tax.
- Updated maturity detection, settlement, early settlement, rollover, and live placement to use server-derived values.
- Added stable Savings event metadata to all new interest, tax, fee, principal-placement, and principal-return rows.
- Added operation keys, row locks, advisory locking for create, and replay receipts for settlement, early settlement, and rollover.
- Updated the early preview/confirmation command so monetary inputs are not sent to the mutation RPC.
- Added the early-rate/tax/penalty domain regression test.

## Remote verification

Project: linked development project `bbzffxvgocjwsdbujvgn`. All fixture data was created inside transactions and rolled back.

| Fixture                              | Result                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simple interest                      | 8,493 for 1,000,000 at 10% over 31 days                                                                                                                                   |
| Compound daily                       | 8,528 for the same fixture                                                                                                                                                |
| Compound monthly                     | 25,208 for 90 days                                                                                                                                                        |
| Account eligibility                  | Checking accepted; credit card, savings-product, and brokerage rejected                                                                                                   |
| Same source/destination              | Create RPC rejected the operation                                                                                                                                         |
| Create retry                         | One cycle and two placement transaction rows; second call returned `idempotentReplay: true`                                                                               |
| Maturity settlement                  | Gross interest 8,493; tax 424; net interest 8,069; payout 1,008,069; four classified transaction rows; retry replayed without duplicates                                  |
| Early settlement preview             | Gross 8,493; eligible interest 1,273 at explicit 1.5% rate; penalty 7,220; tax 424; net interest 849; payout 1,000,849                                                    |
| Early settlement mutation            | Current-date calculation produced gross interest, tax, penalty, and net payout from the locked cycle; five classified transaction rows; retry replayed without duplicates |
| Principal-plus-net-interest rollover | New principal 1,008,069; matured cycle retained gross interest/tax breakdown; one next cycle; retry replayed without duplicates                                           |
| Principal-only rollover              | New principal 1,000,000; net interest 8,528 paid to the destination; three classified transaction rows; retry replayed without duplicates                                 |
| Personal ownership                   | User B in the same household was rejected when mutating User A’s personal Savings position                                                                                |

Remote migration checks also confirmed the new signatures:

- `early_withdraw_saving(uuid, uuid, text)`
- `preview_early_withdraw_saving(uuid, date)`
- `settle_saving_cycle(uuid, uuid, text)`
- `rollover_saving_cycle(uuid, text, uuid, uuid, date, date, text)`

The old early-withdrawal signature accepting client-supplied principal, interest, tax, penalty, and payout values is no longer exposed.

## Accounting invariants verified

- Principal placement and return use neutral transfer rows.
- Gross interest is posted as `income` with `SAVINGS_INTEREST`.
- Actual tax is posted as `expense` with `SAVINGS_TAX` only when non-zero.
- Actual early-settlement penalty/fee is posted as `expense` with `SAVINGS_FEE` only when non-zero.
- Net payout is derived as `principal + gross interest - tax - penalty`.
- Maturity and rollover use the cycle’s persisted interest method and locked rate.
- Matured cycle history remains linked and is not deleted or overwritten with the next cycle.

## Regression results

- Targeted Savings, accounting, and semantics suites: **PASS**, 97 tests.
- `npm run typecheck`: **PASS**.
- Changed-file ESLint: **PASS**.
- `npm run build`: **PASS**.
- Full unit suite: **149/152 files passed; 1,067/1,072 tests passed**. Five failures are pre-existing Home/header/motion contract tests outside Savings and were not changed.
- Full `npm run lint`: **FAIL** only on the pre-existing `scripts/home-compact-cta-check.cjs` import/console rules; no changed Savings file failed lint.
- Supabase security/performance advisors: the new helper search paths were pinned in the follow-up migration. Remaining advisor output is pre-existing unrelated project debt.

## P0 blockers

None.
