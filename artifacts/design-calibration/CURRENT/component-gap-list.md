# Component Gap List

## Approved For Reuse

- AppViewport
- TopAppBar
- BottomNavigation
- Balance
- KpiBlock
- SectionHeader
- EmptyState
- StatusAlert
- AmountField
- TextField
- Button
- QuickAction
- TransactionRow
- MoneyAccountsScan
- MoneyOfflineBanner

## Newly Introduced And Approved

- Page: shared product screen rhythm.
- Section: shared non-card section grouping.
- BottomActionBar: sticky safe-area action zone for long mobile forms.

## Requires Further Calibration

- TransactionRow: needs authenticated long-list evidence for very long Vietnamese labels and long currency values.
- TransactionsFilterBar: should be promoted toward `SearchField` and `SegmentedField` only after another list needs the same pattern.
- Capture preview: should become `MoneyMovementPreview` after confirmation/receipt work proves the exact contract.
- Loading skeletons: Page and ListPage need shaped skeleton usage during future screen implementation.
- Success receipt: still missing for daily capture because authenticated submission could not be verified.

## Not Needed In E0

- Debt, investment, and planning token aliases.
- Dialog redesign.
- Drawer.
- Chart primitives.
- Illustration primitives.

