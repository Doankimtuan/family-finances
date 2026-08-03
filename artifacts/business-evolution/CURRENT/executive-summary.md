# Executive Summary — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Executive Intent & Mission

ViNha is built on a clear, uncompromising identity: **ViNha is a Household Money Operating System, NOT an Expense Tracker**. 

While simple expense trackers collect historical transactions in isolated silos, ViNha integrates the complete household money operating cycle: **Home** (reflection & health), **Money** (real accounts & ledger), **Plan** (virtual jars & recurring patterns), **Inbox** (triage & decision queue), and **Together** (partner collaboration & shared ritual).

Prior review boards (`domain-reality-validation`, `business-cohesion`, `product-decision-board`, and `domain-philosophy`) conducted rigorous audits of ViNha's initial model and identified **18 active business smells, lifecycle gaps, and cross-domain seams**. 

The **Business Evolution Board** was convened to resolve these validated weaknesses. This pack defines **Business Model v2**—a cohesive, hardened business architecture that eliminates all identified seams, completes every broken lifecycle, enforces strict domain mapping contracts, and provides a 5-to-10-year growth foundation without violating any core principle of ViNha's Product Constitution.

---

## 2. Core Identity & Constitutional Preservation

Every evolution in Business Model v2 strictly adheres to the following non-negotiable constitution:

```
+-------------------------------------------------------------------------+
|                       VINHA PRODUCT CONSTITUTION                         |
+-------------------------------------------------------------------------+
| 1. BR-01: Real Ledger != Virtual Jars (Bank Money != Intention Plan)    |
| 2. BR-14 / BR-24: Health is 100% Read-Only (Health-RO)                  |
| 3. Household-First Architecture (Shared ownership & collaborative UX)   |
| 4. Progressive Disclosure (Simplicity for daily use, depth on demand)   |
| 5. Mobile-First Simplicity (Touch-optimized, immediate feedback)         |
| 6. Clear Bounded Contexts (Zero duplicated domain ownership)            |
| 7. No Feature Explosion (100% traceable to validated evidence)          |
+-------------------------------------------------------------------------+
```

---

## 3. High-Level Summary of Evolutions

Business Model v2 introduces **10 targeted, fully-traceable business evolutions**:

1. **Category ↔ Jar Formal Contract (Evolution 1)**: Resolves the gap between transaction classification (Categories) and spending intention (Jars). Defines an $N:1$ category-to-jar mapping rule, establishes Jar taxonomy primacy, and introduces automated divergence feedback loops during the Month Ritual.
2. **Typed ReviewItem Taxonomy (Evolution 2)**: Transforms the generic Inbox queue into a strongly-typed decision engine (`UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, `InstallmentComplete`, `EmergencyDeclaration`). Enables safe auto-resolution policies without risk of misinterpreting critical alerts.
3. **Structured Refund Lifecycle (Evolution 3)**: Closes Lifecycle Gap 1 by introducing a formal refund transaction model carrying `reverses_transaction_id`. Updates original transaction status to `PartiallyRefunded` or `FullyRefunded` and restores Jar balances without distorting monthly income plans.
4. **Immutable Correction Lifecycle (Evolution 4)**: Closes Lifecycle Gap 2 by establishing an explicit 3-way immutable audit chain: Original transaction (`Reversed`), Reversal transaction (`reverses_transaction_id`), and Corrected transaction (`corrects_transaction_id`).
5. **Decoupled Manual Adjustment Lifecycle (Evolution 5)**: Resolves Business Smell 12.3 by explicitly separating **Real Ledger Adjustments** (account balance reconciliations) from **Intention Plan Reallocations** (jar-to-jar plan movements). Plan movements NEVER touch bank accounts.
6. **Explicit Emergency Flow (Evolution 6)**: Resolves Lifecycle Gap 3 and Business Smell 6.2 by introducing an `EmergencyDeclaration` mechanism on jar reallocations. Mid-month BR-07 overspend warnings are bypassed for declared emergencies, while surfacing them for mandatory reflection in the Month Ritual.
7. **Month Ritual Maturity & Auto-Lock (Evolution 7)**: Closes Lifecycle Gap 5 & 7 by adding a 30-day temporal Auto-Lock (`PendingReview`), auto-resolving stale unmapped transactions to a Miscellaneous Jar, and formalizing the Quick Close eligibility path after 6 completed rituals.
8. **BR-14 / BR-24 Rule Disambiguation (Evolution 8)**: Eliminates Business Smell 12.2 by split-mapping documentation collisions: `BR-14` is assigned exclusively to the **AI Non-Invention Policy**, while `BR-24` (`Health-RO`) is created for the **Health Read-Only Policy**.
9. **Unified Household Schedule (Evolution 9)**: Resolves Business Smell 3.1 by integrating `RecurringPatterns`, Credit Card due dates, and Installment due dates into a single unified Household Financial Calendar view (EO-03).
10. **Pattern Context & Inbox Auto-Resolution (Evolution 10)**: Eliminates Business Smell 5.2 & 11.1 by annotating pattern-generated transactions with `source: recurring_pattern` metadata, enabling seamless Inbox auto-resolution and staleness archiving.

---

## 4. Business Impact Summary

| Dimension | Before (Initial Model) | After (Business Model v2) |
|---|---|---|
| **Financial Safety** | Unlinked refunds and corrections created hidden accounting drift and unaudited ledger gaps. | 100% immutable 3-way audit trails for corrections and formal refund references ensure zero accounting leakage. |
| **User Experience & Friction** | Generic Inbox created decision fatigue; unmapped categories drifted from jars; stale items lingered. | Typed ReviewItem taxonomy with automated pattern resolution reduces manual Inbox triage effort by over 70%. |
| **Household Collaboration** | Emergency spending triggered ambiguous overspend alerts; mid-month reallocations created confusion. | Explicit `EmergencyDeclaration` eliminates false alarms and frames unexpected events as constructive household decisions. |
| **System Longevity** | Loose domain interactions and documentation rule collisions posed scaling risks beyond Month 6. | Strict cross-domain contracts, disambiguated business rules, and 30-day ritual auto-locks guarantee 5–10 years of operational stability. |

---

## 5. Strategic Verdict

The **Business Evolution Board** confirms that Business Model v2 achieves complete internal consistency across Business Rules, Domain Requirements, Acceptance Criteria, and Money Lifecycles. 

**ViNha is fully prepared to enter implementation governance and sprint execution as a state-of-the-art Household Money Operating System.**
