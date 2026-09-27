# Component API Map — Implementation 03

This document maps all 14 canonical primitives implemented in Phase 03 to their variants, composition slots, accessible semantics, motion, responsive rules, and Stitch references.

---

## 1. Overlays

### 1.1 `Dialog` & `ConfirmDialog`

- **Location**: `shared/ui/dialog.tsx`
- **Underlying Primitive**: HeroUI `Modal` (`react-aria-components/Modal`)
- **Supported Roles**:
  - `confirmation` (default): Standard deliberate user confirmation.
  - `destructive`: Irreversible/destructive confirmation (`role="alertdialog"`, non-dismissable by backdrop tap).
  - `info`: System information announcement.
- **Anatomy**:
  - Scrim: `Modal.Backdrop` with `backdrop-filter: blur(2px)` and tokenized color.
  - Surface: `Modal.Dialog` (max-w-[360px], 16px radius `--radius-overlay`, elevated surface, 1px border).
  - Slots: `Header`, `Heading`, `Body`, `Footer`, `CloseTrigger`.
- **Keyboard & Focus**: Focus automatically trapped inside; `Escape` key cancels; focus restored to trigger on close.
- **Stitch Reference**: `DS-01` Overlays / `SCR-50`.

### 1.2 `BottomSheet` & `BottomSheetContent`

- **Location**: `shared/ui/bottom-sheet.tsx`
- **Underlying Primitive**: HeroUI `Drawer` (placement="bottom")
- **Anatomy**:
  - Scrim: `Drawer.Backdrop` with `bg-scrim backdrop-blur-xs`, `z-(--z-scrim)`.
  - Surface: `Drawer.Dialog` (max-h-[min(90dvh,720px)], 16px top radius, elevated surface, 1px top border).
  - Drag handle: Centered 36×4px rounded pill (`Drawer.Handle`).
  - Scrollable body: Internal overflow-y with native momentum.
  - Sticky footer: Anchored above `env(safe-area-inset-bottom)`.
- **Stitch Reference**: `DS-01` Overlays / `SCR-03`, `SCR-16`.

### 1.3 `ActionMenu`

- **Location**: `shared/ui/action-menu.tsx`
- **Underlying Primitive**: HeroUI `Dropdown` (`react-aria-components/Menu`)
- **Distinction from Select**: Select picks a form value into state; ActionMenu triggers contextual mutations (Edit, Archive, Delete).
- **Item Variants**:
  - `default`: Neutral action (hover/focus surface tint).
  - `destructive` / `danger`: Irreversible action (crimson text, soft danger hover tint).
  - `isDisabled`: Inactive state (`opacity-disabled`, cursor-not-allowed).
- **Subcomponents**: `ActionMenuTrigger`, `ActionMenuContent`, `ActionMenuItem`, `ActionMenuSeparator`, `ActionMenuSection`.
- **Stitch Reference**: `DS-01` Strip 2 & Strip 5.

---

## 2. Feedback

### 2.1 `Toast` & `toast`

- **Location**: `shared/ui/toast.tsx`
- **Underlying Primitive**: HeroUI `Toast` queue & provider
- **Semantic Variants**: `success`, `danger` / `error`, `warning`, `info`.
- **Lifetime**: 4000ms auto-dismiss.
- **Surface**: Max width 360px, 44px min height, 10px radius (`--radius-control`), high ambient elevation.
- **Stitch Reference**: `DS-01` Strip 6 Toast Notification.

### 2.2 `InlineAlert`

- **Location**: `shared/ui/inline-alert.tsx`
- **Variants**: `info`, `warning`, `error`, `success`.
- **Anatomy**: 10px radius, 12px vertical / 14px horizontal padding, 14px 600-weight Title, 13px 400-weight Description, optional action slot, optional dismiss button.
- **Accessibility**: `role="alert"` (for error/warning), `role="status"` (for info/success).
- **Stitch Reference**: `feedback.md` Section 3.

---

## 3. Loading, Empty & Error

### 3.1 `Skeleton` Shapes

- **Location**: `shared/ui/skeleton.tsx`
- **Shapes**:
  - `SkeletonText`: 14px height, 4px radius, 60%/80%/90%/full width.
  - `SkeletonMetric`: 28px height, 140px width, 6px radius.
  - `SkeletonIcon`: 40×40px box, 10px radius.
  - `SkeletonCard`: 120px height, 12px radius, full width.
  - `SkeletonAmount`: 20px height, 100px width, 4px radius.
- **Motion**: Subtle 1.5s pulse; disabled when `prefers-reduced-motion` is active.

### 3.2 `EmptyState`

- **Location**: `shared/ui/empty-state.tsx`
- **Variants**:
  - `Variant A (pending-clear)`: Soft teal circular container with checkmark icon. Dignified, reassuring tone.
  - `Variant B (zero-debt)`: Shield-check icon. Reassuring absence of debt. Zero forced borrowing CTA.
  - `Variant C (no-results)`: Neutral search icon with filter reset CTA.
  - `general`: Customizable icon, title, description, optional action.

### 3.3 `ErrorState`

- **Location**: `shared/ui/error-state.tsx`
- **Variants**: `section` (card surface with retry), `page` (full-page offline/disconnect).
- **Principle**: Never leaks internal exceptions or HTTP codes; accepts user-facing copy.

---

## 4. Form Composition Primitives

### 4.1 `FormSection`

- **Location**: `shared/ui/form/form-section.tsx`
- **Structure**: Section title, optional description, content container, optional trailing action.
- **Vertical Rhythm**: Canonical `gap-(--space-3)`. Does not force a card wrapper by default.

### 4.2 `FieldGroup`

- **Location**: `shared/ui/form/field-group.tsx`
- **Responsiveness**: Stacks on narrow screens (<390px), 2 or 3 columns on standard mobile and tablet.
- **Scope**: Layout only; strictly zero domain formulas.

### 4.3 `StickyFormAction`

- **Location**: `shared/ui/form/sticky-form-action.tsx`
- **Structure**: Primary button, optional secondary button, elevated surface, hairline top border, safe-area bottom padding.
- **Layouts**: `split` (side-by-side) or `stacked` (primary on top).

### 4.4 `CalculatedPreview`

- **Location**: `shared/ui/form/calculated-preview.tsx`
- **States**: `valid` (formatted number with formula), `incomplete` (subtle dash `—`, NOT fake ₫0), `error` (warning message).
- **Semantics**: Visually read-only, informational, derived.

### 4.5 `ConfirmationSummary`

- **Location**: `shared/ui/form/confirmation-summary.tsx`
- **Structure**: Summary title, key-value rows (`label`, `value`, `kind`: text/financial), highlighted row support, advisory note, optional edit affordance.
