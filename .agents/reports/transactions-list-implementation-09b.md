# Transactions List Implementation — 09B

## Summary

Implemented the Transactions landing page as a chronology-first, flat event
stream. The list consumes the canonical financial projector and no longer
uses raw ledger type filters or a newest-100 cap.

## Final IA

Before: vague Activity header, one elevated filter/action card, raw-type
filters, one undated event container, and false-empty newest-100 search.

After: compact Transactions header, separate Add transaction action, four
semantic common filters, secondary tag filters behind More filters, grouped
flat rows, explicit load-more cursor, distinct list states, and persistent
product navigation from the existing shell.

## Header

Uses the shared compact Product Page Header family:

- EN: Transactions — Income, spending, and money movements
- VI: Giao dịch — Thu, chi và các lần chuyển tiền

Add transaction remains the single primary action and uses the existing
`/money/transactions/new` route.

## Filters

Common filters are All, Income, Expense, and Transfer. They run after the
canonical user-event projector:

- Refunds are not Income or Expense.
- Card/payment and principal-neutral events are not Expense.
- Savings movements are not Transfer.
- Only canonical Transfer activities match Transfer.

Tags remain available behind More filters. Search is intentionally deferred
(Option B); the incomplete newest-100 search control was removed.

## Pagination

The server reads eligible ledger history, projects grouped user events, then
applies semantic filtering and a stable event cursor ordered by effective date,
representative creation timestamp, and event ID. Each page contains 25 events
and uses an explicit Load more link. The current implementation keeps the full
read server-side for correctness; the report comment marks the upgrade point
for a semantic database read model/RPC if volume requires it.

## Date grouping

Events are grouped by authoritative transaction date. Today and Yesterday use
localized labels; older dates use localized weekday/date formatting and include
the year when needed. Same-day ordering is deterministic.

## Event rows

Rows use the existing flat `TransactionRow` pattern. Titles and metadata wrap
instead of truncating Vietnamese meaning; amounts stay right-aligned and use
`FinancialValue` privacy masking.

## Transfer

Transfer legs collapse into one neutral event. The row shows source →
destination and an unsigned amount.

## Refund

Refunds remain their own semantic kind and use the refund tone/icon. They are
excluded from the Income filter and do not change the existing reporting policy.

## Product events

Card, debt/loan, savings, and investment rows retain their canonical semantic
kind, direction, tone, and filter eligibility. The page does not infer sign or
classification locally.

## States

- True no-history empty state with Add transaction.
- Filtered empty state with filter-specific copy.
- Distinct read-error alert with retry and preserved filters.
- Route-specific loading skeleton with header, filter, date, and flat-row shape.
- Existing offline banner remains in the page.

## Privacy/accessibility

Rows continue to render amounts through `FinancialValue`, keeping masked
values out of visible and accessible text while preserving title, type,
account, and date context. Filter chips expose pressed state and keep 44px
targets. Date sections have associated headings and rows remain semantic links
with visible text labels in addition to icons and color.

## Responsive/theme

The existing centered 440px shell is preserved at 390, 440, 768, and 1280px.
The stream remains single-column with no desktop dashboard expansion. Styling
uses existing semantic tokens and shared controls for light/dark themes.

## Browser evidence

The route was opened in Chromium at `http://localhost:3000/en/money/transactions`.
Without configured authenticated credentials it correctly redirected to `/en/login`.
Captured unauthenticated smoke evidence:

- `output/playwright/transactions-list-09b/en-login-390.png`

Authenticated populated, filtered, privacy, locale, theme, and width evidence
is a fixture gap in this checkout; no authenticated screenshots are claimed.

## Performance

No client-side full-history payload or virtualization was added. The current
server-side full projection is the smallest correctness-preserving change and
has an explicit upgrade ceiling in the query implementation.

## Validation

- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run test` — passed, 128 files / 968 tests
- `npm run build` — passed
- Focused transaction, semantic, and privacy tests — passed, 47 tests
- Browser smoke — passed redirect/loading path; authenticated fixture unavailable

## Final verdict

`TRANSACTIONS LIST READY WITH FIXTURE GAPS`
