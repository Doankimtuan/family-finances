# Master Sprint Plan (Sprints 1 through 6) — ViNha

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Sprint Allocation Summary

```
+-----------------------------------------------------------------------------------+
|                           6-SPRINT EXECUTION PLAN                                 |
+-----------------------------------------------------------------------------------+
| Sprint 1: EPIC 1 — Core Domain Contracts & Schema Realization (21 Story Points)   |
| Sprint 2: EPIC 2 — Decoupled Plan Movements & Emergency Flow (13 Story Points)    |
| Sprint 3: EPIC 3 — Inbox Decision Engine & Auto-Resolution (18 Story Points)      |
| Sprint 4: EPIC 4 — Month Ritual Maturity & Temporal Auto-Lock (18 Story Points)   |
| Sprint 5: EPIC 5 — Unified Household Financial Calendar (16 Story Points)         |
| Sprint 6: EPIC 6 — Health Read-Only Shield & GA Hardening (18 Story Points)       |
+-----------------------------------------------------------------------------------+
| TOTAL STORY POINTS: 104 Points across 12 Weeks                                    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Detailed Sprint Schedule & Sprint Goals

### Sprint 1: Core Domain Contracts & Schema Realization
- **Sprint Goal**: Enforce Category-Jar $N:1$ contract (BR-12), structured refund linkages (BR-02), 3-way correction audit chains (BR-03), and typed ReviewItem schemas.
- **Stories**: `ST-E01-001` (5 pts), `ST-E01-002` (8 pts), `ST-E01-003` (8 pts).
- **Target Deliverable**: `v2.1-Alpha0` Core Domain Engine.

---

### Sprint 2: Decoupled Plan Movements & Emergency Flow
- **Sprint Goal**: Implement $0.00$ ledger impact Jar plan movements (BR-01), emergency declaration metadata (EVO-06), and partner emergency alerts (BR-13).
- **Stories**: `ST-E02-001` (5 pts), `ST-E02-002` (5 pts), `ST-E02-003` (3 pts).
- **Target Deliverable**: `v2.1-Alpha1` Virtual Intention Engine.

---

### Sprint 3: Inbox Decision Engine & Policy Auto-Resolution
- **Sprint Goal**: Deploy typed Inbox decision queue (EVO-02), pattern metadata auto-resolution (BR-16), and staleness auto-archiving worker (BR-15).
- **Stories**: `ST-E03-001` (5 pts), `ST-E03-002` (8 pts), `ST-E03-003` (5 pts).
- **Target Deliverable**: `v2.1-Alpha2` Decision Queue.

---

### Sprint 4: Month Ritual Maturity & Temporal Auto-Lock
- **Sprint Goal**: Deploy 30-day Month Ritual temporal auto-lock worker (`PendingReview`, BR-08), Step 1 divergence gate (EVO-01), Step 3 emergency reflection, and Quick Close mode (BR-23).
- **Stories**: `ST-E04-001` (8 pts), `ST-E04-002` (5 pts), `ST-E04-003` (5 pts).
- **Target Deliverable**: `v2.1-Beta1` Monthly Closure Engine.

---

### Sprint 5: Unified Household Financial Calendar
- **Sprint Goal**: Build multi-domain Calendar schedule projection aggregating recurring patterns, card due dates (BR-17), and debt payoff schedules (BR-20).
- **Stories**: `ST-E05-001` (8 pts), `ST-E05-002` (5 pts), `ST-E05-003` (3 pts).
- **Target Deliverable**: `v2.1-Beta2` Household Calendar.

---

### Sprint 6: Health Read-Only Shield & GA Hardening
- **Sprint Goal**: Enforce Health read-only database connections (`Health-RO`, BR-24), AI non-invention policy guards (BR-14), and complete system-wide test hardening.
- **Stories**: `ST-E06-001` (5 pts), `ST-E06-002` (5 pts), `ST-E06-003` (8 pts).
- **Target Deliverable**: `v2.1-GA` Production Release.
