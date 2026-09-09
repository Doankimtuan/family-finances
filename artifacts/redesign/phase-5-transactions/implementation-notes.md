# Phase 5 — Implementation notes

**Status:** Implemented. Does not overwrite `.agents/design-system.md`.

## What this phase did

Redesign Transactions into a scan-first household ledger and Add Transaction into a faster capture form, using existing read models, mutations, and routes.

Transactions answer: what happened to our money?

Add Transaction answers: can I record a normal movement in about 15 seconds?

## Transactions composition (top → bottom)

1. Compact `TopAppBar` (detail) — back to Money, privacy toggle
2. Offline banner
3. Filter chips (type wrap) + tag filter + clear / manage tags
4. Date-grouped list in one elevated card per day
5. Empty / error / load-more
6. FAB — canonical Add transaction

## Add Transaction composition

1. Form `TopAppBar` — back to Transactions (existing)
2. Mode: expense / income / transfer (existing)
3. Amount (dominant, numeric `inputMode`, autofocus)
4. Account
5. Category chips
6. Date (shared `DatePickerField`)
7. Note (optional, still one field)
8. Jar + household tags behind “Jar and tags”
9. Effect preview when amount + account exist
10. Sticky split Cancel / Save + existing confirm sheet

## Interaction decisions

- Date grouping reused `effectiveDate`; Today/Yesterday stay i18n keys.
- Filters stay URL-backed (`type`, `tags`, `cursor`). Chips wrap instead of a clipped horizontal strip.
- Search deferred: events list has no `q`.
- Empty CTA uses existing `APP_PATH.MONEY_ADD`. Filtered empty clears filters.
- Load failure uses shared `ErrorState`.
- Signed amounts keep sign + tone + assistive movement copy. Color is not the only cue.
- Optional jar/tags are disclosed so the default path is amount → account → category → save.
- Save still opens the existing confirmation sheet; mutation payload unchanged.
- Account test session: view-only; no capture save in browser.

## Shared components reused

`Page`, `TopAppBar`, `TransactionRow`, `EmptyState`, `ErrorState`, `FilterChip`, `AmountField`, `DatePickerField`, `ChoiceTile`, `BottomActionBar`, `FinancialValue`, `Amount`, `FinancialPrivacyToggle`, `FloatingAction`, `StatusAlert`, `AppIcon`, `IconContainer`, `Sheet` confirm flow.

## New local pieces

- `transactions-list-presentations.ts` — list title/subtitle/grouping/href helpers (presentation only)
- Capture `<details>` for jar/tags (no new shared primitive)

## i18n

`messages/en/money.json` + `messages/vi/money.json`:

- `transactionsPage.emptyDescription`
- `transactionsPage.amountAria.*`
- `captureForm.moreDetails`

## Contract safety

Database, API, RPC, auth, validation, ledger math, activity classification: unchanged. Five tabs and 440px shell: unchanged. No mock rows.
