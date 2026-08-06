# Invariant Checklist

## Ledger

- [x] Money is never created by virtual or interpretive domains.
- [x] Money is never destroyed by correction, reversal, refund, archive, or closure.
- [x] Every ledger mutation is traceable.
- [x] Every transaction has ownership.
- [x] Every reversal has origin.
- [x] Every correction preserves history.
- [x] No orphan transaction may become trusted active truth.
- [x] Ledger is append-only.

## Assets

- [x] Account balance has one owner and explainable deltas.
- [x] Savings principal changes only through confirmed product events.
- [x] Investment principal and value remain distinguishable from cash.
- [x] Loan remaining principal changes only through repayment/correction meaning.
- [x] Card balance excludes credit limit as owned money.
- [x] No domain may silently modify another domain's asset truth.

## Planning

- [x] Virtual Jars never change Ledger.
- [x] Planning never owns money.
- [x] Goals never own money.
- [x] Category never owns money.
- [x] Only Accounts own money location.
- [x] BR-01 remains immutable.

## Cross-Domain

- [x] Savings, Investments, Loans, and Cards settle through Accounts and Transactions.
- [x] Refunds and corrections reference originals.
- [x] Inbox acknowledgement never mutates Ledger.
- [x] Health never mutates anything.

## Required Engineering Proof

- [ ] Database constraints enforce ledger links and ownership.
- [ ] Event registry defines idempotency and ownership.
- [ ] Worker implementation proves deterministic replay.
- [ ] Invariant tests cover concurrency and failure recovery.

