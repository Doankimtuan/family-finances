# ViNha Component System — Product-Specific Composite Patterns

## 1. Overview

While ViNha is constructed from foundational primitives (Buttons, Inputs, Cards, Rows), several higher-order composite components are unique to its dual-liquidity, 6-jar budgeting, and household collaboration model.

---

## 2. Specialized Composite Components

### A. Money Pillar Card (`<MoneyPillarCard>`)

- **Route**: `/money` (`SCR-02`).
- **Purpose**: Displays the 4 structural pillars of household wealth:
  1. _Tài khoản thanh toán_ (Liquid Cash Accounts).
  2. _Sổ tiết kiệm_ (Locked Term Deposits).
  3. _Danh mục đầu tư_ (Investment Holdings).
  4. _Khoản vay & Nợ_ (Debt & Liabilities).
- **Anatomy**:
  - 40×40px semantic icon container (Emerald for cash, Violet for savings/investment, Rose for loans).
  - Title + Count of active contracts or accounts.
  - Right-aligned Tabular Total Amount.
  - Forward navigation chevron.

### B. Jar Envelope Card (`<JarEnvelopeCard>`)

- **Route**: `/plan` (`SCR-04`, `SCR-36`).
- **Purpose**: Represents one of the 6 canonical household budget jars (e.g. _Ăn uống_, _Giáo dục_, _Tiện ích_).
- **Anatomy**:
  - Jar icon + Jar Name + Status pill (`Đúng kế hoạch` / `Vượt ngân sách`).
  - Allocation formula: `₫ 8.500.000 / ₫ 10.000.000` (Spent vs Cap).
  - Progress bar with clamped visual fill at 100%.
  - Overage callout in Warm Amber: _"Vượt ₫ 809.244 (108%)"_.
  - Inline action button: _"Điều chuyển"_ (`reallocate_jar_capacity`).

### C. Savings Maturity Selector (`<SavingsMaturityTile>`)

- **Route**: `/inbox/:id` (`SCR-43`), `/money/savings/new` (`SCR-17`).
- **Purpose**: Discrete 3-choice decision selector when term deposits reach maturity:
  1. _Gia hạn cuốn gốc + lãi_ (Compound Rollover).
  2. _Chỉ cuốn gốc, rút lãi_ (Principal Rollover).
  3. _Rút toàn bộ về tài khoản_ (Full Withdrawal).
- **Anatomy**: Radio-style selection tiles with compound interest badges and destination account picker.

### D. Debt Direction Badge (`<DebtDirectionBadge>`)

- **Route**: `/money/personal-debts` (`SCR-31` to `SCR-35`).
- **Purpose**: Eliminates counterparty confusion between lending and borrowing:
  - _Cho vay_ (I lend money out): Sky Blue badge (`--vn-transfer-soft`), upward arrow `↗`, asset classification.
  - _Đi vay_ (I owe someone money): Rose badge (`--vn-debt-soft`), downward arrow `↘`, liability classification.

### E. Household Membership Impact Summary (`<MembershipImpactSummary>`)

- **Route**: `/together/members/remove-confirm` (`SCR-50`).
- **Purpose**: High-stakes audit summary displayed before removing or departing a household member:
  - Counts owned bank accounts, savings contracts, investment holdings, and loans.
  - Reassures user that personal ownership and historical records are preserved.
  - Emphasizes that personal debt obligations do not self-liquidate upon departure.

### F. Policy Rule Tile (`<PolicyRuleTile>`)

- **Route**: `/together/policies` (`SCR-49`).
- **Purpose**: Configures the 3 verified non-banking household planning policies:
  - `overspendPolicy`: Cảnh báo (Warn) | Chặn (Block) | Cho phép âm (Allow Negative).
  - `monthCloseMode`: Hỗ trợ (Assisted) | Thủ công (Manual).
  - `incomeAllocateMode`: Gợi ý (Suggest) | Tự động (Auto) | Tắt (Off).
- **Anatomy**: Interactive segmented choice cards with explanatory Vietnamese subtexts.
