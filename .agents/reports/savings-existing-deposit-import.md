# Savings existing-deposit import

Date: 2026-08-26

## Schema and API

- Added typed `SavingsTermsMode.CATALOG` and `SavingsTermsMode.INLINE` values.
- `createSavingInputSchema` is a discriminated union for `LIVE_DEPOSIT` and `HISTORICAL_OPENING`.
- Historical input requires a null funding account, saving name, past start date, and either a catalog package or inline immutable terms.
- Inline terms preserve provider/product/package, rate, tax, settlement, early-settlement, and renewal data in the product and cycle snapshots.
- Added `savings.creation_mode`, backfilled from existing snapshots, with checks enforcing the live/historical funding-account pairing.
- The manual provider backing row is created by the forward migration when absent.

## Financial-row behavior

- Live deposits retain the existing source transfer-out and savings transfer-in behavior.
- Historical openings pass a null funding account, insert no transaction rows, and do not create Income, Expense, or synthetic transfers.
- Principal remains in `savings`/`saving_cycles` state; detail flow copy does not invent a source account.
- Existing `FinancialValue` rendering remains the display path for principal, interest, tax, and settlement amounts.

## Lifecycle behavior

- Historical dates are validated server-side: start before today, end after start, and maturity today or later.
- Accrual and early-withdrawal calculations continue to use the persisted original cycle start date.
- Catalog rollover behavior is retained. Inline historical cycles can keep their immutable terms when no catalog target package is supplied.
- Existing cycle links and idempotency replay checks remain in the RPC boundary.
- Detail shows `Được thêm giữa kỳ` / `Added mid-cycle` and uses a no-source historical money-flow line.

## Focused checks

- TypeScript: passed (`npx tsc --noEmit`)
- Changed-file ESLint: passed
- Focused Savings/Home/Money/Goal Vitest set: passed, 7 files / 72 tests
- Migration freeze validation: passed; baseline unchanged and forward migrations count is 2

## E2E and browser result

- The authenticated Playwright flow was updated to select historical mode at the first wizard step, use an inline six-month snapshot with a several-month-old start date, assert the mid-cycle label, assert early-withdrawal availability, and assert no transaction rows.
- The local browser reached the form. The catalog variant correctly showed the expired-maturity guidance for the fixture's 30-day package. The inline variant reached the RPC but failed against the currently deployed pre-migration function with `Invalid Savings product snapshot`.
- The forward migration is present and migration-freeze validation passes, but it has not been pushed to the remote Supabase project. Authenticated browser checks at 390px, 440px, 768px, and 1280px, including light/dark/reduced-motion variants, remain pending migration deployment.

## Final verdict

Implementation complete at code and migration level. Automated focused checks pass. Authenticated E2E is pending deployment of the forward migration; visual browser verification is pending the same environment update.
