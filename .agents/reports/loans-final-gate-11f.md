# LOANS 11F.1 — Remote Alignment + Browser Re-certification

Date: 2026-08-23

## Verdict

# LOANS REFERENCE READY

## Remote alignment

Applied `supabase/migrations/20260823090000_loans_final_gate_account_eligibility.sql` to the linked development database using the direct linked database query path. The normal `supabase db push` command remains unable to reconcile unrelated remote-only migration history entries.

Remote catalog verification passed:

- `guard_loan_payment_account_eligibility()` exists and is executable by `authenticated`.
- `loan_payment_account_eligibility` is enabled on `public.loan_payments`.

Authenticated disposable User A/User B regression passed:

| Case                                                       | Result          |
| ---------------------------------------------------------- | --------------- |
| Brokerage/investment source                                | Rejected        |
| Savings-product source                                     | Rejected        |
| Credit-card source                                         | Rejected        |
| Archived source                                            | Rejected        |
| User B mutates User A personal Loan                        | Rejected        |
| User B uses User A personal account                        | Rejected        |
| User A pays User A personal Loan from owned liquid account | Accepted        |
| User A retries with the same key                           | Accepted replay |
| Payment rows after retry                                   | Exactly 1       |

Fixtures and temporary test users were cleaned after verification.

## Browser certification

Updated `scripts/loans-11e-verify-browser.mjs` to use current Loans IA/test IDs. It no longer expects the removed `loan-summary` markup or counts hidden duplicate render trees. The harness now covers:

- Loans list/overview and create sheet open/close
- Detail Overview, Schedule, and History tabs
- VI/light at 390px
- EN/dark at 440px
- 768px and 1280px regression viewports
- overdue payment, principal/interest review, receipt, and idempotent backend completion
- rate-history panel and localized payment history
- closed/paid loan state
- privacy ON/OFF
- reduced motion
- no horizontal overflow, raw i18n keys, or browser console errors

Browser result: PASS at 390, 440, 768, and 1280px.

The recoverable rate-history error branch remains implemented at the server read boundary and preserves the rest of the detail view; the browser fixture exercises the healthy rate-history panel because forcing a server read failure would require changing shared remote schema/permissions.

## Payment UX and scope

- Payment uses `ActionSheetLayout` and the shared sticky action footer.
- Principal and interest are visibly split; principal remains neutral and interest remains Expense in the authoritative ledger contract.
- Source account filtering and the remote trigger enforce the same eligible-account set.
- Expected failures return recoverable typed errors; retry keys remain idempotent.
- Full settlement/payoff mutation is intentionally not implemented.

`DEFERRED V1 SCOPE`: full settlement/payoff mutation. It is not part of the current supported Loans mutation contract and does not block reference readiness.

## Validation

- Loans-focused, EMI/schedule, ownership/security, idempotency, Transactions/Home semantics, privacy, and i18n tests: PASS.
- Authenticated Loans browser certification: PASS.
- Changed-file lint: PASS.
- Typecheck: PASS.
- Build: PASS.
- Full unit suite: existing unrelated Home/motion/investment baseline failures remain documented separately and do not block Loans.
- Full repository lint: existing unrelated baseline errors remain in `scripts/home-compact-cta-check.cjs`.
