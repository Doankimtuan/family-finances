# Phase 7 — Visual validation

## Routes tested

| Route | Role | Result |
| --- | --- | --- |
| `/en/money` | Hub: Growing money / Borrowed & owed | Savings 30 active; Loans none; Debts nothing owed |
| `/en/money/savings` | Savings inventory | Principal held hero; product cards; Principal caption; Maturing soon / Active + days left |
| `/en/money/savings/[id]` | Product detail | Principal ₫1,578,857; Matures Sep 12, 2026; rate 6.3%; term 14 days; Settle early |
| `/en/money/savings/new` | Create wizard | Provider / package / rate / term / maturity already first |
| `/en/money/loans` | Loans list | Empty: remaining-principal copy + Add loan |
| Loans create sheet | Existing wizard | Name, ownership, lender, type, Principal; “borrowed cash is not added to an account” |
| `/en/money/debts` | Debts list | Empty: household/other-people copy + Add record |
| Debts create sheet | Existing sheet | Ownership → I borrowed / I lent → counterpart → amount |

Populated loan list/detail and populated debt list/detail were **not** available in this household.

## Viewports

Centered 440px shell is unchanged (`AppViewport` / `ChromeShell`). No desktop dashboard.

| Viewport | Expected | Result |
| --- | --- | --- |
| 390 | Scan rows, no overflow | Same 440px shell observed in Cursor browser; explicit CSS width override not applied |
| 440 | Canonical shell | Verified on Savings / Loans / Debts |
| 768 | Same product, centered | Not separately captured; shell CSS unchanged |
| 1280 | Same 440px shell | Not separately captured; shell CSS unchanged |

## Light / dark

Dark theme fully exercised (authenticated session). Light class toggle was attempted in-page; a durable light-theme screenshot was not captured because the browser screenshot layer lagged behind the accessibility tree. Tokens only (`hero-*`, `text-*`, `surface-*`, savings vs debt icon tones). Direction and lifecycle use **labels**, not color alone.

## Accessibility

- Savings row: principal + “Principal” + maturity badge text; `min-h-14`
- Loan row: remaining principal caption + next payment text; no color-only status
- Debt row: `directionLabel` in the subtitle and as the icon label; `data-debt-direction`
- Privacy: `FinancialValue` masking; tests assert amounts are not copied into `aria-label`
- Debt hero requires a visible direction sentence under the outstanding amount

## Authenticated limitation

Session was available. Auth was **not** bypassed.

Verified live:

- Money → Savings list (30 Tikop products) → one product detail
- Savings create step 1
- Loans empty + Add loan sheet (dismissed, not saved)
- Debts empty + Add record sheet (dismissed, not saved)

Not live-verified:

- Loan remaining-principal row/detail (no loans)
- Debt payable vs receivable grouping (no debts)
- Settlement / payment mutations (not executed; would change financial state)
- Explicit 768 / 1280 / persisted light theme

## Known visual limits

- Savings list still shows existing **Expected** interest/received/tax under “At a glance” — labeled expected, not principal.
- Screenshot tool sometimes showed a stale overlay; DOM/`innerText`/accessibility snapshots were the source of truth for route content.
- Vietnamese product names wrap; existing `text-pretty` / truncate on titles.
