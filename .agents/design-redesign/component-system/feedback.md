# ViNha Component System — Feedback, Alerts & Toasts

## 1. Feedback Architecture

ViNha provides feedback through distinct semantic channels based on persistence and urgency:

1. **Toast**: Ephemeral, non-blocking post-action confirmation.
2. **Inline Alert**: In-page, persistent contextual guidance or policy guardrail.
3. **Tooltip / Micro-Help**: On-demand terminology explanation.

---

## 2. Toast Notification (`<Toast>`)

Used exclusively to confirm asynchronous or user-triggered mutations (e.g. _Đã lưu giao dịch_, _Đã sao chép liên kết_, _Đã cập nhật quy tắc_).

### Specifications

- **Position**: Floating 16px below the top safe area (`env(safe-area-inset-top) + 16px`), centered horizontally.
- **Dimensions**: Max width 360px, 44px min height, 12px horizontal padding, 10px corner radius.
- **Background & Elevation**:
  - Light: Solid dark slate `#18181B`, white text `#FFFFFF`.
  - Dark: Elevated surface `#28282D`, white text `#F4F4F5`, 1px border `#3F3F46`.
  - Shadow: High-elevation ambient shadow (`0 8px 24px rgba(0, 0, 0, 0.25)`).
- **Z-Index**: `var(--vn-z-toast)` (70).
- **Duration**: Automatically dismisses after **4000ms** (4 seconds).
- **Anatomy**:
  - Leading Slot: 18px status icon (Checkmark for success; Alert for error).
  - Center: Message copy (13px medium).
  - Trailing Slot: Optional action button (_"Hoàn tác"_ / Undo) or `×` close icon.

---

## 3. Inline Alert (`<InlineAlert>`)

Embedded directly inside forms and overview screens to surface persistent constraints, warnings, or confirmations.

### Semantic Variants

| Variant     | Icon             | Light Mode Tint                            | Dark Mode Tint                                     | Usage                                           |
| ----------- | ---------------- | ------------------------------------------ | -------------------------------------------------- | ----------------------------------------------- |
| **Info**    | `info`           | Sky Blue (`--vn-transfer-soft`), Sky text  | Dark Blue (`#082F49`), Sky text (`#38BDF8`)        | Invariant guarantees, policy explanations       |
| **Warning** | `alert-triangle` | Amber (`--vn-warning-soft`), Amber text    | Dark Amber (`#451A03`), Amber text (`#FBBF24`)     | Upcoming loan due dates, budget near capacity   |
| **Error**   | `alert-circle`   | Rose (`--vn-debt-soft`), Crimson text      | Dark Rose (`#4C0519`), Rose text (`#FB7185`)       | Overdue debt, over-budget jar, validation error |
| **Success** | `check-circle`   | Emerald (`--vn-income-soft`), Emerald text | Dark Emerald (`#064E3B`), Emerald text (`#34D399`) | Loan fully paid off, savings goal achieved      |

### Specifications

- **Radius**: 10px (`--vn-radius-control`).
- **Internal Padding**: 12px vertical, 14px horizontal.
- **Typography**: 14px 600-weight Title + 13px 400-weight Body description.
- **Accessibility**: Marked with `role="alert"` or `role="status"` based on severity.

---

## 4. Tooltip & Micro-Help (`<Tooltip>`)

Provides brief definitions for specialized financial concepts (e.g. _CCQ_, _Tái tục_, _Hũ chi tiêu_).

### Mobile-First Constraint

On mobile devices, hover states do not exist. Therefore:

- Tapping a help icon `?` triggers a lightweight popover or bottom sheet dialog rather than a hover-only tooltip.
- Tooltips NEVER contain critical operational instructions required to complete a flow.
