# Correction Lifecycle Specification — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Context & Business Problem

Financial correctness requires that posted transactions are **never deleted or silently modified** (**BR-02**). When an erroneous transaction is posted (e.g., miskeyed amount or incorrect account), correcting it requires appending a reversal transaction and a new correct transaction.

In the initial specification, no explicit 3-way audit link contract bound these three records together, leaving accounting trails vulnerable to breakages (Lifecycle Gap 2; Business Smell 6.1).

The **Correction Lifecycle** establishes a formal 3-way immutable audit chain connecting the Original, Reversal, and Correction transactions (**BR-03**).

---

## 2. 3-Way Audit Chain Graph

```
                   +----------------------------------+
                   |   Tx 101: Original Transaction   |
                   |   Amount: -$100.00               |
                   |   Status: Reversed               |
                   +----------------------------------+
                        ^                        ^
                        |                        |
   reverses_transaction_id                       | corrects_transaction_id
                        |                        |
+----------------------------------+   +----------------------------------+
|   Tx 102: Reversal Transaction   |   |  Tx 103: Correction Transaction  |
|   Amount: +$100.00               |   |  Amount: -$10.00                 |
|   Status: Posted (Reversal)      |   |  Status: Posted (Active)         |
+----------------------------------+   +----------------------------------+
```

---

## 3. Detailed Operational Workflow

1. **User Triggers Correction**: User opens an erroneous transaction (`Tx 101`, -$100 posted to Dining) and selects "Correct Transaction". User inputs correct details (-$10 posted to Dining).
2. **System Executes 3-Way Atomic Transaction**:
   - **Step A**: Update `Tx 101` status to `Reversed`. `Tx 101` becomes read-only and is locked against further edits or reversals.
   - **Step B**: Generate Reversal `Tx 102` (+$100 credit) with field `reverses_transaction_id = 101`. Restores $100 spending capacity to Dining Jar.
   - **Step C**: Generate Correction `Tx 103` (-$10 debit) with field `corrects_transaction_id = 101`. Decrements $10 spending capacity from Dining Jar.
3. **Net Ledger Balance Impact**:
   $$\text{Net Balance Change} = (-100) + (+100) + (-10) = -\$10.00$$
   Real account balance and virtual Jar capacity accurately reflect the corrected $10 debit.

---

## 4. Audit & Compliance Rules

- **Zero Deletion Guarantee**: None of the 3 records (`Tx 101`, `Tx 102`, `Tx 103`) can ever be removed from the database.
- **Audit UI Rendering**: When inspecting `Tx 103` in the user interface, a expandable "Correction Audit Chain" banner displays links to the original `Tx 101` and reversal `Tx 102`.
- **Month Lock Interaction**: If `Tx 101` belongs to a locked month (**BR-08**), corrections MUST be posted in the current active month, carrying forward the audit references without modifying the locked historical month totals.
