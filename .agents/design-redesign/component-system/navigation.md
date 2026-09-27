# ViNha Component System — Navigation & Page Hierarchy

## 1. Bottom Navigation Bar (`<BottomNav>`)

The canonical 5-tab docked bar serving as the primary navigation spine across the entire ViNha product.

### Global Specifications

- **Position**: Permanently fixed at the bottom of the 440px viewport container (`position: fixed; bottom: 0`).
- **Dimensions**:
  - Base Height: 56px.
  - Total Height: 56px + `env(safe-area-inset-bottom)`.
  - Max Width: 440px (Centered horizontally on desktop).
- **Background & Border**:
  - Light: Surface `#FFFFFF`, top hairline border `1px solid #DDE4E1`.
  - Dark: Surface `#1C1C1F`, top hairline border `1px solid #3F3F46`.
  - Shadow: Subtle ambient elevation (`0 -2px 8px rgba(0, 0, 0, 0.04)`).
- **Z-Index**: `var(--vn-z-bottom-nav)` (20).

### Tab Composition (5 Equal Slots)

1. **Home** (`/home`): Overview dashboard, liquidity split, recent pulse.
2. **Money** (`/money`): Accounts, Savings, Investments, Loans, Debts.
3. **Plan** (`/plan`): 6-jar budget envelopes, monthly close ritual.
4. **Inbox** (`/inbox`): Financial attention queue, unmapped transactions, maturity decisions.
5. **Together** (`/together`): Household identity, members, partner invite, shared rules.

### Slot Anatomy & States

- **Container**: Equal flex width (20% each), centered content, minimum 56px touch target.
- **Icon**: 24×24px canonical SVG glyph:
  - _Inactive State_: Stroke width `1.5px`, color `var(--vn-text-muted)` (`#71717A`).
  - _Active State_: Stroke width `1.9px`, color `var(--vn-primary)` (`#0F766E` Light / `#2DD4BF` Dark).
- **Label**: 11px font (`--vn-font-label-sm`):
  - _Inactive State_: 400 weight, color `var(--vn-text-muted)`.
  - _Active State_: 600 semibold, color `var(--vn-primary)`.
- **Badge Integration (Inbox)**:
  - Position: Absolute, top: 4px, right: 18px.
  - Structure: 18px high pill (`border-radius: 9999px`), 6px horizontal padding.
  - Colors: Primary brand teal or amber background, crisp white 10px bold text.
- **Interaction Feedback**:
  - _Pressed_: Icon and label scale down to 0.94 with 100ms spring.

---

## 2. Top App Bar (`<TopAppBar>`)

Provides contextual orientation and primary actions at the top of every screen.

### Variant A: Primary Tab Header

Used on top-level tabs (Home, Money, Plan, Inbox, Together).

- **Height**: 56px + `env(safe-area-inset-top)`.
- **Anatomy**:
  - Contextual Eyebrow: 11px uppercase bold tracking (`CÙNG NHAU`, `HỘP THƯ TÀI CHÍNH`).
  - Screen Title: 24px semibold (`--vn-font-display-md`).
  - Trailing Meta / Action: Household initials avatar cluster, unread count pill, or settings gear.

### Variant B: Subpage Back-Navigation Header

Used on detail views, sub-flows, and creation forms (`/money/accounts/new`, `/together/policies`).

- **Anatomy**:
  - Leading Back Action: `< Về [Tên Trang Trước]` (e.g. `< Về Cùng nhau` or `< Về Money`) using `IconButton`.
  - Centered / Left Title: 18px semibold.
  - Trailing Action Slot: Secondary action (e.g. `Bộ lọc`, `⋮` Kebab menu, or `Lưu`).
- **Navigation Safety**: Tapping back never loses unsaved form input without an explicit discard prompt.

### Variant C: Modal & Bottom Sheet Header

- Centered drag handle bar (36×4px rounded pill).
- Title: 18px medium font.
- Trailing close affordance: 20px `×` icon button.

---

## 3. Section Header (`<SectionHeader>`)

Divides content areas within long feeds and dashboard screens.

### Specifications

- **Anatomy**:
  - Left Stack: Section Title (16px/18px bold) + Optional Subtitle (13px muted).
  - Right Action: Optional trailing link (e.g. _Xem tất cả →_, _Quản lý_, _+ Thêm mới_) in primary teal text.
- **Vertical Spacing**: 24px top margin, 12px bottom margin to establish clear chunking.

---

## 4. Navigation Row (`<NavRow>`)

Interactive list item routing to subpages or settings panels.

### Specifications

- **Height**: 56px minimum.
- **Leading Slot**: 40×40px icon container (10px radius) with primary or semantic tint.
- **Center Stack**: Primary destination label (15px 500-weight) + Optional explanatory note (13px muted).
- **Trailing Slot**: Forward chevron glyph (`chevron-right`, 18px) in muted gray.
- **Interaction**: Subtle hover and pressed background tint (`--vn-surface-subtle`).
