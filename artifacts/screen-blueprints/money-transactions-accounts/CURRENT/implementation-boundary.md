# Implementation Boundary

This phase is documentation only. Do not modify application code as part of Phase E2.

## Files Likely To Change In Implementation

Likely screen files:

- `app/[locale]/(product)/money/page.tsx`
- `app/[locale]/(product)/money/money-hub-accounts.tsx`
- `app/[locale]/(product)/money/money-capture-action.tsx`
- `app/[locale]/(product)/money/accounts/add-account-form.tsx`
- `app/[locale]/(product)/money/accounts/[id]/page.tsx`
- `app/[locale]/(product)/money/accounts/[id]/account-detail-actions.tsx`
- `app/[locale]/(product)/money/transactions/page.tsx`
- `app/[locale]/(product)/money/transactions/transactions-filter-bar.tsx`
- `app/[locale]/(product)/money/transactions/new/page.tsx`
- `app/[locale]/(product)/money/transactions/capture-transaction-form.tsx`
- `app/[locale]/(product)/money/transactions/[id]/page.tsx`
- `app/[locale]/(product)/money/transactions/[id]/correct/correct-transaction-form.tsx`
- `app/[locale]/(product)/money/transactions/[id]/refund/refund-transaction-form.tsx`
- `app/[locale]/(product)/money/transactions/actions.ts`
- `app/[locale]/(product)/money/transactions/mutate-actions.ts`

Likely application API files only if needed by UI handoff:

- `modules/ledger/application/commands/record-transaction.ts`
- `modules/ledger/application/commands/correct-transaction.ts`
- `modules/ledger/application/commands/refund-transaction.ts`
- `modules/ledger/application/commands/create-account.ts`
- `modules/ledger/application/queries/get-transaction.ts`
- `modules/ledger/application/queries/get-transaction-audit-chain.ts`
- `modules/ledger/application/queries/list-transactions.ts`
- `modules/ledger/application/queries/list-accounts.ts`
- `modules/ledger/application/ledger-constants.ts`
- `modules/ledger/application/transaction-types.ts`
- `modules/ledger/application/account-types.ts`
- `modules/tenancy/application/app-path.ts`

Likely shared primitives or patterns:

- `shared/patterns/bottom-action-bar.tsx`
- `shared/patterns/dialog.tsx`
- `shared/patterns/sheet.tsx`
- `shared/patterns/amount-field.tsx`
- `shared/patterns/transaction-row.tsx`
- `shared/patterns/balance.tsx`
- `shared/patterns/empty-state.tsx`
- `shared/ui/status-alert.tsx`
- Future module-local receipt/preview components before shared promotion.

Likely i18n files:

- Existing English and Vietnamese message catalogs for Money.
- Catalog/localized name files only when existing account/category test fixtures require display text.

## Allowed Work

- Add missing route constants to `APP_PATH` before using routes.
- Add domain constants at documented module homes before using labels, states, or option keys in code.
- Add localized message keys for all new visible text.
- Normalize touched Money screens to `Page`, `TopAppBar`, `Section`, shared controls, and semantic tokens when doing so is local to the flow.
- Add local receipt/preview components under Money when the pattern has not yet earned shared ownership.
- Add tests for receipt, duplicate-submit, failed-save recovery, preview-confirm, offline blocking, and route destination behavior.
- Add browser verification artifacts for changed screens.

## Prohibited Work

- Do not modify financial calculations.
- Do not change ledger invariants, transaction state machine, account lifecycle, or category/jar semantics.
- Do not move Money screens to Home, Plan, Inbox, or Together.
- Do not add or remove primary navigation tabs.
- Do not reintroduce `/money/add` as a visible mental-model route.
- Do not treat transfer as income or expense by default.
- Do not treat linked refund as ordinary income.
- Do not silently rewrite original transaction facts during correction.
- Do not make credit limits count as owned money.
- Do not create a dense banking dashboard, spreadsheet replacement, or desktop-only Money layout.
- Do not hardcode visible strings, route strings, semantic constants, colors, or financial labels in UI code.
- Do not import from `archive/legacy-v1`.

