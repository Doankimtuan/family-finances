# Synchronized Requirements — ViNha

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Version:** v2.1  

---

## 1. Domain Requirements Inventory

| Requirement ID | Domain | Title | Mapped Business Rule | Functional Statement |
|---|---|---|---|---|
| **REQ-CAT-01** | Categories | Category-Jar N:1 Binding | BR-12 | System enforces $N:1$ Category-to-Jar mapping constraint. |
| **REQ-CAT-02** | Categories | Category Creation Validation | BR-12 | Category creation requires Jar assignment or inline Jar creation. |
| **REQ-INB-01** | Inbox | Strongly-Typed ReviewItems | BR-05, BR-10, BR-17 | Inbox items must instantiate an explicit `ReviewItemType` schema. |
| **REQ-INB-02** | Inbox | Auto-Resolution Engine | BR-15, BR-16 | Executes policy auto-resolution based on confidence scores & metadata. |
| **REQ-INB-03** | Inbox | Item Expiration & Archiving | BR-15, BR-21 | Auto-archives stale reminders and resolves old unmapped expenses. |
| **REQ-TRN-01** | Transactions | Refund Linkage & Status Update | BR-02 | Stores `reverses_transaction_id` and updates status to `PartiallyRefunded`/`FullyRefunded`. |
| **REQ-TRN-02** | Transactions | 3-Way Immutable Audit Link | BR-03 | Enforces `Reversed` status on original and links reversal & correction records. |
| **REQ-TRN-03** | Transactions | Pattern Metadata Propagation | BR-16 | Appends `source: recurring_pattern` and `pattern_id` to generated transactions. |
| **REQ-JAR-01** | Budgets/Jars | Refund Jar Capacity Restoration | BR-02 | Restores Jar capacity on refund without modifying monthly income plan. |
| **REQ-JAR-02** | Budgets/Jars | Emergency Declaration Flag | BR-07 | Stores `is_emergency = true` flag on mid-month Jar reallocations. |
| **REQ-JAR-03** | Budgets/Jars | Plan Movement vs Ledger Separation | BR-01 | Enforces zero touch on account balances during Jar plan movements. |
| **REQ-RIT-01** | Month Ritual | 30-Day Auto-Lock Worker | BR-08 | Automatically transitions uncompleted rituals > 30 days to `PendingReview` lock. |
| **REQ-RIT-02** | Month Ritual | Emergency Reallocation Surface | BR-07, BR-13 | Surfaces declared emergencies for mandatory reflection during ritual. |
| **REQ-RIT-03** | Month Ritual | Quick Close Mode Gate | BR-09, BR-23 | Unlocks 1-tap Quick Close mode after 6 consecutive completed rituals. |
| **REQ-CAL-01** | Calendar | Multi-Domain Schedule Projection | BR-17, BR-20 | Aggregates `RecurringPattern`, Card due dates, and Installment due dates. |
| **REQ-HLT-01** | Health | Strict Read-Only Snapshotting | BR-24 | Enforces BR-24 (`Health-RO`); reads operational snapshots with zero write access. |
