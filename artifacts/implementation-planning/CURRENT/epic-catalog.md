# Epic Catalog — ViNha Implementation Master Plan

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Epic Architecture Overview

The implementation roadmap is structured into **6 Vertical Slice Epics**. Each Epic encapsulates complete business capabilities across database schemas, backend services, API contracts, and user interface components.

---

## 2. Detailed Epic Catalog

### EPIC 1: Core Domain Contracts & Schema Realization
- **Epic ID**: `EPIC-01`
- **Target Sprint**: Sprint 1
- **Business Value**: Establishes strict financial accounting integrity, 3-way correction audit trails, refund capacity restoration, and strongly-typed decision schemas.
- **Governing Business Rules**: BR-02, BR-03, BR-05, BR-12.
- **Mapped Requirements**: REQ-CAT-01, REQ-CAT-02, REQ-INB-01, REQ-TRN-01, REQ-TRN-02.
- **Stories Included**: `ST-E01-001`, `ST-E01-002`, `ST-E01-003`.

---

### EPIC 2: Decoupled Plan Movements & Emergency Flow
- **Epic ID**: `EPIC-02`
- **Target Sprint**: Sprint 2
- **Business Value**: Enforces BR-01 Intention Purity ($0.00 ledger impact), provides explicit emergency intent logging, and eliminates mid-month warning friction for real emergencies.
- **Governing Business Rules**: BR-01, BR-06, BR-07, BR-13.
- **Mapped Requirements**: REQ-JAR-01, REQ-JAR-02, REQ-JAR-03.
- **Stories Included**: `ST-E02-001`, `ST-E02-002`, `ST-E02-003`.

---

### EPIC 3: Inbox Decision Engine & Policy Auto-Resolution
- **Epic ID**: `EPIC-03`
- **Target Sprint**: Sprint 3
- **Business Value**: Transforms Inbox into an efficient, typed decision queue, reduces triage fatigue via pattern metadata auto-resolution, and auto-archives stale alerts.
- **Governing Business Rules**: BR-05, BR-10, BR-15, BR-16, BR-21.
- **Mapped Requirements**: REQ-INB-02, REQ-INB-03, REQ-TRN-03.
- **Stories Included**: `ST-E03-001`, `ST-E03-002`, `ST-E03-003`.

---

### EPIC 4: Month Ritual Maturity & Temporal Auto-Lock
- **Epic ID**: `EPIC-04`
- **Target Sprint**: Sprint 4
- **Business Value**: Guarantees monthly financial plan closure via 30-day temporal auto-lock, enforces Category-Jar divergence checks, and surfaces emergency spending for partner reflection.
- **Governing Business Rules**: BR-08, BR-09, BR-23.
- **Mapped Requirements**: REQ-RIT-01, REQ-RIT-02, REQ-RIT-03.
- **Stories Included**: `ST-E04-001`, `ST-E04-002`, `ST-E04-003`.

---

### EPIC 5: Unified Household Financial Calendar
- **Epic ID**: `EPIC-05`
- **Target Sprint**: Sprint 5
- **Business Value**: Provides a single unified timeline projecting upcoming recurring bills, credit card payment due dates, and debt payoff milestones to prevent cash deficits.
- **Governing Business Rules**: BR-17, BR-20.
- **Mapped Requirements**: REQ-CAL-01.
- **Stories Included**: `ST-E05-001`, `ST-E05-002`, `ST-E05-003`.

---

### EPIC 6: Health Read-Only Shield & Governance Validation
- **Epic ID**: `EPIC-06`
- **Target Sprint**: Sprint 6
- **Business Value**: Enforces mathematical read-only safety for Health domain analytics, activates AI non-invention guards, and completes end-to-end release hardening.
- **Governing Business Rules**: BR-14, BR-24 (`Health-RO`).
- **Mapped Requirements**: REQ-HLT-01.
- **Stories Included**: `ST-E06-001`, `ST-E06-002`, `ST-E06-003`.
