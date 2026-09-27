# ViNha UX Findings & Problem Inventory

This audit synthesizes issues discovered during the real-browser walkthrough and code inspection across the 5 primary tabs and supporting flows.

---

## 1. Information Architecture & Cognitive Load

### Issue 1.1: Liquidity Confusion (Liquid Cash vs Term Savings)

- **Current Behavior**: On `/money`, the Total Position hero shows ₫2,036,547,748, but ₫2,023,800,000 is locked in Tikop term deposits, with only ₫12,747,748 in liquid cash accounts.
- **Why it is a problem**: A partner scanning the app might believe they have ₫2B readily available to spend, causing dangerous spending decisions.
- **Affected Screen(s)**: `/money`, `/home`
- **Severity**: HIGH
- **Design Direction**: Explicitly separate "Sẵn sàng chi tiêu" (Liquid Cash available) from "Đang sinh lời / Tiết kiệm khóa" (Locked Savings & Term Deposits) in the hero card.

### Issue 1.2: Over-budget Jar Anxiety vs Resolution

- **Current Behavior**: On `/plan`, two jars are flagged with alarming red progress bars and badges (_"Hũ shopping cho vợ is over budget by ₫809,244"_).
- **Why it is a problem**: Traditional personal finance apps shame users with red warnings. In a household setting, this triggers partner friction and blame.
- **Affected Screen(s)**: `/plan`, `/plan/jars`
- **Severity**: HIGH
- **Design Direction**: Use calm Warm Precision semantics (Warm Amber / Rose accent with clear neutral framing), pairing the overage immediately with a 1-tap "Điều chuyển cân đối" (Reallocate surplus) action pill.

---

## 2. Navigation & Mobile Ergonomics

### Issue 2.1: Add Transaction Floating Action Button Ergonomics

- **Current Behavior**: The "+ Giao dịch" button floats near the bottom right or center, occasionally overlapping list content or competing with the bottom navigation bar.
- **Why it is a problem**: Violates mobile thumb-reach ergonomics and creates visual collision on compact viewports (390px / 440px).
- **Affected Screen(s)**: `/home`, `/money`, `/plan`
- **Severity**: MEDIUM
- **Design Direction**: Implement a designated elevated floating pill or a dedicated action header cleanly elevated above the 56px bottom navigation bar with safe-area spacing.

### Issue 2.2: Settings & Preferences Nesting

- **Current Behavior**: User settings, dark mode toggle, and language preferences are deeply nested under `/together/settings`.
- **Why it is a problem**: Users struggle to find basic controls like switching to Dark Mode or changing currency display.
- **Affected Screen(s)**: `/together`, `/together/settings`
- **Severity**: MEDIUM
- **Design Direction**: Provide a clean profile/settings modal or quick toggle accessible directly from the Top App Bar avatar or Together header.

---

## 3. Visual Hierarchy & Typography

### Issue 3.1: VND Currency and Tabular Numeral Scanning

- **Current Behavior**: Some amounts render as `₫ 250.000` while others render as `250,000 VND` or plain numbers without `tnum` tabular styling.
- **Why it is a problem**: Uneven widths cause jagged vertical scanning in transaction lists; Vietnamese Dong values have 6–10 digits, making scanning chaotic without tabular figures.
- **Affected Screen(s)**: `/home`, `/money/transactions`, `/plan/jars`
- **Severity**: HIGH
- **Design Direction**: Strictly enforce `font-variant-numeric: tabular-nums` (Geist font) and consistent currency symbol placement (`₫` suffix or prefix with non-breaking space).

### Issue 3.2: Card Density & Contrast in Light/Dark Modes

- **Current Behavior**: Some card borders blend into the `#FAFAF9` canvas in light mode, while in dark mode some text colors lack sufficient contrast against elevated containers.
- **Why it is a problem**: Reduces glanceability and fails WCAG AA standards in outdoor or low-light conditions.
- **Affected Screen(s)**: All primary screens
- **Severity**: MEDIUM
- **Design Direction**: Use the ViNha Warm Precision token system: 1px hairline border (`#DDE4E1` light / `#3F3F46` dark) with stepped surface containers (`#FFFFFF` on `#FAFAF9` light; `#1C1C1F` on `#141416` dark).

---

## 4. Form UX & Numeric Inputs

### Issue 4.1: Monetary Input Precision & Vietnamese Dong Scaling

- **Current Behavior**: Adding a transaction requires typing large numbers (e.g. `2000000`) without clear immediate formatting or quick thousand multipliers (+000, +k).
- **Why it is a problem**: Easy to mistype an extra zero (2,000,000 vs 20,000,000 VND), skewing family budget calculations.
- **Affected Screen(s)**: `/money/transactions/new`, Add Transaction sheet
- **Severity**: HIGH
- **Design Direction**: Large 32px display with live localized formatting, quick unit chips (+10k, +50k, +100k, +500k), and clear account badges.

---

## 5. Decision Inbox Triage & Batching

### Issue 5.1: Review Item Cognitive Fatigue

- **Current Behavior**: The Inbox has 14 pending items (mostly Tikop maturities and unmapped transactions). Each card looks identical and requires scrolling through a long list.
- **Why it is a problem**: Users procrastinate on financial triage when greeted by an unbroken wall of 14 complex tasks.
- **Affected Screen(s)**: `/inbox`
- **Severity**: HIGH
- **Design Direction**: Introduce smart category grouping (e.g., "7 Tikop Maturing Deposits", "5 Uncategorized Expenses") with bulk-review affordances and instant 1-tap primary action buttons.
