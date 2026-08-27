# Savings existing-deposit import

## Scope

Savings creation now uses one catalog-backed form. `creationMode` is explicit:

- `LIVE_DEPOSIT`: a source account is required and the RPC creates the normal
  transfer, including a backdated transfer when the start date is in the past.
- `HISTORICAL_OPENING`: the source account is null and the RPC stores principal
  only in Savings/cycle state.

The former `Thông tin kỳ hạn` / manual terms path was removed. Catalog packages
are the only source of term, rate, tax, settlement, and rollover rules.

## Schema and API

- `createSavingInputSchema` remains a discriminated union on `creationMode`.
- Both modes require `providerId`, `packageId`, `productName`, principal,
  settlement account, and a catalog package snapshot.
- Historical mode requires a past start date and a null funding account.
- The server and RPC reject future starts, expired maturities, invalid cycle
  dates, mode/funding mismatches, and invalid package snapshots.
- Idempotency replay remains snapshot-key based for historical imports and
  transaction/snapshot based for live deposits.

## Financial-row behavior

Historical creation does not insert transactions, Income, Expense, or a
synthetic transfer. Live creation keeps the existing two-legged transfer and
uses the selected start date as `transaction_date`, including for backdated
starts. Principal is stored on the saving and first cycle in both modes.

## Lifecycle behavior

The original cycle start date remains authoritative for interest, early
withdrawal, settlement, maturity, rollover, summaries, Goals, privacy, and
financial activity. Rollover uses an immutable catalog cycle snapshot; the
manual snapshot fallback was removed. Historical detail continues to show
`Được thêm giữa kỳ` / `Added mid-cycle` and remains fully active.

## Focused test results

- Unit/component: 7 files, 71 tests passed (`savings-domain`, create wizard,
  savings commands/mapper, Home metrics/IA, and Money products).
- Typecheck: passed.
- Changed-file ESLint: passed.
- Migration freeze: passed; frozen baseline unchanged.
- SQL lint: not run successfully because no local Supabase Postgres was
  available at `127.0.0.1:54322`.

## E2E result

The authenticated lifecycle spec was updated to cover a catalog package, a
several-month-old start date, explicit historical status selection, no source
account, accrued-interest preview, no import transaction, detail
dates/principal, mid-cycle label, and early-withdrawal availability. It was not
executed because E2E credentials are not configured in this environment.

The unauthenticated browser check reached the login redirect successfully.

## Verdict

Focused code validation passes. Final browser/E2E verdict remains pending an
authenticated environment and a reachable local/remote Supabase database.
