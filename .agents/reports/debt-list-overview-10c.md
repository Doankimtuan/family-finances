# Debt 10C — List/Overview, Privacy & State UX

## Verdict

## DEBT LIST READY

Debt list/overview scope is implemented. Debt financial semantics, mutation
flows, and hard-delete behavior were left unchanged.

## Implemented

- Wrapped Debt overview totals, active remaining values, completed-history
  principal values, progress paid/received values, and the detail principal
  value with `FinancialValue`.
- Replaced the split overview plus generic attention copy with one summary card
  containing payable, receivable, overdue count, due-soon count, and next-due
  context when a due date exists.
- Made active and completed-history rows use the shared interactive Card tone.
  Active remaining is the visually dominant amount; rows keep counterparty,
  borrowed/lent meaning, due state, ownership, and history readability.
- Added the Debt-specific loading skeleton at
  `app/[locale]/(product)/money/debts/loading.tsx`.
- Added a true empty state with its own Add record action, an active-empty
  history-aware state, and a distinct read-error state with Retry. `null`
  read results remain errors and are not converted to empty arrays for display.
- Added explicit Debt read-only offline messaging while preserving the existing
  fail-closed mutation behavior.
- Kept the centered shell, restrained shared motion, localized EN/VI copy, and
  no hard-delete path.

## Browser evidence

Authenticated browser verification used the configured E2E user at
`/en/money/debts`:

- Empty state observed at 390px, 440px, 768px, and 1280px.
- Light and dark theme screenshots captured at 390px.
- Offline state observed at 390px: Debt read-only message rendered and Add
  record was disabled.
- Privacy storage state was toggled ON and OFF in the authenticated browser.

The authenticated household currently has no Debt records, so populated row
and masked-amount screenshots were not available. The repository ownership
harness could not seed its fixture because it refused to move an existing
active membership. Privacy behavior is covered by the shared `FinancialValue`
implementation and focused privacy tests.

## Validation

- Focused Debt/privacy/Home/Transactions regressions: 10 files, 101 tests
  passed.
- Full Vitest suite: 134 files, 998 tests passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Authenticated E2E infrastructure: 3 tests passed.
- `git diff --check`: passed.

## Scope boundary

No Debt edit flow, detail hierarchy redesign, payment-history transaction
links, interest/fee model, or further financial-integrity changes were added.
