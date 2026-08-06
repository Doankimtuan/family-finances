# Synchronized Acceptance Criteria Repository — ViNha

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Version:** v2.1  

---

## 1. Acceptance Criteria Framework

Every requirement in ViNha is covered by objective, measurable **Given-When-Then** Acceptance Criteria (AC).

---

## 2. Comprehensive Acceptance Criteria Index

### AC-CAT-01: Category ↔ Jar N:1 Binding (REQ-CAT-01, BR-12)
- **GIVEN** a user is creating a new transaction category "Pet Grooming",
- **WHEN** the user attempts to save without selecting a Jar,
- **THEN** the system blocks submission and displays a required Jar selection dropdown.

---

### AC-INB-01: Typed ReviewItem Generation (REQ-INB-01, BR-05)
- **GIVEN** an event occurs in Accounts, Planning, Cards, or Savings,
- **WHEN** a ReviewItem is created in Inbox,
- **THEN** the item MUST instantiate an explicit `ReviewItemType` schema (`UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, `InstallmentComplete`, `EmergencyDeclaration`).

---

### AC-TRN-01: Refund Linkage & Status Update (REQ-TRN-01, BR-02)
- **GIVEN** a refund transaction of $50 is posted,
- **WHEN** the user links it to an original expense transaction of $150,
- **THEN** the system stores `reverses_transaction_id`, updates original status to `PartiallyRefunded`, and credits $50 back to the assigned Jar's spending capacity.

---

### AC-TRN-02: 3-Way Correction Audit Chain (REQ-TRN-02, BR-03)
- **GIVEN** an expense transaction of $100 posted to "Dining" is corrected to $10,
- **WHEN** the correction is submitted,
- **THEN** the system creates:
  1. Original transaction marked as `Reversed`.
  2. Reversal credit transaction of $100 with `reverses_transaction_id` = original ID.
  3. New debit transaction of $10 with `corrects_transaction_id` = original ID.
- **AND** all three records remain permanently in the ledger.

---

### AC-JAR-01: Plan Movement Zero Account Impact (REQ-JAR-03, BR-01)
- **GIVEN** a user reallocates $100 from "Dining Jar" to "Groceries Jar",
- **WHEN** the reallocation is committed,
- **THEN** the Jar balances update (+100 / -100), ZERO ledger transactions are created, and bank account balances remain unchanged.

---

### AC-JAR-02: Emergency Warning Bypass (REQ-JAR-02, BR-07)
- **GIVEN** a user reallocates $200 and checks "Declare Emergency",
- **WHEN** the reallocation is submitted,
- **THEN** the mid-month BR-07 warning modal is bypassed, `is_emergency = true` is recorded, and a notification is sent to the partner's device (BR-13).

---

### AC-RIT-01: 30-Day Temporal Auto-Lock (REQ-RIT-01, BR-08)
- **GIVEN** a Month Ritual for January remains unapproved on March 2nd (30+ days post month-end),
- **WHEN** the daily background worker executes,
- **THEN** January's ritual status transitions to `PendingReview` and January Jar allocations are locked against editing.

---

### AC-HLT-01: Health Read-Only Verification (REQ-HLT-01, BR-24)
- **GIVEN** any component in the Health domain executes,
- **WHEN** score calculation, narrative generation, or trend synthesis runs,
- **THEN** the operation makes ZERO write calls to database, API, or local state of any operational domain.
