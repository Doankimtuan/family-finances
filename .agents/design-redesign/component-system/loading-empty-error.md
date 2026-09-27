# ViNha Component System — Loading, Empty & Error States

## 1. Skeleton Loading System (`<Skeleton>`)

ViNha avoids full-screen blocking spinners in favor of layout-stable skeleton placeholders that match the exact geometry of destination content.

### Specifications

- **Geometry**:
  - `SkeletonText`: 14px height, 60% or 90% width, 4px radius.
  - `SkeletonMetric`: 28px height, 140px width, 6px radius.
  - `SkeletonIcon`: 40×40px box, 10px radius.
  - `SkeletonCard`: 120px height, 12px radius, full container width.
- **Color & Animation**:
  - Light: Base color `#E5E7EB`, pulsing subtly to `#F3F4F6` with 1.5s ease-in-out cycle.
  - Dark: Base color `#242428`, pulsing subtly to `#2E2E33`.
- **Accessibility**: Skeletons have `aria-hidden="true"`, with parent container flagged with `aria-busy="true"`.

---

## 2. Empty State Architecture (`<EmptyState>`)

Empty states in ViNha communicate clarity, reassurance, and calmness rather than framing empty data as an error.

### Variant A: Zero Pending / Clear Attention (Inbox Clear)

- **Seen In**: `SCR-45` (Zero Inbox items pending).
- **Tone**: Dignified, calm, affirmative.
- **Anatomy**:
  - 56×56px checkmark icon inside soft teal circular container.
  - Title: _"Hiện không có việc nào cần chú ý"_.
  - Body: _"Tất cả giao dịch đã được gắn hũ, không có khoản tiết kiệm nào đến hạn hoặc khoản vay cần xử lý."_
  - CTA: `Xem tổng quan tài chính →` (Guides back to overview).

### Variant B: Zero Debt / All Paid Off

- **Seen In**: `SCR-26`, `SCR-31`.
- **Principle**: Zero debt is a healthy financial state. The UI NEVER aggressively prompts the user to borrow money.
- **Anatomy**:
  - Shield-check or smiling checkmark icon.
  - Title: _"Hộ gia đình không có khoản nợ nào"_.
  - Body: _"Bạn đã hoàn tất tất cả các nghĩa vụ tài chính hoặc chưa ghi nhận khoản vay nào."_

### Variant C: No Filter / Search Results

- **Anatomy**:
  - Magnifier search icon with a soft slash.
  - Title: _"Không tìm thấy kết quả phù hợp"_.
  - Body: _"Thử tìm với từ khóa khác hoặc đặt lại bộ lọc."_
  - Action: Secondary button labeled _"Đặt lại bộ lọc"_ (Reset filters).

---

## 3. Error States (`<ErrorState>`)

ViNha handles errors respectfully and constructively.

### Field-Level Error

- Rendered directly below the affected input field.
- Red 12px text with an `alert-circle` icon.
- Explains how to correct the input (e.g. _"Vui lòng nhập số tiền lớn hơn 0"_).

### Section / Feed Load Error

- Replaces only the failing section while preserving the rest of the page.
- Container: Subtle card with a retry affordance (_"Tải lại dữ liệu"_).

### Full-Screen Offline Error

- Surfaced when network connection is severed.
- Clear title: _"Mất kết nối mạng"_.
- Body: _"Dữ liệu cục bộ vẫn an toàn. Vui lòng kiểm tra kết nối Wi-Fi hoặc 4G."_
- Action: Primary button _"Thử lại"_ (Retry).
