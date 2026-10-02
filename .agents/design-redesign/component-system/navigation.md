# ViNha Component System — Navigation & Page Hierarchy

## 1. Bottom Navigation Bar (`<BottomNav>`)

The canonical five-route docked bar serves as the primary navigation spine across ViNha. Create Transaction is a separate floating pill above the bar, not a route tab.

### Global Specifications

- **Position**: Attached to the bottom of the 440px app viewport; the shared shell owns placement and safe-area insets.
- **Dimensions**:
  - Tab Row Height: 64px.
  - Total Height: 64px + the device safe-area inset.
  - Max Width: 440px (Centered horizontally on desktop).
- **Background & Border**:
  - Light and dark use the semantic elevated-surface and divider tokens.
  - Keep separation quiet; avoid heavy shadows and detached tab cards.
- **Z-Index**: `var(--vn-z-bottom-nav)` (20).

### Tab Composition (5 Equal Slots)

1. **Home** (`/home`): Overview dashboard, liquidity split, recent pulse.
2. **Money** (`/money`): Accounts, Savings, Investments, Loans, Debts.
3. **Plan** (`/plan`): 6-jar budget envelopes, monthly close ritual.
4. **Inbox** (`/inbox`): Financial attention queue, unmapped transactions, maturity decisions.
5. **Together** (`/together`): Household identity, members, partner invite, shared rules.

### Slot Anatomy & States

- **Container**: Five equal-width slots, centered content, minimum 56px touch target.
- **Icon**: 24×24px canonical SVG glyph:
  - Render registered Stitch navigation artwork through `AppIcon`.
  - _Inactive State_: Regular stroke and secondary-text token.
  - _Active State_: Emphasized stroke and primary-text token.
- **Label**: 11px single-line label token; regular weight when inactive and semibold when active.
- **Active Indicator**: A small primary line at the top of the active slot. Do not use a filled card or large selected pill.
- **Badge Integration (Inbox)**:
  - Position: Anchored to the upper trailing shoulder of the Inbox icon.
  - Use the semantic warning surface with a contrasting foreground and surface ring.
  - Keep counts compact and support `1`, `9`, `17`, and `99+` without moving the icon or label.
- **Interaction Feedback**:
  - _Pressed_: Icon and label scale down to 0.94 with 100ms spring.

### Create Transaction Action

- Use the shared `FloatingAction` and `FloatingActionButton` pattern.
- Keep the 44px-high primary pill above the navigation bar, trailing aligned within the app viewport.
- Keep the plus icon and localized Add label visible; disable it while offline.
- Reserve scroll clearance so the floating pill does not cover the last content row.
- Suppress it on Savings, Investments, Debts, and Loans lists that own a contextual floating create action.
- Hide both the pill and navigation on standalone create/edit flows.

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
