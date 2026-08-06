# Comprehensive Risk Analysis — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Risk Evaluation Framework

The Business Evolution Board evaluates risks across 5 strategic dimensions: **Business Model**, **User Experience (UX)**, **System Architecture**, **Data Migration**, and **Financial Safety**.

Every identified risk is assigned a severity rating (High, Medium, Low) and paired with an explicit, verifiable mitigation strategy.

---

## 2. Risk Evaluation Matrix

| Risk ID | Category | Risk Description | Severity | Mitigation Strategy | Validation Gate |
|---|---|---|---|---|---|
| **RSK-BUS-01** | Business | Over-automation in Inbox auto-resolution causes user detachment from spending reality. | **MEDIUM** | Enforce BR-16 confidence threshold ($\ge 90\%$). Never auto-resolve payment reminders, maturity decisions, or emergency declarations. | Monthly user feedback check; 1-tap undo capability on auto-resolved items. |
| **RSK-UX-01** | UX | Category-Jar mapping enforcement creates friction during quick category creation. | **LOW** | Provide inline Jar creation modal and intelligent Jar suggestions during Category setup. | User can create and map a new category in $< 5$ seconds. |
| **RSK-UX-02** | UX | 30-Day Month Ritual temporal auto-lock causes frustration for inactive users. | **MEDIUM** | Auto-locked months transition to `PendingReview` lock, allowing users to unlock, annotate, and approve later while preserving historical integrity. | Users can view and annotate auto-locked months at any time. |
| **RSK-ARC-01** | Architecture | ReviewItem taxonomy complexity increases Inbox domain payload size. | **LOW** | Enforce strict TypeScript discriminated union interfaces and lightweight JSON schemas per item type. | Zero memory leak; Inbox render time $< 100\text{ms}$. |
| **RSK-MIG-01** | Migration | Existing unmapped categories in historical data break Category-Jar contract during migration. | **HIGH** | Run background migration script mapping orphaned categories to a system default "Uncategorized Jar" before enforcing BR-12. | 100% of historical transactions mapped to valid Jars post-migration. |
| **RSK-FIN-01** | Financial | Refund credits misapplied to wrong Jar alter monthly Jar spending capacity. | **HIGH** | Require `reverses_transaction_id` verification. Refund credit MUST match the original transaction's assigned Jar. | Automated unit test verifying Jar capacity restoration on refund. |
| **RSK-FIN-02** | Financial | Confusion between Real Ledger Adjustments and Virtual Plan Reallocations leads to double-counting. | **HIGH** | Strict UI separation and domain isolation: Plan movements execute `$0.00` ledger transactions and display clear modal warnings. | Zero balance drift between bank feeds and ledger accounts. |

---

## 3. Financial Safety & Auditability Verification

1. **Zero Double Counting**: Reversal pairs in the Correction Lifecycle net out to exactly `$0.00` impact on bank ledger balances.
2. **Read-Only Health Shield**: Health domain components possess read-only database connections (**BR-24**), rendering it mathematically impossible for Health computations to alter financial balances or write to operational records.
3. **Immutable Audit Trail**: Historical ledger transactions, corrections, and locked Month Ritual records are immutable and append-only.
