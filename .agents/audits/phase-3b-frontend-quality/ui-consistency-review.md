# Shared UI Consistency Review

## 1. Scope & Objective

Evaluate UI consistency across core and representative secondary screens in accordance with the **ViNha Persistent UI Constitution** and **Warm Precision Design System**:

### Core Screens:

- **Home** (`/[locale]/home`)
- **Money Hub** (`/[locale]/money`)
- **Add Transaction** (`/[locale]/money/add` / `new`)
- **Plan Hub** (`/[locale]/plan`)
- **Inbox** (`/[locale]/inbox`)

### Secondary Screens:

- **Accounts** (`/[locale]/money/accounts`)
- **Transactions** (`/[locale]/money/transactions`)
- **Savings** (`/[locale]/money/savings`)
- **Investments** (`/[locale]/money/investments`)
- **Loans** (`/[locale]/money/loans`)
- **Together** (`/[locale]/together`)

---

## 2. Evaluation Against Design System Standards

### A. Viewport Shell & Layout (Mobile-First 440px)

- **Standard**: Centered `max-width: 440px` app shell at every viewport size (mobile, tablet, desktop). Desktop preserves the single-column layout without split-pane deviations.
- **Audit Result**: **Consistent**.
  - Verified across 360×640, 390×844, 440×900, 768×1024, and 1280×900.
  - On viewports wider than 440px, the application shell centers cleanly with backdrop framing and zero layout shifts.
  - Page gutters adhere to tokenized `--page-gutter` (16px / 1rem).

### B. Header Hierarchy & Back Navigation

- **Standard**: Composable `TopAppBar` (`PRIMARY`, `CONTEXTUAL`, `DETAIL`, `FORM`).
  - Primary tabs (Home, Money, Plan, Inbox, Together) use `PRIMARY` with level 1 headings.
  - Sub-screens (Accounts, Transactions, Savings, Investments, Loans) use `DETAIL` with `ArrowLeft01Icon` back navigation.
  - Back buttons enforce standard touch targets: `min-h-11 min-w-11` (44×44px).
  - Trailing action slots align vertically and semantically.
- **Audit Result**: **Consistent**.
  - All screens inspected employ `TopAppBar` with canonical variants.
  - No custom or duplicate headers were found.
  - Accessible labels (`aria-label={tA11y("back")}`) are consistently provided.

### C. Button Heights & Action Variants

- **Standard**:
  - Semantic variants: `primary`, `tonal`, `secondary`, `outlined`, `ghost`, `destructive`.
  - Sizing standard:
    - `sm`: 36px (`h-9 min-h-9 px-3 text-xs`) with touch-target expansion to 44px.
    - `md`: 44px (`h-11 min-h-11 px-4 text-sm`).
    - `lg`: 52px (`h-13 min-h-13 px-5 text-base font-semibold`).
  - HeroUI v3 is the canonical primitive. No competing button systems.
- **Audit Result**: **Consistent**.
  - All button call sites adhere to the 3 standard heights.
  - Touch target accessibility rules (WCAG 2.5.5 / 2.5.8) are satisfied.

### D. Typography Hierarchy

- **Standard**: Geist Sans font stack, semantic `Heading` (`level={1}` to `level={4}`) and `Text` primitives. No arbitrary font sizes or ad-hoc Tailwind text sizes.
- **Audit Result**: **Consistent**.
  - Hierarchy flows predictably: Screen Title (24px–28px, bold) → Section Header (16px–18px, semibold) → Row Title (14px–15px, medium) → Secondary Metadata (12px–13px, regular).
  - Text truncation with `truncate` or `line-clamp-2` prevents layout breaking on long Vietnamese names.

### E. Financial Formatting & Monetary Display

- **Standard**:
  - `Amount` / `FinancialAmount` primitives for all balances and amounts.
  - Display formatting strictly decoupled from persisted values.
  - Vietnamese Dong (`₫` / `VND`) formatted consistently without raw inline string concatenation.
- **Audit Result**: **Consistent**.
  - Inflows/income render in `--color-income` (emerald).
  - Outflows/debt render in `--color-debt` (rose/red).
  - Investments render in `--color-invest` (blue/teal).

### F. Feedback States (Empty, Loading, Error, Alerts)

- **Standard**:
  - Empty states use `EmptyState` primitive with Stitch iconography and action buttons.
  - Loading states use `LoadingState` with skeleton shimmer or spinner.
  - Inline warnings use `InlineAlert` or `StatusAlert` with semantic tone badges.
- **Audit Result**: **Consistent**.
  - Checked empty transactions list, empty savings list, and zero-loan states.
  - All empty states provide actionable next steps ("Add transaction", "Create goal", "Open account").

### G. Light & Dark Theme Parity

- **Standard**:
  - Fully tokenized theme system (`bg-surface-raised`, `bg-surface-muted`, `text-text-primary`, `text-text-secondary`, `border-border-subtle`).
  - Zero hardcoded hex colors.
- **Audit Result**: **Consistent**.
  - Screenshots captured in both light and dark themes confirm proper background contrast, legibility, and icon tone parity.

---

## 3. Summary of Findings

| Area                     | Status | Notes                                            |
| :----------------------- | :----: | :----------------------------------------------- |
| **App Shell (440px)**    |  Pass  | Preserved cleanly on mobile and desktop          |
| **Headers & TopAppBar**  |  Pass  | Uniform variant usage and 44px back targets      |
| **Button Standard**      |  Pass  | Sizing (36/44/52px) and semantic variants intact |
| **Typography**           |  Pass  | Consistent scale and truncation resilience       |
| **Financial Formatting** |  Pass  | Strict use of `FinancialAmount`                  |
| **Empty/Loading States** |  Pass  | Canonical primitives used across modules         |
| **Light/Dark Contrast**  |  Pass  | WCAG AA compliant across all tokens              |
