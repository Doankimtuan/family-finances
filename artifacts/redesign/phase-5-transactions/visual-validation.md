# Phase 5 — Visual validation

## Live evidence (view-only)

Against `http://localhost:3000` while signed in:

- **List** (`/en/money/transactions`): Today / Yesterday groups, signed amounts, “Needs category” meta, All filter `aria-pressed`, FAB, five tabs with Money current.
- **Add Transaction**: Amount focused; Expense / Income / Transfer; category chips; DatePicker; “Jar and tags”; Cancel / Save. **Not submitted.**
- **Detail** (`/en/money/transactions/822c15e2-…`): “Card purchase”, signed amount, Information facts (Account, Category, Date, Status, Jar, Note, Tags). Correct/refund not used.

## Viewports

Cursor browser session (dark theme). Centered ~440px shell is unchanged. Independent 390 / 768 / 1280 resizes were not available on this tool.

| Viewport | Expected | Result |
| --- | --- | --- |
| 390×844 | Dense ledger rows, wrapping filters, no horizontal scroll | Same composition as live session |
| 440 | Canonical Transactions / Add Transaction | Confirmed in live session |
| 768 | Same product, centered | Not independently resized |
| 1280 | Same 440px shell | Not independently resized |

## Light / dark

Transaction hierarchy (title, meta, signed amount) must remain readable in both themes. Filter selected state uses `aria-pressed` plus primary-soft fill, not color alone.

## Accessibility

- Row links have composed `aria-label` (title + movement)
- Amount also has `sr-only` movement text
- Filter chips expose `aria-pressed`
- 44px chips, empty CTA, load more, FAB
- Color is not the sole financial cue (sign + copy + tone)
- Reduced-motion: existing row press-scale disable

## Authentication

Authenticated with the existing E2E test account. **View-only:** list, detail, Add Transaction form. **No save, refund, correct, or other mutation.**

Session was available. Dark theme was active (`documentElement` dark class).

Cursor browser viewport was used (app remains in the ~440px shell). Independent 390 / 768 / 1280 window resizes were not available on this browser tool; composition is the same single-column shell.

## Known limitations

- No list search UI (events query has no `q`)
- Jar/tags stay off the row to keep scan density
- Capture still uses the existing confirm sheet (consequential save, not silent post)
