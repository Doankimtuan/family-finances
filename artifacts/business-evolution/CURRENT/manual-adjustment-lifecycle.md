# Manual Adjustment Lifecycle Specification — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Context & Business Problem

A critical business smell in the initial model was the ambiguous conflation of **Real Ledger Adjustments** (reconciling a bank balance discrepancy) and **Intention Plan Reallocations** (moving virtual money between Jars) (Business Smell 12.3; Reality Validation DNI-01).

When mid-month Jar reallocations (EO-19) were presented as ledger transactions or vice-versa, users became confused, assuming that moving money from "Dining Jar" to "Groceries Jar" transferred funds between physical bank accounts. This violated **BR-01** (Real Ledger $\neq$ Virtual Jars).

The **Manual Adjustment Lifecycle** establishes an absolute decoupling between Ledger Adjustments and Plan Reallocations.

---

## 2. Decoupled Lifecycle Architecture

```
+-------------------------------------------------------------------------+
|                  PATH A: REAL LEDGER ADJUSTMENT                         |
|   Domain: Accounts / Ledger                                             |
|   Trigger: Bank balance reconciliation (e.g. cash discrepancy)          |
|   Action: Generates Ledger Transaction (`adjustment_type: balance`)     |
|   Impact: Updates Real Account Balance                                  |
|   Plan Impact: Creates `UnmappedExpense` ReviewItem in Inbox            |
+-------------------------------------------------------------------------+

+-------------------------------------------------------------------------+
|                PATH B: INTENTION PLAN REALLOCATION                      |
|   Domain: Budgets / Jars                                                |
|   Trigger: User moves virtual capacity from Jar A to Jar B (EO-19)      |
|   Action: Executes Plan Movement record (`type: plan_reallocation`)     |
|   Impact: Updates Virtual Jar Capacities (Jar A -, Jar B +)             |
|   Ledger Impact: ZERO touch on Bank Accounts or Ledger Transactions     |
+-------------------------------------------------------------------------+
```

---

## 3. Comparative Rule Matrix

| Dimension | Path A: Real Ledger Adjustment | Path B: Intention Plan Reallocation |
|---|---|---|
| **Owning Domain** | Accounts / Ledger | Budgets / Jars |
| **Primary Object** | `Transaction` (Ledger Record) | `PlanMovement` (Virtual Allocation) |
| **Physical Bank Balance** | **MUTATED** (reconciles real cash/bank) | **UNTOUCHED** ($\$0.00$ ledger impact) |
| **Jar Allocation Capacity** | Creates `UnmappedExpense` ReviewItem | Directly decrements Jar A and increments Jar B |
| **Constitutional Rule** | Preserves ledger truth | Preserves **BR-01** Intention Purity |
| **UI Presentation** | "Account Balance Reconciliation" modal | "Reallocate Jar Intentions" slider / transfer |

---

## 4. UI Safeguards & Mental Model Enforcement

1. **Clear Modal Framing**: The Jar reallocation UI explicitly displays a banner: *"Plan Reallocation — This adjusts your virtual spending intentions, NOT your bank account balances."*
2. **Distinct Terminology**: Real ledger adjustments use the term **"Reconcile Account Balance"**; virtual plan adjustments use the term **"Reallocate Jar Capacity"**.
3. **Audit Isolation**: Reallocations appear in the Jar Movement History log, completely separated from Bank Account Statements.
