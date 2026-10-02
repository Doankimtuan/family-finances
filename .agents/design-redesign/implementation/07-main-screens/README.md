# Implementation 07 — Main App Shell Screens

## Scope & Objective

Implementation 07 establishes the first complete production vertical slice of ViNha's authenticated interface by migrating the five top-level tab screens:

1. **Home** (`/[locale]/home`): High-level household financial overview, net position, cash flow chart, decision prompts, domain summaries, and shared Add Transaction action.
2. **Money** (`/[locale]/money`): Household financial hub, total liquidity, account list with liability indicators, and navigation to Money modules (Savings, Investments, Loans, Debts).
3. **Plan** (`/[locale]/plan`): Intention and planning hub, budget period summary, allocation health, attention exceptions, upcoming events, and active jars list.
4. **Inbox** (`/[locale]/inbox`): Financial attention and action queue with urgency indicators, categorized filters, and clean empty state.
5. **Together** (`/[locale]/together`): Household identity, member roster, role badges, and pending invitations.

## Invariants Preserved

- **Zero Business Logic Changes**: All data loaders, RPCs, Supabase queries, and Server Actions remain unchanged.
- **Financial Semantics**:
  - `Transfer ≠ Income`, `Transfer ≠ Expense`, `Opening Balance ≠ Income`
  - `Credit Card = Liability`
  - `Jar ≠ Account`, `Planned ≠ Spent`
  - `Progress ≤ 100% clamped`
- **Shell Consistency**:
  - Centered 440px viewport shell (`ChromeShell`) across all screen sizes.
  - Unified `TopAppBar` and `BottomNavigation`.
  - Canonical `BaseRow` and shared row patterns from Implementation 05.
- **i18n & Themes**: Full support for Vietnamese (`vi`) and English (`en`), Light and Dark modes.

## Artifacts in this Directory

- `existing-screen-audit.md`: Phase 1 audit of the 5 screens.
- `screen-component-map.md`: Phase 2 mapping of legacy sections to canonical components.
- `data-contract.md`: Data contracts and invariant documentation.
- `performance-review.md`: RSC boundaries, hydration isolation, zero waterfall analysis.
- `visual-qa.md`: Hierarchy, responsive audit (360/390/430px), theme parity.
- `qa.md`: Typecheck, lint, unit tests, and production build results.
- `changes.md`: Code changes summary.
