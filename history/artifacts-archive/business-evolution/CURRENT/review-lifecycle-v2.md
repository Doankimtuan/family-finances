# Review Lifecycle v2 — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Review Item Lifecycle Overview

The **ReviewItem Lifecycle v2** defines the precise stage transitions, auto-resolution triggers, and archiving rules for items managed inside the Inbox domain.

Every ReviewItem moves through a deterministic lifecycle from instantiation to archiving, preventing stale items from cluttering the household decision queue.

---

## 2. ReviewItem State Machine

```
+------------------+       Ingestion & Enriched
|  [0] Ingested    | ---------------------------------+
+------------------+                                  |
         |                                            |
         v                                            v
+------------------+  High-Confidence Match   +-------------------+
| [1] Auto-Evaluate| -----------------------> | [4] Auto-Resolved |
+------------------+                          +-------------------+
         |                                              |
   Low Confidence                                       |
         v                                              |
+------------------+                                    |
|  [2] Queued      |                                    |
+------------------+                                    |
    |          |                                        |
 User Action Temporal Expire (BR-15)                    |
    |          |                                        |
    v          v                                        v
+----------+ +------------+                   +-------------------+
|[3]Resolved|[5] Expired |                   | [6] Committed to  |
+----------+ +------------+                   | Operational Domain|
     |             |                          +-------------------+
     +-------------+------------------------------------+
                   |
                   v
          +------------------+
          |  [7] Archived    |
          +------------------+
```

---

## 3. Detailed ReviewItem Lifecycle Stages

| Stage ID | Stage Name | Trigger / Condition | System Behavior |
|---|---|---|---|
| **S0** | `Ingested` | Ingested event from Accounts, Transactions, Cards, or Savings. | Instantiates explicit `ReviewItemType` schema with payload. |
| **S1** | `Auto-Evaluate` | Background policy engine evaluation. | Checks merchant rules (BR-16), pattern metadata (`source: recurring_pattern`), and historical confidence scores. |
| **S2** | `Queued` | Confidence score < threshold. | Item surfaces in active Inbox decision queue with pre-filled suggestions. |
| **S3** | `Resolved` | User 1-tap confirm, manual selection, or split. | User selection captured; emits `ReviewItemResolvedEvent`. |
| **S4** | `Auto-Resolved` | Confidence score $\ge$ threshold. | System automatically assigns Category/Jar; emits `ReviewItemResolvedEvent` with `auto_resolved = true`. |
| **S5** | `Expired` | Item exceeds temporal limit (e.g., payment due date + 7 days). | Item marked as expired per **BR-15**. |
| **S6** | `Committed` | Operational domain receives `ReviewItemResolvedEvent`. | Category mapping, Jar capacity decrement, or notification status committed. |
| **S7** | `Archived` | Item resolved, auto-resolved, or expired. | Item moved to Archived tab for permanent audit history. |

---

## 4. Auto-Resolution Policies & Safeguards

1. **Unmapped Expenses**: Auto-resolves ONLY if merchant rule exists or pattern metadata matches with $\ge 90\%$ confidence. Low-confidence matches remain queued.
2. **Payment Reminders**: NEVER auto-resolved. Requires user confirmation or temporal expiration.
3. **Maturity Decisions**: NEVER auto-resolved. Requires explicit household choice. Resolving an item cancels remaining 30/14/7 day notification timers (**BR-21**).
4. **Stale Triage**: Unmapped expenses older than 30 days are auto-resolved to the Miscellaneous Jar upon Month Lock (**BR-08 / BR-15**).
