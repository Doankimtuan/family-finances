# Specification Change Log (v2.0 → v2.1) — ViNha

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** v2.1 (Developer Constitution v1.1)  

---

## 1. Specification Modifications Summary

This change log documents all updates applied during the Specification Synchronization phase to transition from Specification v2.0 to **Specification v2.1**.

---

## 2. Detailed Log of Modifications

| Section / Entity | Modification Type | Description of Change | Rationale / Origin |
|---|---|---|---|
| **Business Rules** | **DISAMBIGUATED** | Separated BR-14 (AI Non-Invention) and created **BR-24** (`Health-RO`, Health Read-Only Policy). | Resolves Business Smell 12.2 (ID collision). |
| **Business Rules** | **ADDED** | Added **BR-12** (Category ↔ Jar N:1 Mapping Contract), **BR-15** (Inbox Staleness), **BR-21** (Cascade Cancellation), **BR-23** (Quick Close Eligibility). | Incorporates Business Evolution Board decisions. |
| **Product Definition** | **UPDATED** | Updated bounded contexts, core identity statements, and 5 operational pillars. | Aligns product vision with Business Model v2. |
| **Architecture** | **UPDATED** | Formalized zero-write Health read-only boundaries (**BR-24**) and cross-domain event graphs. | Establishes strict DDD event boundaries. |
| **Technical Spec** | **UPDATED** | Added `reverses_transaction_id`, `corrects_transaction_id`, `ReviewItemType` taxonomy, `is_emergency` flag, and temporal workers. | Technical realization of evolved business model. |
| **Developer Constitution** | **UPDATED (v1.1)** | Updated canonical SoT references to `artifacts/current/specification/` and PR checklists. | Enforces strict engineering governance. |
| **Requirements & AC** | **SYNCHRONIZED** | Generated 16 synchronized requirements and Given-When-Then Acceptance Criteria. | Ensures 100% testable specification coverage. |
