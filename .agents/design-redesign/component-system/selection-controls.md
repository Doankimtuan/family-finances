# ViNha Component System — Selection Controls, Dropdowns & Badges

## 1. Select Component System (`<Select>`)

Select handles choosing from a discrete list of options (e.g. selecting a destination account, budget jar, loan category, or financial provider).

### A. Closed Select Trigger

- **Height**: 48px standard.
- **Corner Radius**: 10px (`--vn-radius-control`).
- **Anatomy**:
  - `Leading Slot`: Optional 20px category or bank glyph.
  - `Content Area`: Selected option label (or muted placeholder text).
  - `Trailing Slot`: 18px dropdown chevron (`chevron-down`), rotating 180° when open.
- **States**:
  1. _Placeholder_: Muted text (`var(--vn-text-muted)`), 1px border.
  2. _Selected_: High-contrast text (`var(--vn-text-primary)`), 500 weight.
  3. _Hover_: Border darkens to `--vn-text-secondary`.
  4. _Focus / Open_: Border highlights to 2px `--vn-border-focus`.
  5. _Error_: Border highlights to 1.5px `--vn-debt`.
  6. _Disabled_: 45% opacity, cursor not-allowed.
  7. _Read-only_: 100% opacity, surface-subtle background, lock icon.

### B. Open Dropdown Popover (`<SelectDropdown>`)

- **Surface**: Elevated card surface (`--vn-surface-elevated`) with ambient shadow (`--vn-shadow-overlay`), 12px radius, 1px border.
- **Max Height**: 320px with smooth internal vertical scrolling.
- **Positioning**:
  - Opens below trigger by default.
  - Flips above trigger automatically if bottom viewport clearance is < 240px.
  - Mobile bottom-sheet fallback when options exceed 8 items.
- **Option Row Anatomy**:
  - Height: 44px min touch target.
  - Leading slot: 20px icon or bank logo.
  - Label stack: Primary option label (14px 500-weight) + Optional secondary metadata (12px muted balance or account number).
  - Trailing slot: Checkmark icon (`check`) rendered in primary teal when selected.
- **Option States**:
  - _Default_: Transparent background.
  - _Hover_: Soft tint (`--vn-surface-subtle`).
  - _Selected_: Soft primary tint (`--vn-primary-soft`) with teal checkmark.
  - _Focused_: Keyboard outline indicator.
  - _Disabled_: 45% opacity, non-interactive.

### C. Searchable Select (`<SearchableSelect>`)

Used when option count is large (e.g. selecting from 35 Vietnamese banks or 20 investment funds).

- Top sticky search input (36px height) with live filter.
- Dynamic result list with highlight on matching query text.
- Clean empty state: _"Không tìm thấy ngân hàng phù hợp"_.

---

## 2. Action Menu / Context Menu (`<DropdownMenu>`)

Contextual dropdown attached to kebab icon buttons (`⋮`) or table row management triggers.

### Distinction from Select

- `Select`: Chooses a value to populate a form field.
- `Action Menu`: Triggers an immediate command (e.g. _Chỉnh sửa_, _Sao chép_, _Lưu trữ_, _Xoá_).

### Specifications

- **Surface**: 12px radius, 1px border, 6px internal padding.
- **Items**:
  - Safe action: Default text, hover subtle background.
  - Destructive action: Red text (`--vn-debt`), hover soft rose background (`--vn-debt-soft`). Separated from safe actions by a 1px divider.
- **Accessibility**: Keyboard navigation via Up/Down arrow keys; `Escape` key dismisses menu and returns focus to trigger.

---

## 3. Checkbox (`<Checkbox>`)

Used for non-exclusive multi-selection (e.g. selecting multiple transactions to batch-assign or confirming terms).

### Specifications

- **Box Dimensions**: 20×20px box, 4px corner radius.
- **Touch Target**: 44×44px interactive bounding box around the box and label.
- **States**:
  - _Unchecked_: 1.5px border (`--vn-border`), transparent center.
  - _Hover_: Border darkens to `--vn-primary`.
  - _Checked_: Solid primary teal fill (`--vn-primary`), crisp white checkmark glyph.
  - _Indeterminate_: Solid primary teal fill with a horizontal minus dash (`−`).
  - _Focus_: 2px focus ring with 2px offset.
  - _Disabled_: Faded 45% opacity.

---

## 4. Radio Control (`<Radio>`)

Used for mutually exclusive options within small sets (2 to 5 choices).

### Specifications

- **Dimensions**: 20×20px outer circle, 8px inner filled dot when checked.
- **Touch Target**: 44×44px interactive bounding box.
- **States**:
  - _Unchecked_: 1.5px border (`--vn-border`), transparent center.
  - _Checked_: 2px border in primary teal with centered filled teal dot.
  - _Focus_: 2px focus ring with 2px offset.
  - _Disabled_: 45% opacity.
- **Content Pairing**: Accompanied by a 2-line vertical stack (Title 14px 500-weight + Description 12px muted).

---

## 5. Switch Control (`<Switch>`)

Used exclusively for immediate-effect binary toggles.

### Strict Usage Rule

- **USE WHEN**: Toggling an app-wide or household setting that takes effect **immediately** without a Save button (e.g. Biometrics login, Instant notifications).
- **DO NOT USE WHEN**: The user is inside a form that requires pressing "Lưu" (Save) or "Xác nhận" (Confirm). Use Checkbox instead.

### Specifications

- **Track**: 44px wide × 24px high pill (`border-radius: 9999px`).
  - Off: Neutral track (`--vn-border`).
  - On: Primary brand teal track (`--vn-primary`).
- **Thumb**: 20×20px circular white knob, sliding smoothly with 150ms spring animation.
- **States**: Off, On, Hover, Pressed (thumb slightly elongates to 24px), Focus, Disabled.

---

## 6. Segmented Control (`<SegmentedControl>`)

Used for switching view modes or data intervals across a single surface.

### Distinction from Tabs

- `Segmented Control`: Controls mode or time window on the current view (e.g. `Tháng` vs `Quý`; `Chi tiêu` vs `Thu nhập` vs `Chuyển khoản`).
- `Tabs`: Navigates between entirely different queues or subpages.

### Specifications

- **Height**: 36px.
- **Container**: Subtle surface container (`--vn-surface-subtle`), 10px radius, 3px internal padding.
- **Active Segment**: Elevated white/dark pill (`--vn-surface`), 8px radius, subtle drop shadow, high-contrast bold label.
- **Inactive Segment**: Transparent background, muted text (`--vn-text-secondary`).

---

## 7. Tabs (`<Tabs>`)

Used to switch between distinct functional sub-views (e.g. Inbox `Đang mở (14)` vs `Đã lưu trữ (42)`).

### Specifications

- **Container**: 44px height bar.
- **Variants**:
  - _Capsule Tabs_: Pill-shaped active container with unread count badge.
  - _Underline Tabs_: Subtle border-bottom with a 2px active primary indicator.
- **Badge Integration**: Count pills styled with high contrast (`14` in white on teal or neutral).

---

## 8. Filter Chips (`<FilterChip>`)

Used in horizontal scrollable filter bars on data feeds (Inbox categories, transaction types, accounts).

### Specifications

- **Height**: 32px.
- **Corner Radius**: 9999px (Full pill).
- **Padding**: 12px horizontal padding (8px if containing an icon).
- **States**:
  - _Default (Unselected)_: Surface background, 1px border (`--vn-border`), secondary text.
  - _Hover_: Border darkens to `--vn-primary`.
  - _Selected_: Solid soft teal background (`--vn-primary-soft`), primary text (`--vn-primary`), 1px solid `--vn-primary`.
  - _With Count_: Embedded 18px circle showing active item count.
- **Overflow Rule**: `white-space: nowrap`; horizontal scroll without breaking onto multiple lines.

---

## 9. Status Badges & Pills (`<StatusPill>`)

Semantic indicators used across all instruments and transactions.

### Strict Color Semantics (Never Color Alone)

Every badge MUST include an explicit textual label alongside its semantic tint.

| Variant                 | Semantic Meaning & Usage                          | Light Mode Styling                               | Dark Mode Styling                    |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------ | ------------------------------------ |
| **Positive / Active**   | Active account, fully funded jar, paid debt       | Background `#ECFDF5`, Text `#047857`, 1px border | Background `#064E3B`, Text `#34D399` |
| **Warning / Pending**   | Maturing savings, over-budget jar, pending invite | Background `#FFFBEB`, Text `#B45309`, 1px border | Background `#451A03`, Text `#FBBF24` |
| **Danger / Overdue**    | Overdue loan, credit card liability, error        | Background `#FFF1F2`, Text `#BE123C`, 1px border | Background `#4C0519`, Text `#FB7185` |
| **Info / Transfer**     | Internal transfer, admin role, policy note        | Background `#F0F9FF`, Text `#0369A1`, 1px border | Background `#082F49`, Text `#38BDF8` |
| **Neutral / Archived**  | Settled loan, closed account, archived item       | Background `#F4F4F5`, Text `#52525B`, 1px border | Background `#27272A`, Text `#A1A1AA` |
| **Growth / Investment** | Mutual fund, equity holding, partner role         | Background `#F5F3FF`, Text `#7C3AED`, 1px border | Background `#2E1065`, Text `#A78BFA` |
