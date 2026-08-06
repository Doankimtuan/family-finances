# Calibration Blueprints

## Home Overview

- User purpose: understand what matters today.
- Dominant content: real ledger position.
- Primary action: add expense when not day zero.
- Secondary actions: open Plan, open Inbox, view Health context.
- Page pattern: OverviewPage.
- Information hierarchy: real position, Plan pulse, Inbox decisions, Health, first-use steps.
- Section sequence: top bar, load/error state, real position, plan, inbox, health, day-zero actions.
- Component mapping: Page, TopAppBar, KpiBlock, Balance, QuickAction, Health chip.
- Responsive behavior: single column in 440px AppViewport.
- Loading state: existing server load gate; skeleton remains future gap.
- Empty state: day-zero trio.
- Error state: StatusAlert.
- Dark mode: token-driven through existing theme.
- Accessibility: h1 in top bar, clear amount meaning, 44px actions.

## Money Activity Surface

- User purpose: inspect real money position and recent ledger movement.
- Dominant content: real position on hub; transaction rows on list.
- Primary action: add transaction.
- Secondary actions: create account, see all activity, open product lists, apply filters.
- Page pattern: OverviewPage and ListPage.
- Information hierarchy: ledger summary, account scan, activity, product links; list filters before rows.
- Section sequence: top bar, offline banner, summary/filter, content rows, empty state/back route.
- Component mapping: Page, Section, Balance, MoneyAccountsScan, TransactionRow, EmptyState, TransactionsFilterBar.
- Responsive behavior: single column, rows keep amount aligned with tabular numerals.
- Loading state: existing server load gate; row skeleton remains future gap.
- Empty state: EmptyState with one valid next action.
- Error state: StatusAlert on hub load failure.
- Dark mode: token-driven.
- Accessibility: row links have focus rings; filters have labels and fieldset legends.

## Daily Money Capture

- User purpose: record an income or expense in under 15 seconds.
- Dominant content: amount.
- Primary action: save transaction.
- Secondary actions: cancel, choose optional tag/jar/note.
- Page pattern: CreateFlow.
- Information hierarchy: direction, amount, account, tag, jar, note, preview, sticky action.
- Section sequence: top bar, offline warning, error, required fields, optional context, preview, bottom action.
- Component mapping: Page, TopAppBar, AmountField, TextField, BottomActionBar, StatusAlert.
- Responsive behavior: sticky safe-area action; form remains single column.
- Loading state: pending save label.
- Empty state: no-account warning.
- Error state: inline StatusAlert and invalid amount focus.
- Dark mode: token-driven.
- Accessibility: labels above fields, fieldsets for grouped choices, live preview, 44px controls.

