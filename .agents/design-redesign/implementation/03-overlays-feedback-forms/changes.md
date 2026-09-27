# Change Log — Implementation 03

**Date**: September 27, 2026  
**Implementation Phase**: Implementation 03 — Overlays, Feedback & Form Infrastructure

---

## 1. Newly Created Canonical Components

| Component                            | Path                                      | Description                                                                                                        |
| :----------------------------------- | :---------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| `Dialog` & `ConfirmDialog`           | `shared/ui/dialog.tsx`                    | Canonical modal dialog with confirmation, destructive (`role="alertdialog"`), and info modes.                      |
| `BottomSheet` & `BottomSheetContent` | `shared/ui/bottom-sheet.tsx`              | Canonical mobile drawer with 16px radius, drag handle, and safe-area sticky footer.                                |
| `ActionMenu`                         | `shared/ui/action-menu.tsx`               | Canonical action menu distinct from select; supports default, disabled, destructive items and keyboard navigation. |
| `Toast`                              | `shared/ui/toast.tsx`                     | Canonical toast component and toast dispatcher exports.                                                            |
| `InlineAlert`                        | `shared/ui/inline-alert.tsx`              | Canonical in-page alert with 4 semantic variants (`info`, `warning`, `error`, `success`).                          |
| `EmptyState`                         | `shared/ui/empty-state.tsx`               | Canonical empty state with variants A, B, C and general customizable layout.                                       |
| `ErrorState`                         | `shared/ui/error-state.tsx`               | Canonical error card and page state with retry affordance and safe messaging.                                      |
| `FormSection`                        | `shared/ui/form/form-section.tsx`         | Form composition section with title, description, and canonical vertical rhythm.                                   |
| `FieldGroup`                         | `shared/ui/form/field-group.tsx`          | Layout primitive managing responsive 1/2/3-column stacking for related inputs.                                     |
| `StickyFormAction`                   | `shared/ui/form/sticky-form-action.tsx`   | Sticky bottom action bar with safe area padding and split/stacked layouts.                                         |
| `CalculatedPreview`                  | `shared/ui/form/calculated-preview.tsx`   | Read-only derived financial figures display with valid, incomplete, and error states.                              |
| `ConfirmationSummary`                | `shared/ui/form/confirmation-summary.tsx` | Key-value review summary with financial formatting and row highlighting.                                           |

---

## 2. Updated Components & Foundations

| File                      | Change Details                                                                                                                     |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| `styles/globals.css`      | Added `--z-scrim: 50;` and `--z-modal-sheet: 60;` to `@theme` layering scale.                                                      |
| `shared/ui/skeleton.tsx`  | Expanded with geometric shape primitives: `SkeletonText`, `SkeletonMetric`, `SkeletonIcon`, `SkeletonCard`, `SkeletonAmount`.      |
| `shared/ui/form/index.ts` | Re-exported all new form primitives (`FormSection`, `FieldGroup`, `StickyFormAction`, `CalculatedPreview`, `ConfirmationSummary`). |
| `shared/ui/index.ts`      | Re-exported all canonical overlays, feedback, skeleton, empty/error, and form components.                                          |

---

## 3. Backward Compatibility Safeguards

- `shared/patterns/dialog.tsx`, `sheet.tsx`, `bottom-action-bar.tsx`, `confirm-summary.tsx`, `empty-state.tsx`, and `error-state.tsx` preserved to ensure existing legacy tests and domain pages continue to operate seamlessly during transition.
- Zero breaking changes introduced to application routes or domain modules.
