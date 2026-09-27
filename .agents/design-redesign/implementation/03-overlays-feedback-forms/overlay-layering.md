# Overlay Layering & Z-Index System — Implementation 03

To prevent visual conflicts, z-index clipping, and arbitrary CSS overrides across screens, ViNha enforces a strict, tokenized layering scale.

---

## 1. Canonical Layer Scale

| Layer Name                 | Token Variable                                | Value       | Components & Elements                        |
| :------------------------- | :-------------------------------------------- | :---------- | :------------------------------------------- |
| **Canvas / Base**          | `--z-base` / `--vn-z-canvas`                  | `0`         | Background canvas, base cards, static text   |
| **Surface**                | `--z-surface` / `--vn-z-surface`              | `1`         | Card containers, interactive rows            |
| **Sticky Header / Action** | `--z-sticky` / `--vn-z-sticky-header`         | `10`        | In-page sticky headers, `StickyFormAction`   |
| **Bottom Navigation**      | `--z-nav` / `--vn-z-bottom-nav`               | `20`        | Bottom 5-tab navigation bar                  |
| **Floating Action**        | `--z-floating-action` / `--vn-z-floating-cta` | `25` / `30` | `FloatingAddCTA` (+ Giao dịch)               |
| **Dropdown / Menu**        | `--z-dropdown` / `--vn-z-dropdown-popover`    | `30` / `40` | `ActionMenuContent`, Select dropdown popover |
| **Scrim / Backdrop**       | `--z-scrim` / `--vn-z-scrim`                  | `50`        | `Modal.Backdrop`, `Drawer.Backdrop`          |
| **Modal Dialog & Sheet**   | `--z-modal` / `--z-modal-sheet`               | `60`        | `DialogContent`, `BottomSheetContent`        |
| **Toast Notification**     | `--z-toast` / `--vn-z-toast`                  | `70`        | Floating mutation confirmation toasts        |

---

## 2. Strict Layering Laws

1. **No Arbitrary Z-Indexes**: Never write `z-10`, `z-50`, `z-[999]`, or `z-[9999]`. Always use `z-(--z-scrim)`, `z-(--z-modal-sheet)`, `z-(--z-toast)`.
2. **Sheet Over Navigation**: `BottomSheet` and `Dialog` use z-index `60`, which strictly places them above `BottomNavigation` (z-index `20`) and `FloatingAddCTA` (z-index `30`).
3. **Toast Above Everything**: Toast notifications use z-index `70`, ensuring they remain visible above active bottom sheets and dialogs during mutation settlement.
4. **Scrim Depth**: Scrim backdrops use z-index `50` with `backdrop-filter: blur(2px)` and tokenized tints (`rgba(24, 24, 27, 0.40)` light, `rgba(0, 0, 0, 0.65)` dark).
