# Traceability Matrix — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Traceability Principles & Rule

Every evolution in Business Model v2 strictly obeys the **Mandatory 6-Stage Traceability Chain**:

$$\text{Origin} \longrightarrow \text{Domain Philosophy} \longrightarrow \text{Reality Validation} \longrightarrow \text{Product Decision} \longrightarrow \text{Business Cohesion} \longrightarrow \text{Current Implementation}$$

If an evolution cannot establish an unbroken path across all 6 stages, it is classified as an orphan and is **strictly prohibited**.

---

## 2. Complete 6-Stage Traceability Matrix

| Evolution ID & Title | Stage 1: Validated Origin | Stage 2: Domain Philosophy | Stage 3: Reality Validation | Stage 4: Product Decision Board | Stage 5: Business Cohesion Board | Stage 6: Current Implementation Seam |
|---|---|---|---|---|---|---|
| **EVO-01**: Category ↔ Jar Formal Contract | Business Smell 5.1, 10.1, 15.1 | `domain-philosophy/domains/budgets.md` (Jars track intention; Categories classify transactions) | `domain-reality-validation/domains/budgets-validation.md` (DNI-02: Category-Jar mapping drift) | `product-decision-board/approved.md` (EO-05: Jars are intention buckets) | `business-cohesion/business-smells.md` (Smell 5.1: Categories ↔ Jars no formal contract) | `modules/budgets/` & `modules/categories/` (Independent data structures, no mapping constraint) |
| **EVO-02**: Typed ReviewItem Taxonomy | Business Smell 2.2, 13.1, 16.2; Gap 7 | `domain-philosophy/domains/inbox.md` (Inbox is a decision queue, not notification center) | `domain-reality-validation/domains/inbox-validation.md` (DNI-03: Inbox triage friction) | `product-decision-board/approved.md` (EO-16: Inbox auto-resolution) | `business-cohesion/business-smells.md` (Smell 2.2: Auto-resolution without ReviewItem types) | `modules/inbox/` (Single generic `ReviewItem` interface without type enum) |
| **EVO-03**: Structured Refund Lifecycle | Lifecycle Gap 1; Business Smell 6.1 | `domain-philosophy/domains/transactions.md` (Ledger records true history; zero data deletion) | `domain-reality-validation/financial-validation.md` (Refunds distort monthly income) | `product-decision-board/approved.md` (EO-20: Transaction integrity) | `business-cohesion/lifecycle-gaps.md` (Gap 1: Refund lifecycle no reversal link) | `modules/ledger/` (Refund recorded as raw credit transaction without `reverses_transaction_id`) |
| **EVO-04**: Immutable Correction Lifecycle | Lifecycle Gap 2; Business Smell 6.1 | `domain-philosophy/domains/transactions.md` (Never delete; corrections append reversal) | `domain-reality-validation/financial-validation.md` (Unlinked corrections break audit trail) | `product-decision-board/approved.md` (BR-01 compliance notes on correction) | `business-cohesion/lifecycle-gaps.md` (Gap 2: Correction lifecycle no audit link specification) | `modules/ledger/` (Reversal and new transaction created without explicit 3-way link contract) |
| **EVO-05**: Decoupled Manual Adjustment Lifecycle | Business Smell 12.3; Reality Validation DNI-01 | `domain-philosophy/domains/accounts.md` vs `budgets.md` (Real money vs Virtual intention) | `domain-reality-validation/domains/accounts-validation.md` (DNI-01: Real vs Virtual confusion) | `product-decision-board/approved-with-modifications.md` (EO-19: Reallocation creates plan movement) | `business-cohesion/business-smells.md` (Smell 12.3: EO-19 reallocation vs intention purity) | `modules/budgets/` & `modules/accounts/` (Reallocation UI presents amounts like balance transfers) |
| **EVO-06**: Explicit Emergency Flow | Lifecycle Gap 3; Business Smell 6.2 | `domain-philosophy/domains/month-ritual.md` (Ritual reflects household life events) | `domain-reality-validation/behavioral-validation.md` (Emergency overspends cause alert fatigue) | `product-decision-board/approved.md` (EO-19: Mid-month jar reallocation) | `business-cohesion/lifecycle-gaps.md` (Gap 3: Emergency lifecycle no emergency declared state) | `modules/budgets/` (Jar reallocation lacks `is_emergency` intent flag) |
| **EVO-07**: Month Ritual Maturity & Auto-Lock | Lifecycle Gap 5, 7; Business Smell 2.1 | `domain-philosophy/domains/month-ritual.md` (Monthly cycle must close to lock history) | `domain-reality-validation/longevity-validation.md` (Unclosed months distort health trends) | `product-decision-board/approved.md` (EO-10: Month Ritual quick close & lock) | `business-cohesion/lifecycle-gaps.md` (Gap 5: Month ritual no approval timeout/auto-lock) | `modules/month-ritual/` (No background worker for 30-day temporal auto-lock) |
| **EVO-08**: BR-14 / BR-24 Disambiguation | Business Smell 12.2 | `domain-philosophy/domains/health.md` (Health is strictly read-only) | `domain-reality-validation/recommendations.md` (REC-04: Strict BR enforcement) | `product-decision-board/business-rule-changes.md` (BR-14 dual usage in catalog vs philosophy) | `business-cohesion/business-smells.md` (Smell 12.2: BR-14 Identity collision SoT defect) | `artifacts/product-definition/` & `artifacts/domain-philosophy/` (ID collision on BR-14) |
| **EVO-09**: Unified Household Schedule | Business Smell 3.1 | `domain-philosophy/domains/planning.md` (Planning predicts household cash flow) | `domain-reality-validation/recommendations.md` (REC-05: Recurring bill calendar) | `product-decision-board/approved.md` (EO-03: Calendar view) | `business-cohesion/business-smells.md` (Smell 3.1: Schedule concept duplication across 3 domains) | `modules/calendar/` (Calendar views only read `RecurringPattern`, ignoring card/debt due dates) |
| **EVO-10**: Pattern Context & Inbox Auto-Resolution | Business Smell 5.2, 11.1, 12.1; Gap 7 | `domain-philosophy/domains/inbox.md` (Eliminate repetitive manual mapping) | `domain-reality-validation/recommendations.md` (REC-11: Inbox auto-resolution rules) | `product-decision-board/approved.md` (EO-16: Pattern-based auto-resolution) | `business-cohesion/business-smells.md` (Smell 5.2: Inbox ↔ Planning no direct metadata channel) | `modules/planning/` (Pattern-generated transactions do not append `source: recurring_pattern` metadata) |

---

## 3. Verification of Traceability Completeness

- **Total Validated Evolutions**: 10
- **Total Unlinked/Orphan Evolutions**: 0
- **Traceability Verification Verdict**: **100% PASS**. Every evolution possesses an unbroken 6-stage lineage from original review board finding down to current module seams.
