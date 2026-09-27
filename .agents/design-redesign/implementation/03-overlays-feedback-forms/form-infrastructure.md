# Form Infrastructure & Error Placement Policy — Implementation 03

This document outlines the usage guidelines for the form composition primitives (`FormSection`, `FieldGroup`, `StickyFormAction`, `CalculatedPreview`, `ConfirmationSummary`) and codifies the canonical error placement policy across forms and mutations.

---

## 1. Form Composition Primitives

### 1.1 `FormSection`

- **Use When**: Dividing a form into logical thematic blocks (e.g. Account Details, Deposit Term, Interest Rules).
- **Do NOT Use When**: Wrapping a single isolated input field; simple inputs should sit in the page flow directly.
- **Card Rule**: Default `variant="plain"` provides clean vertical rhythm (`gap-(--space-3)`). Use `variant="surface"` only for visually highlighted segments.

### 1.2 `FieldGroup`

- **Use When**: Laying out two or three tightly related fields on the same logical row (e.g. Quantity + Unit Price, Term + Time Unit).
- **Responsive Guarantee**: Automatically stacks into single-column on 360px viewports so numeric entry fields remain sufficiently wide for 44px tap targets.
- **Strict Boundary**: Layout only. Never encode financial arithmetic inside `FieldGroup`.

### 1.3 `StickyFormAction`

- **Use When**: Providing submit and cancel actions for long creation/editing flows.
- **Safe Area**: Uses `env(safe-area-inset-bottom, 0px)` to avoid collision with iOS home indicators.
- **Layouts**: `split` (side-by-side) or `stacked` (primary on top, cancel below).

### 1.4 `CalculatedPreview`

- **Use When**: Displaying derived financial outcomes resulting from user input (e.g., Total Cost = Units × Price).
- **Visual Semantics**: Clearly read-only (`bg-surface-muted/50`), tabular numbers.
- **State Policy**:
  - `valid`: Displays formatted currency with formula subtitle.
  - `incomplete`: Displays subtle dash (`—`), NEVER fake `₫ 0`!
  - `error`: Displays error message in crimson text.

### 1.5 `ConfirmationSummary`

- **Use When**: Presenting an explicit review step before executing high-impact financial transactions (e.g., Transfer Confirmation, Investment Sell Order).
- **Features**: Key-value rows, financial value masking support, row highlighting, advisory invariant notes, edit button.

---

## 2. Server & Action Error Placement Hierarchy

To prevent confusing the user by duplicating errors simultaneously across fields, alerts, and toasts, ViNha strictly applies the following placement rules:

| Error Type                                                                        | Visual Component                | Placement                                | Duplicated to Toast?              |
| :-------------------------------------------------------------------------------- | :------------------------------ | :--------------------------------------- | :-------------------------------- |
| **Field Validation Error** (e.g. negative amount, empty name)                     | `FormField` / Input Error       | Directly beneath the failing input field | **NO**                            |
| **Form-Level Business Invariant** (e.g. insufficient balance, envelope overspent) | `<InlineAlert variant="error">` | Top of the form container                | **NO**                            |
| **Asynchronous Network / System Failure** (after form submitted & drawer closing) | `<Toast variant="danger">`      | Top/bottom floating notification         | **YES** (Only if form has closed) |
| **Dialog Confirmation Failure**                                                   | `<InlineAlert variant="error">` | Inside `DialogContent` above actions     | **NO**                            |
