# Acceptance Criteria

Implementation of the Money, Transactions, and Accounts batch is complete only when every applicable criterion passes.

## IA And Ownership

- Money remains the owner of financial position, accounts, transaction activity, capture, transfer, correction, refund, and money-product entry points.
- Bottom navigation remains exactly Home, Money, Plan, Inbox, Together.
- All new links use `APP_PATH` or route builders from `modules/tenancy/application/app-path.ts`.
- No visible UI links to retired mental-model routes such as `/money/add` or `/money/cards`.
- Home launches owner routes only and does not write ledger state.

## Money Hub

- Shows one dominant real-position amount with currency and meaning.
- Separates liquid accounts from credit obligations and money products.
- Credit limits and outstanding card facts do not inflate owned money.
- Provides recent activity and a route to transaction search/list.
- Shows first-use, partial/stale, offline, permission, loading, and recoverable error states.
- Uses vertical sections and rows inside the 440px shell, not a dense dashboard grid.

## Accounts

- Empty accounts state explains no real containers are tracked and offers one primary add-account action.
- Account rows show name, broad type, amount meaning, and non-active status where applicable.
- Account detail shows balance, ownership/status hint, facts, recent account activity, and lifecycle actions.
- Create account blocks jar/goal/budget/plan misuse through copy and validation.
- Opening balance creation previews real posting effect before submit.
- Account creation with opening balance shows a receipt or account detail receipt state.
- Archive/close/historical actions confirm active-use impact, history preservation, and whether money moves.
- Historical/closed accounts cannot be ordinary transaction targets.

## Transactions List

- Search and filter preserve financial meaning and do not imply missing money when no results match.
- Rows show direction/status, amount, account/date context, and linked refund/correction/reversal relation where relevant.
- Long list return preserves scroll position where practical.
- Empty history and empty search have distinct copy.
- Offline state keeps browsing read-only and blocks money mutation actions.

## Capture And Transfer

- Income/expense capture order is mode, amount, account, date, meaning, note, preview, save.
- Transfer capture order is mode, amount, from account, to account, date, note, preview-confirm.
- Transfer preview says source decreases, destination increases, and household total remains unchanged.
- Category and jar references are described as meaning only, not money movement.
- Offline capture/transfer is blocked.
- Submit is disabled or locked while pending.
- Duplicate submit is prevented by control state and idempotency behavior.
- Successful income/expense creation shows receipt; it does not silently redirect to the form, hub, or Inbox.
- Receipt shows amount, account, category/unmapped state, effective date, related records, next actions, real money impact, plan impact, and decision impact.
- "Record another" resets with a fresh form state and idempotency key.
- Failed save preserves input and states that no transaction was recorded and no account balance changed.

## Transaction Detail

- Detail separates real money facts from category/jar/note meaning.
- Corrected, reversed, and refunded relationships are visible before or near actions.
- Refund linked records do not appear as ordinary income.
- Allowed metadata edit does not imply money facts changed.
- Detail actions are hidden/disabled based on transaction eligibility and status.

## Correction

- Correction uses preview-confirm before committing.
- Preview names original transaction, corrected transaction, account effect, amount, effective date, related reversal/correction records, and audit preservation.
- Pending correction locks controls and prevents duplicate submit.
- Success receipt shows original, reversal, correction, corrected facts, and next actions.
- Failure preserves edits and states that original transaction remains unchanged.

## Refund

- Refund uses preview-confirm before committing.
- Preview names original expense, maximum refundable amount, requested amount, destination account, effective date, and linked refund record.
- Refund is described as a linked real-money event, not ordinary income.
- Pending refund locks controls and prevents duplicate submit.
- Success receipt shows amount, destination account, original transaction link, refund transaction link if exposed, capacity restored if returned, and next actions.
- Failure preserves input and states that no refund was recorded and no account balance changed.

## Shared UI, Content, And Accessibility

- Existing `shared/ui` and `shared/patterns` are reused before creating new primitives.
- New repeated preview/receipt components start module-local unless they meet shared promotion criteria.
- All visible strings are localized in English and Vietnamese.
- No hardcoded colors; use semantic tokens.
- WCAG AA contrast passes in light and dark mode.
- Touch targets are at least 44px.
- Dialogs/sheets trap focus and restore focus on close.
- Errors are announced and field-linked where possible.
- Amount/date accessible labels include meaning and currency/date context.
- Reduced motion removes nonessential transitions and money values do not animate.

## Browser Evidence

Capture evidence for:

- Money Hub at 390px light Vietnamese.
- Money Hub at 440px dark English.
- Empty account/activity state.
- Offline/read-only Money state.
- Transaction capture initial, validation failure, pending/duplicate lock, success receipt, and failed-save recovery.
- Transfer preview-confirm and receipt if transfer ships in the batch.
- Correction preview-confirm, success receipt, and failure recovery.
- Refund preview-confirm, success receipt, and failure recovery.
- Long Vietnamese copy state without overlap or truncated financial meaning.

