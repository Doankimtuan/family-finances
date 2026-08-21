# Debt 10E — Detail, Payment & History UX

Date: 2026-08-21

## Scope

Debt detail, payment, payment receipt, and payment history only. Existing 10B integrity/account guards and 10D create/edit behavior were preserved.

## Implemented

- Added explicit Debt read results for detail and payment history: loading, not-found, read-error, and history-partial-error paths are distinct.
- Rebuilt detail into a flat hierarchy: remaining principal first, due state/date, then descriptive and origin facts. Optional facts are omitted when absent.
- Wrapped detail, history, payment review, and receipt amounts with `FinancialValue` so global privacy masks every Debt amount.
- Added a dedicated detail loading skeleton and retry actions for detail/history read errors.
- Linked origin and payment-history rows to the related Transaction without exposing raw IDs.
- Kept the payment flow as form → review → receipt, with borrowed/lent labels, liquid-account filtering, remaining-amount validation, effective date, completion state, and idempotent replay messaging.
- Added explicit payment account-load failure and no-eligible-account states; these cannot appear as a valid empty selector.
- Added `role="status"` and `aria-live="polite"` to transaction receipts for assistive announcement.
- Preserved offline read-only messaging, 440px shell, restrained motion, transaction semantics, and no-delete behavior.

## Verification

Focused regressions: **11 files, 99 tests passed**.

Full suite: **136 files, 1005 tests passed**.

Also passed:

- `npm run lint`
- `npm run typecheck`
- `npm run e2e:auth-check` — 3 authenticated browser tests passed
- `npm run build`

Browser evidence was captured with the authenticated fixture at 390px and 440px for the Debt empty state, plus the 390px dark not-found state and reduced-motion attempt:

- `output/playwright/debt-list-10e-empty-440-light.png`
- `output/playwright/debt-list-10e-empty-390-dark.png`
- `output/playwright/debt-detail-10e-not-found-390-dark.png`
- `output/playwright/debt-detail-10e-not-found-390-dark-reduced.png`

The configured authenticated fixture contains no Debt record, so a persisted detail/payment/receipt visual flow could not be exercised without creating financial data. Component and privacy tests cover the populated history, amount masking, and transaction-link behavior.

## Verdict

**DEBT DETAIL/PAYMENT READY**
