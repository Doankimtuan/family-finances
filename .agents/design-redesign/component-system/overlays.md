# ViNha Component System — Overlays, Dialogs & Bottom Sheets

## 1. Overlay Architecture

ViNha utilizes two primary overlay patterns on mobile viewports:

1. **Bottom Sheet (`<BottomSheet>`)**: The default mobile container for creation forms, detail inspectors, and option pickers.
2. **Modal Dialog (`<ModalDialog>`)**: Reserved strictly for high-impact confirmations, destructive warnings, and irreversible departures.

---

## 2. Bottom Sheet (`<BottomSheet>`)

The canonical mobile surface for sub-flows (Add Transaction, Add Account, Buy/Sell Investment, Reallocate Jar).

### Anatomy & Structural Layout

```text
┌─────────────────────────────────────────────────────────────┐
│                      [ Drag Handle ]                        │
│ [< Quay lại]            Sheet Title                     [×] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      Scrollable Body                        │
│                     (Form / Roster)                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│               [ Sticky Primary Action CTA ]                 │
│                 + Safe Area Inset Bottom                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

- **Position**: Anchored to bottom of the 440px viewport canvas (`position: fixed; bottom: 0`).
- **Corner Radius**: 16px top-left and top-right (`border-radius: 16px 16px 0 0`).
- **Background**:
  - Light: Surface `#FFFFFF`, 1px top border `#DDE4E1`.
  - Dark: Surface `#1C1C1F`, 1px top border `#3F3F46`.
- **Drag Handle**: 36×4px rounded pill centered at top, color `--vn-text-muted`.
- **Body Scrolling**: Internal overflow-y scrolling with native momentum.
- **Sticky Footer Action**:
  - Fixed above `env(safe-area-inset-bottom)`.
  - Top 1px hairline border separating actions from scroll body.
  - Padded with 16px internal padding.
- **Z-Index**: `var(--vn-z-modal-sheet)` (60).

---

## 3. Modal Dialog (`<ModalDialog>`)

Used exclusively for irreversible or critical actions requiring focused, deliberate user acknowledgment.

### Allowed Use Cases

- Removing a partner from the household (`SCR-50`).
- Closing or settling a bank loan (`SCR-30`).
- Deleting an account or budget envelope.

### Specifications

- **Position**: Centered horizontally and vertically within the 440px viewport.
- **Dimensions**: Max width 360px, auto height.
- **Corner Radius**: 16px (`--vn-radius-overlay`).
- **Background**: Elevated card surface (`--vn-surface-elevated`), 1px border.
- **Anatomy**:
  - Title: 18px semibold, high contrast.
  - Body: 14px descriptive copy explaining exact consequences.
  - Impact Summary Card: Dedicated container detailing owned accounts and debts affected.
  - Action Footer:
    - Primary Destructive Button (`Button` destructive md).
    - Secondary Cancel Button (`Button` outlined md).
- **Accessibility & Focus Trap**:
  - `role="alertdialog"`.
  - Focus is trapped within the dialog while open.
  - Tapping `Escape` dismisses the dialog (triggers Cancel).
  - Tapping outside does NOT dismiss high-risk destructive dialogs (requires explicit button press).

---

## 4. Scrim / Backdrop (`<Backdrop>`)

Provides depth and focus separation behind active overlays.

### Specifications

- **Color & Opacity**:
  - Light Mode: `rgba(24, 24, 27, 0.40)`.
  - Dark Mode: `rgba(0, 0, 0, 0.65)`.
- **Blur**: `backdrop-filter: blur(2px)` for gentle depth separation without GPU lag.
- **Z-Index**: `var(--vn-z-scrim)` (50).
- **Transitions**: Smooth 200ms opacity fade-in / fade-out.
