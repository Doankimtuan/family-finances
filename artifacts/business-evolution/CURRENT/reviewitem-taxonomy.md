# ReviewItem Taxonomy Specification — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Executive Rationale

In the initial specification, the Inbox domain processed all incoming triage items as generic `ReviewItems`. An unmapped transaction, a credit card due date alert, a savings maturity notification, and an installment payoff notice shared identical data structures.

This design flaw prevented the implementation of safe auto-resolution policies (EO-16) because resolution semantics differed completely across item origins (Business Smell 2.2, 13.1, 16.2).

The **ReviewItem Taxonomy** establishes a strongly-typed schema for all Inbox items, defining explicit payload contracts, resolution handlers, auto-resolution policies, and expiration lifecycles for each type.

---

## 2. Comprehensive Taxonomy Map

```
                           +------------------------+
                           |  Base ReviewItem Schema |
                           |  id, household_id,     |
                           |  created_at, status    |
                           +------------------------+
                                       |
    +------------------+---------------+---------------+------------------+
    |                  |                               |                  |
    v                  v                               v                  v
+---------------+  +----------------+           +---------------+  +-------------------+
|UnmappedExpense|  |MaturityDecision|           |PaymentReminder|  |InstallmentComplete|
+---------------+  +----------------+           +---------------+  +-------------------+
```

---

## 3. Detailed ReviewItem Type Specifications

### 3.1 `UnmappedExpense` Type
- **Source Domain**: `Transactions` (via BR-05).
- **Trigger**: Transaction ingested with an unmapped category or unknown payee.
- **Payload Schema**:
  ```json
  {
    "transaction_id": "tx_89123",
    "amount": 45.50,
    "payee": "Grab Ride",
    "suggested_category_id": "cat_transport",
    "suggested_jar_id": "jar_transport",
    "confidence_score": 0.85
  }
  ```
- **Resolution Handler**: Maps transaction category to selected Jar; creates merchant rule if confirmed 3x (**BR-16**).
- **Auto-Resolution Policy**: Auto-resolves if `confidence_score` $\ge 0.90$ or matching merchant rule exists. Auto-resolves to Miscellaneous Jar after 30 days (**BR-15**).

---

### 3.2 `MaturityDecision` Type
- **Source Domain**: `Savings` (via BR-10).
- **Trigger**: Savings CD product reaching maturity date within 30/14/7 days.
- **Payload Schema**:
  ```json
  {
    "savings_product_id": "sav_4021",
    "principal": 5000.00,
    "interest_earned": 150.00,
    "maturity_date": "2026-08-30"
  }
  ```
- **Resolution Handler**: Executes user choice: (1) Reinvest in new CD, (2) Transfer principal + interest to Checking, (3) Allocate to Goal Jar.
- **Auto-Resolution Policy**: **NEVER auto-resolved**. Resolving this item automatically cancels pending 30/14/7 day notification timers (**BR-21**).

---

### 3.3 `PaymentReminder` Type
- **Source Domain**: `Cards` (via BR-17).
- **Trigger**: Credit card payment due date approaching within 7 days.
- **Payload Schema**:
  ```json
  {
    "card_id": "card_9912",
    "statement_balance": 1250.00,
    "minimum_payment": 50.00,
    "due_date": "2026-08-15"
  }
  ```
- **Resolution Handler**: User marks as paid, schedules payment, or snoozes (max 3 days).
- **Auto-Resolution Policy**: **NEVER auto-resolved**. Transitions to `Expired` 7 days post due date and moves to Archive (**BR-15**).

---

### 3.4 `InstallmentComplete` Type
- **Source Domain**: `Installments` (via BR-11).
- **Trigger**: Final installment payment posted, paying off debt balance.
- **Payload Schema**:
  ```json
  {
    "installment_id": "inst_102",
    "total_paid": 2400.00,
    "freed_monthly_cashflow": 200.00
  }
  ```
- **Resolution Handler**: User chooses where to redirect freed monthly cash flow (e.g., Savings Jar or Goal Jar).
- **Auto-Resolution Policy**: **NEVER auto-resolved**. Triggers celebration UI upon user interaction.

---

### 3.5 `EmergencyDeclaration` Type
- **Source Domain**: `Budgets / Jars` (via EVO-06).
- **Trigger**: Mid-month Jar reallocation executed with `is_emergency = true`.
- **Payload Schema**:
  ```json
  {
    "reallocation_id": "realloc_771",
    "source_jar_id": "jar_savings",
    "target_jar_id": "jar_car_maintenance",
    "amount": 350.00,
    "intent_note": "Emergency brake repair"
  }
  ```
- **Resolution Handler**: Partner acknowledges emergency declaration and note.
- **Auto-Resolution Policy**: Automatically queued for mandatory review in Month Ritual Step 3.
