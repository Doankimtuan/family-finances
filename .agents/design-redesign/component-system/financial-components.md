# ViNha Component System — Financial Components & Math Primitives

## 1. Financial Amount Display (`<FinancialAmount>`)

The central component for rendering monetary figures across ViNha. It guarantees mathematical clarity, tabular alignment, and semantic color discipline.

### Formatting Laws

1. **Currency Symbol**: Canonical Vietnamese Dong symbol `₫`, positioned before or after the figure with a single non-breaking space (e.g. `₫ 2.036.547.748`).
2. **Tabular Numerals**: Mandatory `font-variant-numeric: tabular-nums` (OpenType `tnum`).
3. **No Decimals for VND**: Vietnamese Dong does not use fractional currency. All VND amounts are formatted as whole integers with dot thousand separators (`.`).
4. **Semantic Color Rules**:
   - _Income / Positive_: Emerald (`--vn-income`), explicit `+` prefix: `+ ₫ 15.000.000`.
   - _Expense_: Slate (`--vn-expense`), minus sign: `− ₫ 85.000`.
   - _Liability / Debt_: Crimson Rose (`--vn-debt`): `₫ 450.000.000`.
   - _Transfer_: Sky Blue (`--vn-transfer`), arrow prefix: `⇄ ₫ 2.000.000`.
   - _Neutral Balance_: Slate/Off-white (`--vn-text-primary`).

### Size Hierarchy

| Variant           | Font Size | Weight         | Line Height | Usage                                      |
| ----------------- | --------- | -------------- | ----------- | ------------------------------------------ |
| **Display Hero**  | 32px      | 600 (Semibold) | 38px        | Net Available Assets, Top of screen totals |
| **Section Total** | 24px      | 600 (Semibold) | 30px        | Card headline amounts, group totals        |
| **Metric Medium** | 18px      | 500 (Medium)   | 24px        | Jar capacity, monthly loan installments    |
| **Row Amount**    | 15px      | 500 (Medium)   | 20px        | Standard transaction rows, account balance |
| **Micro Amount**  | 12px      | 500 (Medium)   | 16px        | Sub-item accrued interest, fee breakdowns  |

---

## 2. Calculated Preview (`<CalculatedPreview>`)

Displays real-time derived outcomes in transaction sheets, loan payments, and investment orders.

### Visual Architecture

- **Surface**: Subtle container (`--vn-surface-subtle`), 10px radius, 12px padding.
- **Left Slot**: 18px calculator or trending glyph.
- **Center**: Equation or formula text (e.g. `100 CCQ × ₫ 25.400 = Thành tiền`).
- **Right**: Formatted derived value in bold tabular numerals.

### States

- **Valid Calculation**: High-contrast amount, green/teal check indicator.
- **Incomplete Inputs**: Muted dash `—` with helper prompt (_"Nhập đủ số lượng và giá"_).
- **Invalid / Exceeded**: Rose error text with warning message (_"Số dư không đủ để thực hiện"_).

---

## 3. Progress Bar Primitive (`<ProgressBar>`)

Visualizes budget utilization, savings milestones, and debt amortization.

### Specifications

- **Height**: 6px (standard) / 8px (hero jar card).
- **Corner Radius**: 9999px (Full pill).
- **Track**: Muted neutral track (`--vn-border-subtle`).
- **Semantic Fills**:
  - _Standard Utilization (0% to 90%)_: Primary Teal (`--vn-primary`).
  - _Target Reached (100%)_: Emerald (`--vn-income`).
  - _Over-Capacity (>100%)_: Warm Amber / Rose (`--vn-debt`).

### Strict Constraint: Visual Clamping

- When progress exceeds 100% (e.g. 115% jar overspend), the visual progress bar fill **MUST clamp at 100% of the track width**.
- The bar must NEVER visually overflow its container.
- An explicit badge or text label MUST declare the overage: _"Vượt ₫ 809.244 (108%)"_.

---

## 4. Policy & Invariant Security Banner (`<InvariantBanner>`)

Reassures household members when performing non-banking actions to eliminate fear of unintended bank fund movement.

### Specifications

- **Container**: Sky Blue container (`--vn-transfer-soft`), 10px radius, 12px padding.
- **Icon**: 20px shield-check glyph (`shield-check`) in Sky Blue (`--vn-transfer`).
- **Standardized Copy**:
  - _"Tiền thật không đổi: Thao tác này chỉ sắp xếp danh mục quản lý, số dư tài khoản ngân hàng thực tế không thay đổi."_
  - _"Chính sách không chuyển tiền: Không tạo giao dịch ngân hàng hay tự động thanh toán."_
