# ViNha Component System — Actions & Buttons

## 1. Button System Overview

The Button system provides explicit user agency across ViNha. It prevents visual chaos by restricting actions to 5 strictly defined semantic variants and 3 standardized heights.

---

## 2. Button Variants & Semantic Roles

| Variant                 | Visual Appearance                                                        | Semantic Role & Allowed Usage                                                                     | Forbidden Usage                                               |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Primary**             | Solid Teal (`--vn-primary`), White/Dark text, 10px radius                | Main affirmative action per screen/sheet (e.g. _Lưu giao dịch_, _Tạo liên kết mời_, _Xác nhận_)   | Multiple primary buttons on a single view; generic navigation |
| **Tonal (Secondary)**   | Soft Teal (`--vn-primary-soft`), Teal text (`--vn-primary`), 10px radius | Co-primary or strong secondary action (e.g. _Xem chi tiết_, _Gán vào hũ_, _Thêm tài khoản mới_)   | Destructive confirmation                                      |
| **Outlined (Tertiary)** | Transparent with 1px border (`--vn-border`), Secondary text              | Neutral dismiss or secondary action (e.g. _Huỷ bỏ_, _Bộ lọc_, _Đóng_)                             | Standalone high-priority calls-to-action                      |
| **Ghost**               | Transparent background, Secondary text                                   | Low-emphasis inline action (e.g. _Sao chép link_, _Xem thêm_, _Bỏ qua_)                           | Primary submission                                            |
| **Destructive**         | Solid Crimson Rose (`--vn-debt`), White text                             | Irreversible, high-risk actions ONLY (e.g. _Xoá đối tác khỏi hộ_, _Tất toán nợ_, _Xoá tài khoản_) | Routine negative expense entries; general cancel actions      |

---

## 3. Standard Button Sizes

| Size              | Visual Height | Min Touch Target        | Padding-X | Font Size & Weight | Icon Size & Gap     |
| ----------------- | ------------- | ----------------------- | --------- | ------------------ | ------------------- |
| **Small (`sm`)**  | 36px          | 44px (4px touch expand) | 12px      | 13px Medium        | 16px icon · 6px gap |
| **Medium (`md`)** | 44px          | 44px                    | 16px      | 14px Medium        | 20px icon · 8px gap |
| **Large (`lg`)**  | 52px          | 52px                    | 20px      | 16px Semibold      | 20px icon · 8px gap |

---

## 4. Interactive States & Visual Behavior

### Complete State Matrix (Button Primary md)

- **Default**:
  - Light: Background `#0F766E`, Text `#FFFFFF`, Border none.
  - Dark: Background `#2DD4BF`, Text `#0F172A`, Border none.
- **Hover**:
  - Light: Background `#0D655E`.
  - Dark: Background `#14B8A6`.
- **Pressed / Active**:
  - Both: `transform: scale(0.98)`; Background darkened 10%; transition 100ms.
- **Focus Visible**:
  - Both: Keyboard Tab brings `outline: 2px solid var(--vn-border-focus)`; `outline-offset: 2px`.
- **Loading**:
  - Both: Retains original width; content replaced by or prepended with 18px SVG spinner; `pointer-events: none`; `aria-busy="true"`.
- **Disabled**:
  - Both: `opacity: 0.45`; `pointer-events: none`; `cursor: not-allowed`; no shadow.

### State Specifications for Tonal & Destructive

- **Tonal Hover/Pressed**:
  - Light: Background `#D3EDE5` (Hover), `#C1E5DA` (Pressed).
  - Dark: Background `#1D4A45` (Hover), `#245B55` (Pressed).
- **Destructive Hover/Pressed**:
  - Light: Background `#A21033` (Hover), `#880D2B` (Pressed).
  - Dark: Background `#F43F5E` (Hover), `#E11D48` (Pressed).

---

## 5. Content Layout Variants

Buttons support 4 strict content layouts:

1. **Text Only**: Label centered with balanced padding.
2. **Leading Icon + Text**: 20px SVG icon, 8px gap, followed by label.
3. **Trailing Icon + Text**: Label followed by 8px gap and 20px icon (e.g. forward arrow `→`).
4. **Icon Only**: Square 44×44px container (delegates to `IconButton`).

---

## 6. Icon Button (`<IconButton>`)

Used for contextual micro-actions: navigation back `< `, modal close `×`, kebab menu `⋮`, calendar trigger, and search clear.

### Specifications

- **Dimensions**: 44×44px fixed container.
- **Corner Radius**: 10px.
- **Icon Sizing**: 20×20px centered glyph.
- **Variants**:
  - _Ghost_: Transparent, subtle hover background (`--vn-surface-subtle`).
  - _Surface_: 1px border (`--vn-border`), surface background (`--vn-surface`).
  - _Destructive_: Soft rose tint (`--vn-debt-soft`) with crimson glyph.
- **Mandatory Accessibility**:
  - MUST include `aria-label` (e.g. `aria-label="Quay lại danh sách"` or `aria-label="Đóng bảng"`).

---

## 7. Floating Add CTA (`<FloatingAddCTA>`)

The primary transaction creation shortcut in ViNha.

### Specifications

- **Geometry**: Pill container (`border-radius: 9999px`), 44px height, 18px horizontal padding.
- **Coloring**: Primary brand teal (`--vn-primary`), white text, bold font, 18px `plus` icon.
- **Placement**: Fixed 16px above the 56px bottom navigation bar on mobile, centered horizontally.
- **Elevation**: Ambient floating shadow (`0 8px 20px -2px rgba(15, 118, 110, 0.35)`).
- **Z-Index**: `var(--vn-z-floating-cta)` (30).
- **Guaranteed Usability**: The underlying page scroll container MUST incorporate a minimum 80px bottom padding clearance to prevent the CTA from obscuring the last list item.
