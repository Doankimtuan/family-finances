# CommandCode Handoff

Build one coherent Money batch without reopening business decisions.

## Read First

1. `artifacts/screen-blueprints/money-transactions-accounts/CURRENT/money-transactions-accounts-blueprint.md`
2. `artifacts/screen-blueprints/money-transactions-accounts/CURRENT/acceptance-criteria.md`
3. `artifacts/screen-blueprints/money-transactions-accounts/CURRENT/implementation-boundary.md`
4. `artifacts/screen-blueprints/app-shell-home/CURRENT/app-shell-home-blueprint.md`
5. Current files under `app/[locale]/(product)/money/`

Do not read archived or historical artifacts for this batch.

## Build Order

1. Transaction success receipt.

   Start here because Phase E0 left this unresolved. On successful `recordTransactionAction`, use `transactionId` and `inboxItemId` to show a receipt or route to transaction detail with receipt state. Do not silently redirect to Money or Inbox.

2. Capture failure and duplicate-submit recovery.

   Preserve form values on error, state that no transaction was recorded, lock pending submit, and generate a new idempotency key only for a new "Record another" form.

3. Refund preview-confirm and receipt.

   Use existing `refundTransactionAction` result fields. Show original expense, requested amount, destination account, linked refund record, capacity restored when present, and next actions.

4. Correction preview-confirm and receipt.

   Use existing `correctTransactionAction` result fields. Show original, reversal, correction, corrected facts, and next actions.

5. Transfer flow if included in the implementation batch.

   Keep transfer neutral: source decreases, destination increases, household total unchanged. Use preview-confirm and receipt.

6. Account opening balance receipt/preview.

   When opening balance posts real ledger state, preview effect and show receipt or account-detail receipt state.

7. Money Hub and list polish.

   Keep hub vertical and calm. Improve states, linked transaction row labels, search/empty/offline behavior, and account grouping only as needed by the flow work above.

## Implementation Notes

- Keep components local to Money until reuse justifies `shared/patterns`.
- Use existing route builders. Add missing constants to `APP_PATH` before using them.
- Use domain/application constants before adding UI strings or option keys.
- Keep categories and jar references as meaning only.
- Do not change ledger calculations, transaction states, account lifecycle, or database schema unless a separate approved backend task requires it.
- Every changed screen needs English and Vietnamese copy.
- Verify at 390px and 440px in a real browser.

## Highest-Risk Existing Gap

`CaptureTransactionForm` currently redirects on success:

- `APP_PATH.INBOX` when `inboxItemId` exists.
- `APP_PATH.MONEY` otherwise.

Replace that user experience with a visible receipt. The receipt must include transaction summary, amount, account, category/unmapped state, effective date, related records, next actions, duplicate-submit protection, and failed-save recovery.

## Done Means

- Receipts exist for capture, correction, refund, and transfer if transfer ships.
- Preview-confirm exists for transfer, correction, refund, and opening balance posting.
- Offline/read-only and failure states clearly say no unsafe write happened.
- Browser evidence exists for mobile, dark/light, English/Vietnamese, success, error, empty, and offline states.

