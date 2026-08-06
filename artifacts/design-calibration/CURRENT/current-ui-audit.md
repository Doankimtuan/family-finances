# Current UI Audit

## Browser Access Finding

The product routes are protected by authentication. Local `.env.local` does not provide `E2E_USER_EMAIL` or `E2E_USER_PASSWORD`, and disposable registration was rejected by the backend. Browser inspection could therefore verify route protection and auth shell behavior, but not authenticated ready/empty/success states for the three target product screens.

## Home

- Current hierarchy: TopAppBar, real position KPI, Plan pulse, Inbox, Health chip, day-zero trio.
- Current component usage: TopAppBar, BrandMark, Balance, KpiBlock, HomeCaptureAction, HomeInboxCta, HomeHealthChip, HomeDayZeroTrio.
- Visual inconsistencies: page rhythm was hand-authored instead of shared.
- Interaction inconsistencies: primary capture action existed, but page shell was not reusable.
- Reusable pieces: Balance, KpiBlock, TopAppBar, QuickAction.
- Deprecated pieces: none found.
- Accessibility issues: protected state verified; authenticated screen still needs browser focus and text-fit evidence.
- Responsive issues: authenticated 390px/440px verification remains blocked.

## Money Activity Surface

- Current hierarchy: real position summary, capture action, accounts scan, recent activity, more links, full activity list route.
- Current component usage: TopAppBar, Balance, MoneyCaptureAction, MoneyHubAccounts, MoneyAccountsScan, TransactionRow, TransactionsFilterBar.
- Visual inconsistencies: hub and list repeated page padding instead of using a shared Page primitive; "more" rows used a text arrow instead of icon family.
- Interaction inconsistencies: list route has filter/apply/add actions but needs authenticated browser review for focus order and long-list behavior.
- Reusable pieces: TransactionRow, EmptyState, MoneyOfflineBanner, SectionHeader, MoneyAccountsScan.
- Deprecated pieces: text arrow row affordance replaced by Phosphor icon in client component.
- Accessibility issues: search/filter labels exist; authenticated long-list keyboard evidence remains blocked.
- Responsive issues: protected route redirects verified at 440px; data-dense state requires authenticated fixture.

## Daily Money Capture

- Current hierarchy: direction, amount, account, tag, jar, note, save/cancel.
- Current component usage: AmountField, TextField, StatusAlert, Button, fieldsets, radio groups.
- Visual inconsistencies: submit/cancel lived inline at the bottom of the form instead of a sticky mobile action zone.
- Interaction inconsistencies: invalid amount did not move focus to the amount field.
- Reusable pieces: AmountField, field labels, Button, StatusAlert.
- Deprecated pieces: none.
- Accessibility issues: added preview with polite live region and invalid amount focus.
- Responsive issues: sticky action bar needs authenticated mobile keyboard evidence.

