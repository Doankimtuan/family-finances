# Phase 3C: Add Transaction UX & Interaction Audit

## 1. Overview

The Add Transaction experience ("Ghi chép") is the primary daily operational surface of ViNha. In Phase 3C, we audited and verified:

- Route and destination identity
- Floating Action Button (FAB) stability and active indicator states
- Focus handling and mobile keypad interactions
- Double-tap and concurrent submission prevention
- Post-submission receipt options and return navigation

---

## 2. Interaction Flow Assessment

### 2.1 Route Destination & FAB Stability

- **Route:** `/vi/money/transactions/new` (`APP_PATH.MONEY_ADD`)
- **First-Class Destination Identity:**
  - When navigating to Add Transaction, the center button receives `aria-current="page"` and `data-active="true"`.
  - The outer ring updates from dormant `ring-1 ring-primary-soft` to prominent `ring-2 ring-primary ring-offset-2 ring-offset-background`.
  - Label text displays with `font-semibold text-primary`.
  - Tapping the FAB while already on `/vi/money/transactions/new` safely suppresses redundant `router.push()` cycles.
- **FAB Vertical Geometry:**
  - Resting position: `bottom-2.5 inset-x-0` inside fixed bottom bar.
  - Measured vertical displacement during tab transitions: **0px** across all screen sizes (360px, 390px, 440px).

### 2.2 Form Entry & Keypad Behavior

- **Amount Field Auto-Focus:**
  - In `MoneyCaptureEntry` (`app/[locale]/(product)/money/transactions/new/money-capture-entry.tsx`), the primary amount input mounts with `autoFocus` enabled.
  - Configured with `inputMode="numeric"`, `pattern="[0-9]*"`, and `enterKeyHint="done"`, invoking the clean numeric keypad on iOS and Android.
- **Field Ergonomics:**
  - Directional transaction type toggle (`Expense` / `Income` / `Transfer`) is positioned directly beneath the header.
  - Destination selection (Account, Jar, Category, Date, Note) uses standardized HeroUI dropdowns and date pickers.
  - No viewport scrolling jump occurs when numeric keyboard appears.

### 2.3 Double-Tap & Submission Protection

- **Concurrency Guard:**
  - Submit button explicitly disables and binds `isPending` state during asynchronous server actions.
  - Form submission pipeline incorporates `pendingSubmission` ref locks, preventing multiple records from accidental double-taps on weak network connections.
- **Validation Presentation:**
  - Reactive field-level validation errors render directly under invalid controls without layout reflows.

### 2.4 Post-Submission & Receipt Feedback

- Once recorded, the screen smoothly transitions to `TransactionReceipt`:
  - **Option 1: "Ghi chép khác" (Record Another):** Clears the current amount and note while preserving active account/jar selection for fast batch entry, keeping focus on the amount field.
  - **Option 2: "Xem giao dịch" (View Transaction):** Directs the user to the transaction detail page (`/vi/money/transactions/[id]`).
  - **Option 3: "Xong" (Done):** Cleanly returns to the parent ledger (`/vi/money`).
