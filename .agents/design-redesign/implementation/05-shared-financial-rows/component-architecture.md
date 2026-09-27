# Implementation 05 — Component Architecture

**Phase**: Implementation 05 — Shared Financial & Row Components  
**Architecture Layer**: Shared Composite Components  
**Directory Target**: `shared/patterns/` & `shared/ui/`

---

## 1. Composition Hierarchy

ViNha follows a strict 7-layer component hierarchy:

```text
Foundations (Tokens, Theme, CSS)
  ↓
Primitive Controls (Button, Input, Select, Checkbox, Icon, Text)
  ↓
Infrastructure (Dialog, BottomSheet, Toast, EmptyState, FormSection)
  ↓
App Shell (TopAppBar, BottomNavigation, AppViewport)
  ↓
Shared Composite Components (BaseRow, FinancialAmount, KeyValueList, ProgressSummary)
  ↓
Domain Presentation Components (TransactionRow, AccountRow, SavingsRow, LoanRow, MemberRow)
  ↓
Feature Screens (Page Views, Sheets, Hubs)
```

Implementation 05 implements the **Shared Composite** and **Domain Presentation** rows.

---

## 2. Base Row Strategy

To avoid the **MegaComponent Anti-Pattern** (a single component with 40 optional props and tangled branching), we establish a clear two-tier row architecture:

```text
               ┌───────────────────────┐
               │        BaseRow        │
               │ (Geometry, Slots, a11y│
               │  Dividers, Link/Btn)  │
               └───────────┬───────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ NavigationRow │   │  KeyValueRow  │   │ FinancialRow  │
│(Chevron, Link,│   │(Dot leader,   │   │(Amounts, Meta,│
│ Badges, Nav)  │   │ Label + Value)│   │ Visual Tones) │
└───────────────┘   └───────────────┘   └───────┬───────┘
                                                │
       ┌───────────────┬────────────────────────┼───────────────┬───────────────┐
       ▼               ▼                        ▼               ▼               ▼
┌──────────────┐┌──────────────┐         ┌──────────────┐┌──────────────┐┌──────────────┐
│TransactionRow││  AccountRow  │         │  SavingsRow  ││InvestmentRow ││   LoanRow    │
│(Expense, Inc,││(Asset vs     │         │(Rate, Term,  ││(Qty, Price,  ││(Principal,   │
│ Transfer)    ││ Credit card) │         │ Accrued yield││ Market value)││ Next payment)│
└──────────────┘└──────────────┘         └──────────────┘└──────────────┘└──────────────┘
```

### BaseRow Responsibilities

- **Dimensions**: Enforces min-height 52px (standard) / 64px (financial instrument / 2-line).
- **Hit Area**: Guaranteed 44px+ touch target.
- **Slot Composition**:
  - `leading`: Slot for 32px or 40px icon containers, provider logos, or avatars.
  - `title` & `subtitle`: Two-line text stack with truncation and responsive wrapping.
  - `trailing`: Trailing slot for tabular amounts, status pills, or controls.
  - `action` / `chevron`: Trailing forward chevron or contextual button.
- **Divider Laws**:
  - `divider="inset"`: 1px subtle divider indented 56px to visually clear the leading icon.
  - `divider="full"`: 1px divider spanning the entire width.
  - `divider="none"`: No divider (e.g. last item or inside isolated cards).
- **Semantics**:
  - If `href` is supplied, renders as Next.js `Link` with semantic link role and focus rings.
  - If `onClick` / `onPress` is supplied without `href`, renders as accessible `button`.
  - If non-interactive, renders as standard `div` or `li` without misleading hover states.

---

## 3. Server / Client Boundary Rules

1. **Server Components by Default**:
   - `BaseRow`, `NavigationRow`, `KeyValueList`, `KeyValueRow`, `FinancialMetric`, `MemberRow`, `ProviderRow`, and `StatusRow` have **no client hooks** and render purely on the server.
2. **Client Components Only When Required**:
   - `FinancialAmount`: Client component ONLY when `privacyAware={true}` to subscribe to `useFinancialPrivacy()` (otherwise renders plain tabular numbers).
   - `Progress`: Client component because of `motion/react` animation and privacy toggle.
   - `TransactionRow`: Client component when privacy masking is enabled for the trailing amount.

---

## 4. No Invalid Nested Interactive Elements

HTML forbids nesting interactive elements (e.g., `<button>` or `<select>` inside `<a>`).
When a row requires both a main navigation click AND a secondary action button (such as an edit/more menu):

- The row architecture decouples the main row link from the action button using CSS relative positioning or separate button triggers.
- No row wraps action buttons inside an outer `<Link>` tag.
