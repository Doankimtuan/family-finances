# Requirement Evolution — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Requirement Governance Principles

All domain requirements in ViNha are tracked, updated, and versioned. Requirements are classified into:
- **NEW**: Requirements introduced to support validated evolutions.
- **MODIFIED**: Existing requirements updated to align with Business Model v2.
- **RETAINED**: Existing requirements preserved without changes.
- **DEPRECATED**: Requirements superseded or removed due to evolutionary changes.

---

## 2. Comprehensive Requirement Evolution Mapping

| Requirement ID | Domain | Title | Type | Mapped Evolution | Summary of Change |
|---|---|---|---|---|---|
| **REQ-CAT-01** | Categories | Category-Jar N:1 Binding | **NEW** | EVO-01 | Requires every active category to have a valid Jar mapping. |
| **REQ-CAT-02** | Categories | Category Creation Validation | **NEW** | EVO-01 | Rejects category creation without Jar assignment or inline Jar creation. |
| **REQ-INB-01** | Inbox | Strongly-Typed ReviewItems | **NEW** | EVO-02 | Inbox items must instantiate an explicit `ReviewItemType`. |
| **REQ-INB-02** | Inbox | Auto-Resolution Policy Engine | **MODIFIED** | EVO-02, EVO-10 | Executes type-specific auto-resolution based on confidence & metadata. |
| **REQ-INB-03** | Inbox | Item Expiration & Archiving | **NEW** | EVO-07, EVO-10 | Auto-archives stale reminders and auto-resolves old unmapped expenses. |
| **REQ-TRN-01** | Transactions | Refund Linkage & Status Update | **NEW** | EVO-03 | Stores `reverses_transaction_id` and updates status to `PartiallyRefunded`/`FullyRefunded`. |
| **REQ-TRN-02** | Transactions | 3-Way Immutable Audit Link | **NEW** | EVO-04 | Enforces `Reversed` status on original and links reversal & correction records. |
| **REQ-TRN-03** | Transactions | Pattern Metadata Propagation | **NEW** | EVO-10 | Appends `source: recurring_pattern` and `pattern_id` to generated transactions. |
| **REQ-JAR-01** | Budgets/Jars | Refund Jar Balance Restoration | **NEW** | EVO-03 | Restores Jar capacity on refund without modifying monthly income plan. |
| **REQ-JAR-02** | Budgets/Jars | Emergency Declaration Flag | **NEW** | EVO-06 | Stores `EmergencyDeclaration` intent flag on mid-month Jar reallocations. |
| **REQ-JAR-03** | Budgets/Jars | Plan Movement vs Ledger Separation | **MODIFIED** | EVO-05 | Enforces zero touch on account balances during Jar plan movements. |
| **REQ-RIT-01** | Month Ritual | 30-Day Auto-Lock Worker | **NEW** | EVO-07 | Automatically transitions uncompleted rituals > 30 days to `PendingReview` lock. |
| **REQ-RIT-02** | Month Ritual | Emergency Reallocation Surface | **NEW** | EVO-06 | Surfaces declared emergencies for mandatory reflection during ritual. |
| **REQ-RIT-03** | Month Ritual | Quick Close Mode Gate | **NEW** | EVO-07 | Unlocks 1-tap Quick Close mode after 6 consecutive completed rituals. |
| **REQ-CAL-01** | Calendar | Multi-Domain Schedule Projection | **MODIFIED** | EVO-09 | Aggregates `RecurringPattern`, Card due dates, and Installment due dates. |
| **REQ-HLT-01** | Health | Strict Read-Only Snapshotting | **MODIFIED** | EVO-08 | Enforces BR-24 (`Health-RO`); reads operational snapshots with zero write access. |

---

## 3. Detailed Requirement Descriptions

### REQ-CAT-01: Category-Jar N:1 Binding
- **Domain**: Categories / Budgets
- **Statement**: "The system MUST enforce an $N:1$ relationship between Categories and Jars. Multiple categories MAY map to a single Jar, but every Category MUST map to exactly one active Jar. The system MUST block transaction categorization if the chosen Category has no active Jar mapping."

---

### REQ-INB-01: Strongly-Typed ReviewItems
- **Domain**: Inbox
- **Statement**: "The Inbox domain MUST instantiate all items using a typed `ReviewItemType` schema (`UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, `InstallmentComplete`, `EmergencyDeclaration`). Each type MUST define its own validation rules, payload structure, expiration lifecycle, and resolution action."

---

### REQ-TRN-01: Refund Linkage & Status Update
- **Domain**: Transactions / Ledger
- **Statement**: "When recording a refund transaction, the system MUST require `reverses_transaction_id` referencing the original expense transaction ID. The system MUST update the original transaction's status to `PartiallyRefunded` or `FullyRefunded` based on cumulative refund amount and credit the associated Jar."

---

### REQ-TRN-02: 3-Way Immutable Audit Link
- **Domain**: Transactions / Ledger
- **Statement**: "When performing a transaction correction, the system MUST execute a 3-way audit link: (1) set original transaction status to `Reversed`, (2) record a reversal transaction with `reverses_transaction_id` pointing to original, and (3) record a new correction transaction with `corrects_transaction_id` pointing to original. All 3 records MUST be immutably preserved."

---

### REQ-JAR-02: Emergency Declaration Flag
- **Domain**: Budgets / Jars
- **Statement**: "The Jar reallocation interface MUST permit users to attach an `EmergencyDeclaration` metadata flag and user note. When present, the system MUST bypass the mid-month overspend warning modal, immediately commit the plan movement, and tag the event for mandatory Month Ritual reflection."

---

### REQ-RIT-01: 30-Day Auto-Lock Worker
- **Domain**: Month Ritual
- **Statement**: "The Month Ritual domain MUST execute a scheduled temporal check. If a calendar month ritual remains in `InReview` or `Draft` status 30 days post month-end, the system MUST automatically set the ritual status to `PendingReview` and lock all Jar allocations and category mappings for that month."
