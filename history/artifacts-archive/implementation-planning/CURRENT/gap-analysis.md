# Current Codebase Gap Analysis — ViNha

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Codebase Inspection Summary

An empirical audit of the repository (`modules/`, `infrastructure/`, `packages/`, `artifacts/sprint-execution/`) was conducted against canonical **Specification v2.1**.

| Component / Feature | Current Codebase Status | Specification v2.1 Gap | Severity | Target Epic |
|---|---|---|---|---|
| **Category ↔ Jar Contract** | `modules/categories/` has basic category entity without mandatory `jar_id` FK. | Lacks $N:1$ Category-Jar binding constraint (BR-12). Category creation does not enforce Jar assignment. | **HIGH** | EPIC 1 |
| **Refund Linkage** | `modules/ledger/` processes credits as raw transactions. | Lacks `reverses_transaction_id` field, `PartiallyRefunded`/`FullyRefunded` status transitions, and Jar capacity restoration (BR-02). | **HIGH** | EPIC 1 |
| **3-Way Correction Chain** | `modules/ledger/` supports basic edit without audit chain. | Lacks `corrects_transaction_id` field and atomic 3-way reversal chain service (`Reversed` original, reversal, correction) (BR-03). | **HIGH** | EPIC 1 |
| **Typed ReviewItems** | `modules/inbox/` uses single generic `ReviewItem` interface. | Lacks strongly-typed discriminator schemas (`UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, `InstallmentComplete`, `EmergencyDeclaration`) (EVO-02). | **HIGH** | EPIC 1 |
| **Plan Movements** | `modules/plan/` UI/API presents reallocations like transfers. | Does not strictly enforce `$0.00` ledger balance impact or display clear virtual capacity framing banners (BR-01). | **MEDIUM** | EPIC 2 |
| **Emergency Flow** | `modules/plan/` `PlanMovement` entity has no emergency fields. | Lacks `is_emergency` boolean flag, `intent_note` text, and BR-07 overspend warning modal bypass logic (EVO-06). | **MEDIUM** | EPIC 2 |
| **Inbox Staleness Worker** | `modules/inbox/` items linger indefinitely. | Missing background temporal worker for 7-day payment reminder expiration and 30-day unmapped expense auto-resolution (BR-15). | **MEDIUM** | EPIC 3 |
| **30-Day Ritual Auto-Lock** | `modules/month-ritual/` has manual lock button only. | Missing background temporal worker for 30-day auto-lock (`PendingReview`) and stale item triage (BR-08). | **HIGH** | EPIC 4 |
| **Month Ritual Steps** | `modules/month-ritual/` step flow is linear without gates. | Lacks Step 1 Category-Jar Divergence Check gate (EVO-01) and Step 3 Emergency Spending Reflection surface (EVO-06). | **MEDIUM** | EPIC 4 |
| **Quick Close Mode** | `modules/month-ritual/` offers assisted mode only. | Missing 1-tap Quick Close mode and 6-consecutive-ritual eligibility checker (BR-23). | **LOW** | EPIC 4 |
| **Unified Calendar** | `modules/calendar/` projects `RecurringPattern` events only. | Lacks multi-domain aggregation for Credit Card due dates (BR-17) and Installment payment schedules (BR-20) (EO-03). | **MEDIUM** | EPIC 5 |
| **Health Read-Only Shield** | `modules/health/` uses standard database pool. | Lacks enforced read-only database connection context context (`Health-RO`, BR-24). | **HIGH** | EPIC 6 |
