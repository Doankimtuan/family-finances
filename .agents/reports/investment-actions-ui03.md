# Investment Actions UI 03 — Buy / Sell / Update Value / Income

## Scope

Implemented the holding-action UX only. Market providers, market-price writes,
price history, charts, valuation rules, cost-basis algorithms, Home/Transactions
classification, and unrelated modules were not changed by UI03.

## Implemented

- Buy and sell now use the shared `ActionSheetLayout` with a safe-area-aware
  sticky footer.
- Buy uses the explicit execution price entered by the user, with dynamic labels
  such as `Giá mua / FPT`, `Giá mua / BTC`, and `NAV / CCQ`.
- Buy previews invested principal, reporting fee, and cash leaving the source
  account. Known insufficient balances are blocked before confirmation.
- Sell uses quantity plus visible MAX, and previews gross proceeds, cash fee,
  estimated net cash received, and estimated realized P&L.
- Fund previews continue to use the existing accounting method and lots, so the
  final domain result remains FIFO-driven.
- TOTAL_VALUE instruments keep their total-value field and do not use a
  quantity-times-unit-price calculation.
- Linked auto-priced holdings show current automatic valuation status and do not
  expose manual valuation as the primary action. Manual/unlinked holdings keep
  manual valuation under More actions (`Cập nhật giá trị` / `Update value`).
- Income remains the existing dividend/distribution action and is available under
  More actions. Closed holdings preserve history and realized P&L, hide Sell and
  More actions, and retain Buy where the current domain safely reopens them.
- Existing idempotency, ownership, fee Expense, principal-neutral, server error,
  and accounting/domain command paths are preserved.

## Browser evidence

Authenticated `.env.local` browser checks passed with reduced motion enabled:

- 390px VI/light: Buy, partial Sell, MAX Sell, execution-price copy, live
  previews, receipt flow, and no horizontal overflow.
- 440px EN/dark: conversion, manual valuation through More actions, income
  through More actions, and no fabricated cash leg.
- Linked FPT: `Giá mua / FPT`, automatic-status detail, and no manual valuation
  item in More actions.
- Linked BTC: `Giá mua / BTC`.
- Linked PVBF fund: `NAV / CCQ`.
- UI01/UI02 regression matrix passed at 390, 440, 768, and 1280px, including
  light/dark, VI/EN, reduced motion, privacy ON/OFF, and offline valuation metadata.

## Validation

- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm test` — 152 files / 1,069 tests passed
- `npm run build` — passed
- UI03 investment E2E — 2/2 passed
- UI01/UI02 investment E2E — 9/9 passed
- Targeted changed-file Prettier check — passed
- Investment accounting, FIFO, fee semantics, idempotency, ownership,
  income, valuation, privacy, i18n, Home/Transactions classification, and
  investment operation tests are included in the full passing suite.

## Verdict

**INVESTMENT ACTIONS UI READY**
