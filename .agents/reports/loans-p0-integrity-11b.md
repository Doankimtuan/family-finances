# Loans 11B — P0 Financial Integrity Gate

## Verdict

# LOANS P0 GATE PASS

Scope was limited to the three P0 findings from [`loans-ux-ui-audit-11a.md`](./loans-ux-ui-audit-11a.md): loan-create idempotency, loan-payment idempotency/atomicity and complete transaction linkage, and the unsupported fee contract. No hard delete path was added.

## Implemented

### 1. Loan creation idempotency

- Added a client-generated UUID to the create submission. The key remains stable when a submission is retried and is cleared only after success or cancel.
- Added `loans.idempotency_key` and a unique `(household_id, idempotency_key)` index.
- Added a replay-aware public RPC wrapper. It serializes the key with a transaction advisory lock, returns the original `loanId` with `idempotentReplay: true`, and calls the existing schedule creator only once.
- The unchecked helper is private to the database; only the authenticated wrapper is executable.

### 2. Loan payment idempotency and atomicity

- Added a client-generated UUID to the payment command and confirmation flow. The same key is reused after an unknown-result retry.
- Added `loan_payments.idempotency_key` and a unique `(household_id, idempotency_key)` index.
- Added a replay-aware payment RPC wrapper. A replay returns the original payment, schedule entry, remaining principal, and transaction IDs; it never selects the next schedule entry.
- The existing payment operation remains atomic: principal transaction, interest transaction, payment aggregate, schedule transition, loan balance/status update, and completion Inbox event remain inside the database function transaction.
- The unchecked helper is revoked from `public`, `anon`, and `authenticated`; only the authenticated wrapper is granted.

### 3. Complete transaction linkage and user-level grouping

- Both principal and interest transaction rows remain linked through `transactions.loan_payment_id`.
- The RPC response now exposes the complete related transaction ID set while preserving the principal transaction as the legacy primary link.
- The payment receipt links every related ledger row under one payment receipt, rather than presenting separate payment receipts.
- Transaction read models now select/map `loan_payment_id`.
- `createTransactionActivities` groups the principal and interest rows into one `LIABILITY_PAYMENT` activity with the combined cash amount and both related transaction IDs. Transaction detail uses the same grouping.
- Raw semantic classification is unchanged: `LIABILITY_PAYMENT` is neutral/non-Expense; `LOAN_INTEREST` is Expense. Home metrics and account balance continue to consume the raw semantic rows, not the display grouping.

### 4. Fee contract

- Removed unsupported Fee rows/copy from Loan detail next-payment split, payment preview, payment confirmation, payment receipt, and early-payoff estimate.
- Removed `feePaid` from the Loan mutation result/UI contract.
- No fee persistence or fee transaction was added.
- Fees are explicitly deferred product scope in the payoff-estimate unavailable copy. Existing fee copy for unrelated savings, investments, and card products was left unchanged.

## Invariants verified

| Invariant                                       | Result                                                                                                                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Borrowed principal ≠ Income                     | PASS — no income transaction is emitted by tracking-only loan creation.                                                                                                 |
| Principal repayment ≠ Expense                   | PASS — centralized `LIABILITY_PAYMENT` semantics remain non-Expense.                                                                                                    |
| Interest = Expense                              | PASS — centralized `LOAN_INTEREST` semantics remain Expense.                                                                                                            |
| Account debit = principal + interest            | PASS — account delta test and remote transaction rows verify the two debits sum to the payment amount.                                                                  |
| Loan remaining decreases by principal only      | PASS — remote payment result reduced remaining principal by 100,000 while cash outflow was 101,000 with 1,000 interest.                                                 |
| Retry create → one loan                         | PASS — remote rollback test returned the same loan ID, first replay false/second replay true, count one.                                                                |
| Retry payment → one payment/schedule transition | PASS — remote rollback test returned the same payment ID, first replay false/second replay true, one payment row, one paid schedule row.                                |
| Home/Transactions/account/loan totals agree     | PASS for the supported principal/interest contract — raw semantics and account deltas remain centralized; Transactions display is grouped without changing Home inputs. |
| No hard delete added                            | PASS — migration only adds columns/indexes/RPC wrappers and preserves existing delete restrictions.                                                                     |

## Remote Supabase verification

Applied migration:

[`20260821120000_loans_p0_integrity_gate_11b.sql`](../../supabase/migrations/20260821120000_loans_p0_integrity_gate_11b.sql)

Linked development project migration status reports the migration applied. Remote catalog checks confirmed:

- public `create_loan_with_schedule(..., p_idempotency_key text)` exists and is executable by `authenticated`;
- public `record_loan_payment(..., p_idempotency_key text)` exists and is executable by `authenticated`;
- both `_unchecked_11b` helpers are not executable by `authenticated`;
- both household-scoped unique idempotency indexes exist;
- `loans.idempotency_key`, `loan_payments.idempotency_key`, and `transactions.loan_payment_id` exist.

A rollback-contained authenticated RPC scenario using the `.env.local` fixture user verified:

- create first call: `idempotentReplay: false`;
- create replay: same loan ID, `idempotentReplay: true`;
- payment first call: one principal transaction, one interest transaction, one payment, one paid schedule entry;
- payment replay: same payment ID, same two transaction IDs, same schedule entry, no next-entry advance;
- remaining principal reached zero from principal only;
- the transaction was rolled back after assertions, leaving no test loan, payment, transaction, or Inbox history.

## Test and build verification

- `npm run lint` — PASS.
- `npm run typecheck` — PASS.
- `npm run test` — PASS, 137 files / 1,011 tests.
- Targeted financial, transaction grouping, money-product, and Loans 11B tests — PASS.
- `npm run build` — PASS.
- Authenticated browser smoke at `/en/money/loans` and Add loan — PASS; empty/create surfaces load without new console errors. Populated payment UI was not available in the fixture, so payment behavior was verified through the remote RPC scenario and source-level grouping tests.
- Changed-file Prettier checks for TS, JSON, and Markdown — PASS.
- `npm run format:check` — repository-wide warnings remain in pre-existing files outside this change set; no changed-file formatting failure remains.

Changed production scope is limited to Loan commands/RPC boundary, Loan payment/create UI fee removal and idempotency key generation, transaction linkage/grouping, migration, and regression tests. Fees, overdue UX, partial-payment UX, and all non-P0 audit items remain deferred to later Loans tracks.
