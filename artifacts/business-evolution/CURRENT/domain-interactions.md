# Domain Interactions & Event Graph — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Domain Interaction Architecture

ViNha's business model is organized into **9 clear bounded contexts**:
`Accounts`, `Transactions`, `Categories`, `Budgets/Jars`, `Planning`, `Inbox`, `Cards/Debt`, `MonthRitual`, and `Health`.

Every cross-domain interaction is governed by an explicit Producer-Consumer-Event contract to guarantee zero circular dependencies and preserve domain isolation.

---

## 2. Cross-Domain Interaction Matrix

```
                      CONSUMER DOMAIN
PRODUCER DOMAIN   | Accounts | Transactions | Categories | Budgets | Planning | Inbox | Cards | Ritual | Health
------------------+----------+--------------+------------+---------+----------+-------+-------+--------+-------
Accounts          |    --    |   Produces   |     --     |   --    |    --    | Produces| --  |  Reads | Reads
Transactions      | Modifies |      --      |  Triggers  | Updates |    --    | Produces| --  |  Reads | Reads
Categories        |    --    |  Classifies  |     --     |  Maps   |    --    |   --  |   --  |  Reads | Reads
Budgets/Jars      |    --    |      --      |  Governs   |   --    |  Feeds   | Produces| --  |  Locks | Reads
Planning          |    --    |  Generates   |     --     | Allocates|   --    | Annotates| -- |  Reads | Reads
Inbox             |    --    |   Resolves   |  Assigns   | Assigns |  Updates |   --  |   --  |  Reads | Reads
Cards/Debt        |  Creates |   Creates    |     --     |   --    |    --    | Produces|  -- |  Reads | Reads
MonthRitual       |    --    |      --      |     --     |  Locks  |  Locks   | Clears|   --  |   --   | Snapshot
Health (Health-RO)|   NONE   |     NONE     |    NONE    |  NONE   |   NONE   | NONE  |  NONE |  NONE  |  NONE
```

---

## 3. Domain Interaction Specifications

### 3.1 Transactions $\rightarrow$ Budgets/Jars
- **Producer**: `Transactions`
- **Consumer**: `Budgets/Jars`
- **Business Event**: `TransactionIngestedEvent`, `RefundPostedEvent`, `TransactionCorrectedEvent`
- **Interaction Contract**:
  - `TransactionIngestedEvent`: Reduces available spending capacity of mapped Jar by transaction amount.
  - `RefundPostedEvent`: Restores spending capacity of mapped Jar by refund amount (`reverses_transaction_id`).
  - `TransactionCorrectedEvent`: Reverts original Jar impact and applies net corrected amount.

---

### 3.2 Planning $\rightarrow$ Transactions $\rightarrow$ Inbox
- **Producer**: `Planning`
- **Consumers**: `Transactions`, `Inbox`
- **Business Event**: `RecurringPatternTriggeredEvent`
- **Interaction Contract**:
  - Planning emits `RecurringPatternTriggeredEvent`.
  - Transactions creates pending transaction annotated with `source: recurring_pattern` and `pattern_id`.
  - Inbox reads pattern metadata: if confidence is high, auto-resolves silently; if low, queues typed `UnmappedExpense` ReviewItem with pre-filled category/jar suggestions.

---

### 3.3 Inbox $\rightarrow$ Categories / Budgets
- **Producer**: `Inbox`
- **Consumers**: `Categories`, `Budgets/Jars`
- **Business Event**: `ReviewItemResolvedEvent`
- **Interaction Contract**:
  - User or policy resolves Inbox item.
  - Inbox emits `ReviewItemResolvedEvent` carrying selected Category ID and Jar ID.
  - Categories updates merchant mapping rule (BR-16); Budgets binds transaction to target Jar.

---

### 3.4 Cards / Installments $\rightarrow$ Inbox & Calendar
- **Producer**: `Cards/Debt`
- **Consumers**: `Inbox`, `Calendar`
- **Business Event**: `PaymentDueApproachingEvent`, `InstallmentPaidOffEvent`
- **Interaction Contract**:
  - Cards emits `PaymentDueApproachingEvent` 7 days prior to due date.
  - Inbox creates typed `PaymentReminder` ReviewItem (BR-17).
  - Calendar (EO-03) projects payment due date milestone on Household Financial Calendar.

---

### 3.5 Budgets/Jars $\rightarrow$ MonthRitual
- **Producer**: `Budgets/Jars`
- **Consumer**: `MonthRitual`
- **Business Event**: `EmergencyDeclaredEvent`, `JarReallocatedEvent`
- **Interaction Contract**:
  - When a user reallocates jars with `EmergencyDeclaration`, Budgets emits `EmergencyDeclaredEvent`.
  - MonthRitual isolates all emergency events for mandatory review during Step 3 (Reflection).

---

### 3.6 All Operational Domains $\rightarrow$ Health (`Health-RO`)
- **Producers**: `Accounts`, `Transactions`, `Budgets`, `Planning`, `Cards`, `Installments`, `Ritual`
- **Consumer**: `Health`
- **Business Event**: `MonthLockedEvent`, `DailySnapshotTrigger`
- **Interaction Contract (BR-24)**:
  - Health reads read-only database snapshots or listens to `MonthLockedEvent`.
  - Health computes scores, trend metrics, and narratives.
  - Health emits NO events back to operational domains and performs ZERO database writes.
