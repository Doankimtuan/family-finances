# Interaction Contracts — Implementation 03

This document specifies the exact behavioral, accessibility, focus management, and transition contracts governing ViNha overlays, feedback channels, and form infrastructure.

---

## 1. Dialog Interaction Contract

1. **Opening & Focus Management**:
   - When a Dialog or ConfirmDialog opens, focus moves automatically to the first interactive element or the primary action.
   - Tab navigation is strictly trapped within the dialog boundary (`aria-modal="true"`).
2. **Dismissal & Escape Key**:
   - Pressing `Escape` invokes `onCancel` / dismisses the dialog.
   - For `confirmation` and `info` dialogs, tapping outside on the scrim backdrop dismisses the dialog.
   - For `destructive` dialogs (`role="alertdialog"`), tapping the backdrop does NOT dismiss (`isDismissable={false}`). The user must make a deliberate choice by clicking either the destructive confirm or the cancel button.
3. **Focus Restoration**:
   - Upon closing, focus returns immediately and deterministically to the triggering button.

---

## 2. Bottom Sheet Interaction Contract

1. **Mobile Placement & Viewport Anchoring**:
   - Anchored to the bottom edge of the 440px viewport canvas (`fixed inset-x-0 bottom-0`).
   - Drag handle (36×4px) provides a clear touch affordance for dragging down to close.
2. **Scroll Lock & Momentum**:
   - Opening a BottomSheet locks the background body scroll to prevent unintentional under-scroll.
   - Internal content scrolls with native touch momentum (`overflow-y: auto`).
3. **Keyboard & Virtual Viewport**:
   - When a form input inside a sheet gains focus on mobile, the sheet preserves its sticky footer above the virtual keyboard and keeps the focused field visible.

---

## 3. ActionMenu Interaction Contract

1. **Keyboard Traversal**:
   - `ArrowDown`: Moves focus to the next enabled menu item.
   - `ArrowUp`: Moves focus to the previous enabled menu item.
   - `Enter` / `Space`: Activates the currently focused item and closes the menu.
   - `Escape`: Immediately closes the menu and returns focus to the trigger.
2. **Collision & Positioning**:
   - Automatically detects viewport boundaries; flips from bottom-end to top-end if near the bottom edge.
   - Never overflows outside the mobile viewport.

---

## 4. Toast Lifetime & Queue Contract

1. **Duration**: Automatically dismisses after exactly **4000ms** (4 seconds).
2. **Queueing**: A maximum of 3 visible toasts are stacked simultaneously. Additional toasts queue smoothly.
3. **Screen Readers**: An announcement is made via `aria-live="polite"` so users are informed without interruption.

---

## 5. Sticky Form Action Contract

1. **Zero Layout Shift**: Positioned with `sticky bottom-0`. Reserves clearance via safe-area calculation (`pb-[calc(var(--space-3)+env(safe-area-inset-bottom,0px))]`).
2. **Hierarchy**: Contains at most one primary button and one secondary escape action.
