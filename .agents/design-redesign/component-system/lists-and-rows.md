# ViNha Component System — Lists, Rows & Item Patterns

## 1. Base Row Primitive (`<BaseRow>`)

The fundamental building block for all structured feeds, table rows, and list items in ViNha.

### Base Row Specification

```text
┌─────────────────────────────────────────────────────────────┐
│ [Leading Slot]   [Title / Subtitle Stack]    [Trailing Slot]│
│   (32/40px)          (Two-line flex)         (Value/Action) │
└─────────────────────────────────────────────────────────────┘
  ──────────────────────────────────────────────────────────── (Optional Divider)
```

- **Min Height**: 52px (standard) / 64px (financial instrument).
- **Internal Padding**: 8px vertical, 12px horizontal.
- **Corner Radius**: 10px when inside an isolated card; 0px with dividers when inside a grouped card.
- **Divider Laws**:
  - _Inset Divider_: 1px solid `--vn-border-subtle`, indented 56px from the left (clearing the leading icon).
  - _Full-Width Divider_: Used only between distinct structural cards or table sections.
  - _Last Item_: Never displays a trailing divider.

---

## 2. Transaction Row (`<TransactionRow>`)

Renders individual debits, credits, and inter-account transfers.

### Financial Semantics & Layout

- **Leading Slot**: 32×32px category icon container (10px radius):
  - Soft category tint (e.g. Dining, Shopping, Health, Utilities).
- **Center Stack**:
  - Line 1: Concept / Merchant / Recipient name (14px 500-weight, `--vn-text-primary`).
  - Line 2: Account name + Timestamp (12px, `--vn-text-muted`, e.g. _"Vietcombank · 14:32 26/09"_).
- **Trailing Slot (Tabular Amount)**:
  - _Expense_: Slate text (`--vn-expense`), minus sign prefix: `− ₫ 85.000`.
  - _Income_: Emerald text (`--vn-income`), plus sign prefix: `+ ₫ 15.000.000`.
  - _Transfer_: Sky Blue text (`--vn-transfer`), arrow prefix: `⇄ ₫ 2.000.000`.
  - _P0 Rule_: Transfers NEVER display a minus sign or expense styling because net household wealth is unchanged.

---

## 3. Financial Instrument Row (`<InstrumentRow>`)

Renders bank accounts, savings contracts, investment holdings, and loans.

### Layout & Composition

- **Leading Slot**: 40×40px provider container (10px radius) with bank logo (Vietcombank, MB Bank, Techcombank) or fintech icon (Tikop, TCBS).
- **Center Stack**:
  - Line 1: Account / Contract Name (15px 500-weight, `--vn-text-primary`).
  - Line 2: Instrument Metadata (13px muted, e.g. _"••• 4892 · Lãi suất 6,5% / năm"_ or _"Đáo hạn: 28/09/2026"_).
- **Trailing Slot**:
  - Line 1: Live Balance / Principal (`₫ 500.000.000` in 15px bold tabular nums).
  - Line 2: Status indicator or accrued yield (`+₫ 29.000.000 lãi`).

---

## 4. Member & Role Row (`<MemberRow>`)

Renders household members in Together (`/together/members`).

### Layout & Composition

- **Leading Slot**: 40×40px avatar container with bold uppercase initials (`TN`, `LN`, `MN`) on soft teal or purple tint.
- **Center Stack**:
  - Line 1: Member display name (15px 600-semibold) + Status dot (Emerald active pip).
  - Line 2: Email address + Joined timestamp (12px muted).
  - Line 3: Responsibility scope note (_"Toàn quyền quản lý hộ"_ or _"Cộng tác ghi chép và xem hũ"_).
- **Trailing Slot**:
  - Role pill badge: `Quản trị` (Info Sky) or `Đối tác` (Soft Purple).
  - Administrative action button or Sole Admin lock badge.

---

## 5. Decision Queue Row (`<ReviewQueueRow>`)

Renders pending financial tasks in the Decision Inbox (`/inbox`).

### Layout & Composition

- **Left Accent**: 3px solid vertical accent bar (Amber for unsorted expense; Violet for savings maturity; Rose for debt alert).
- **Center Stack**:
  - Line 1: Category badge (11px pill) + Urgency label (_"Còn 2 ngày"_).
  - Line 2: Decision Title (_"Khoản chi Circle K Landmark 81 chưa có hũ"_).
  - Line 3: Financial impact figure (14px bold tabular).
- **Trailing Slot**: Forward chevron `>` or quick resolution button.

---

## 6. Key-Value Metadata Row (`<KeyValueRow>`)

Renders structured financial facts in contract and account detail screens.

### Specifications

- **Left Column**: Parameter label (13px muted, `--vn-text-secondary`).
- **Right Column**: Formatted value (14px 600-weight tabular nums, `--vn-text-primary`).
- **Dot Leader**: Optional faint dotted guide connecting label and value on wide layouts.
- **Long Value Handling**: Values wrap onto line 2 with right-alignment rather than colliding with the label.
