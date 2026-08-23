# SAVINGS 13C — Opening Mode + Lifecycle + Activity Integrity

Date: 2026-08-22  
Scope: P1-01, P1-03, P1-04, and P1-06 only. No Savings redesign was implemented.

## Verdict

`SAVINGS OPENING/LIFECYCLE READY`

The four scoped P1 contracts are implemented and verified. The existing
provider-catalog fixture remains outside this scope; the configured E2E user B
still has no selectable package, while the configured ownership-test user A
passed the Savings responsive smoke.

## Implemented

- Added typed `SavingsCreateMode` constants: `LIVE_DEPOSIT` and
  `HISTORICAL_OPENING`.
- Extended the create schema, command, and RPC with an explicit mode.
- Made `savings.funding_account_id` nullable for historical position seeds.
- Live mode requires the server-validated source account and creates the two
  neutral placement rows.
- Historical mode rejects a supplied source account, creates no transaction or
  transfer row, and preserves the product snapshot, ownership, and retry key.
- Added one shared `listSavingsEligibleAccounts` picker view-model using the
  same Savings account-type predicate as the server and current-user mutation
  capability.
- Applied the shared picker to create and settlement destination controls.
- Moved lifecycle synchronization to the Savings route layout so overview and
  detail deep links share the same sync boundary.
- Detail settlement actions now require persisted matured state; date-derived
  presentation can no longer expose an RPC-rejected action during sync.
- Savings activity now includes fee transaction links in addition to principal,
  interest, and tax links. Stable 13B event markers remain the classification
  source for Savings, Transactions, and Home.
- Added an explicit empty state when no eligible live-deposit account exists.

## Remote verification

Linked development project: `bbzffxvgocjwsdbujvgn`. Disposable fixtures were
created and removed after verification.

| Fixture                     | Result                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| Live BANK deposit           | `LIVE_DEPOSIT`; source and product placement rows created; source movement path accepted      |
| Live PLATFORM deposit       | `LIVE_DEPOSIT`; source and product placement rows created                                     |
| Historical BANK opening     | `HISTORICAL_OPENING`; null funding transaction and null transfer group                        |
| Historical PLATFORM opening | `HISTORICAL_OPENING`; null funding transaction and null transfer group                        |
| Historical financial rows   | Exact count: **0**                                                                            |
| Historical retry            | Returned the original saving/cycle with `idempotentReplay: true`                              |
| Live retry                  | Returned the original saving/cycle with `idempotentReplay: true`; no duplicate placement rows |
| Brokerage source            | Rejected by the authoritative account predicate                                               |
| Same source/destination     | Rejected by the live movement guard                                                           |
| Server schema               | `funding_account_id` nullable; `settlement_account_id` remains required                       |

The remote RPC signature is now:

`create_saving_with_transfer(uuid, numeric, uuid, text, jsonb, text, uuid, date, date, jsonb, jsonb, text, text, text)`

## Lifecycle and activity invariants

- Overview and detail mount the same lifecycle synchronization boundary.
- Upcoming, matures-today, and date-derived matured states remain truthful for
  presentation, but settlement/rollover actions wait for persisted matured state.
- Settled and early-settled records remain terminal and read-only.
- Historical opening produces no Income, Expense, Transfer, or synthetic
  activity row.
- Live placement, settlement, early settlement, and rollover continue to use
  the stable `SAVINGS_*` event metadata introduced in 13B.
- Fee rows are now reachable by Savings history through the settlement result
  linkage.

## Regression results

- Targeted Savings create/opening, lifecycle, activity, and semantics suites:
  **PASS**, 97 tests.
- `npm run typecheck`: **PASS**.
- Changed-file ESLint: **PASS**.
- `npm run build`: **PASS**.
- Full unit suite: **149/152 files passed; 1,067/1,072 tests passed**. Five
  existing Home/header/motion contract failures were not changed.
- Full `npm run lint`: **FAIL** only on the existing
  `scripts/home-compact-cta-check.cjs` import/console rules.
- Authenticated Savings visual smoke with ownership-test user A:
  **PASS** at 390, 440, 768, and 1280 widths, with reduced motion and dark
  mode exercised at 440.
- User B’s configured catalog still has no package, so its pre-existing visual
  test remains blocked by P1-07, outside this 13C scope.

## Remaining scoped blockers

None.
