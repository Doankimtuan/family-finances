# Acceptance Criteria Evolution — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Measurable Acceptance Criteria Framework

All acceptance criteria (AC) in ViNha are written to be **unambiguous, objective, and testable**. Every evolved lifecycle, business rule, and cross-domain contract has explicit Given-When-Then criteria.

---

## 2. Acceptance Criteria by Evolution

### AC-EVO-01: Category ↔ Jar Formal Contract

#### AC-01.1: Category Creation Requires Jar Assignment
- **GIVEN** a user is creating a new transaction category "Vet Fees",
- **WHEN** the user attempts to save the category without selecting a Jar,
- **THEN** the system blocks submission and displays a required Jar selection modal.

#### AC-01.2: Unmapped Category Transaction Triage
- **GIVEN** an external transaction arrives with a category unmapped to any Jar,
- **WHEN** the transaction is ingested,
- **THEN** the system generates a typed `UnmappedExpense` ReviewItem in Inbox and sets transaction status to `PendingMapping`.

#### AC-01.3: Month Ritual Divergence Check
- **GIVEN** one or more categories have spending in the current month but no active Jar mapping,
- **WHEN** the Month Ritual begins,
- **THEN** Step 1 (Divergence Check) highlights the unmapped categories and blocks ritual completion until mapped.

---

### AC-EVO-02: Typed ReviewItem Taxonomy

#### AC-02.1: Typed Item Generation
- **GIVEN** an event occurs in Accounts, Planning, Cards, or Savings,
- **WHEN** a ReviewItem is created in Inbox,
- **THEN** the item MUST contain a valid `type` enum (`UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, `InstallmentComplete`, `EmergencyDeclaration`) and matching payload schema.

#### AC-02.2: Expiration Behavior by Type
- **GIVEN** a `PaymentReminder` ReviewItem exists in Inbox,
- **WHEN** current date exceeds the payment due date + 7 days,
- **THEN** the item automatically transitions to `Expired` and moves to the Archived tab.

---

### AC-EVO-03: Structured Refund Lifecycle

#### AC-03.1: Refund Linkage Validation
- **GIVEN** a user or bank feed posts a refund transaction of $50,
- **WHEN** the user links it to an original expense transaction of $150,
- **THEN** the system stores `reverses_transaction_id`, updates the original transaction status to `PartiallyRefunded`, and credits $50 back to the assigned Jar's spending capacity.

#### AC-03.2: Income Exclusion
- **GIVEN** a refund transaction of $150 is posted and linked to an expense,
- **WHEN** the monthly income summary is calculated,
- **THEN** the $150 refund is strictly excluded from total monthly income and credited directly to Jar allocation capacity.

---

### AC-EVO-04: Immutable Correction Lifecycle

#### AC-04.1: 3-Way Audit Chain Creation
- **GIVEN** an expense transaction of $100 posted to "Groceries" is corrected to $10,
- **WHEN** the correction is submitted,
- **THEN** the system creates:
  1. Original transaction marked as `Reversed`.
  2. Reversal credit transaction of $100 with `reverses_transaction_id` = original ID.
  3. New debit transaction of $10 with `corrects_transaction_id` = original ID.
- **AND** all three records remain permanently visible in the audit ledger.

---

### AC-EVO-05: Decoupled Manual Adjustment Lifecycle

#### AC-05.1: Plan Movement Zero Account Impact
- **GIVEN** a user reallocates $100 from "Dining Jar" to "Groceries Jar",
- **WHEN** the reallocation is committed,
- **THEN** the Jar balances update (+100 / -100), but ZERO ledger transactions are created and bank account balances remain unchanged.

---

### AC-EVO-06: Explicit Emergency Flow

#### AC-06.1: Emergency Warning Bypass
- **GIVEN** a user reallocates $200 to cover an overspent Jar and checks "Declare Emergency",
- **WHEN** the reallocation is submitted,
- **THEN** the mid-month BR-07 overspend warning modal is bypassed, the plan movement executes immediately, and `is_emergency = true` is recorded.

#### AC-06.2: Month Ritual Surface
- **GIVEN** two emergency declarations occurred during the month,
- **WHEN** the Month Ritual reaches Step 3 (Reflection),
- **THEN** both emergency reallocations are displayed in an "Emergency Spending" summary section requiring user annotation.

---

### AC-EVO-07: Month Ritual Maturity & Auto-Lock

#### AC-07.1: 30-Day Temporal Auto-Lock
- **GIVEN** a Month Ritual for January remains unapproved on March 2nd (30+ days post month-end),
- **WHEN** the daily background worker executes,
- **THEN** January's ritual status transitions to `PendingReview` and January Jar allocations are locked against editing.

---

### AC-EVO-08: Health Read-Only Policy (`Health-RO`)

#### AC-08.1: Zero Write Verification
- **GIVEN** any component in the Health domain executes,
- **WHEN** score calculation, narrative generation, or trend synthesis runs,
- **THEN** the operation makes ZERO write calls to database, API, or local state of any operational domain.

---

### AC-EVO-09: Unified Household Schedule

#### AC-09.1: Multi-Source Calendar Aggregation
- **GIVEN** a household has a recurring rent bill ($1,200), a credit card payment due date (15th), and an installment payoff (20th),
- **WHEN** the Calendar view (EO-03) renders,
- **THEN** all three events appear on their respective calendar dates with correct source tags.
