# Dependency Graph & Critical Path Analysis — ViNha

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Epic & Story Dependency Graph

```mermaid
graph TD
    subgraph Sprint 1: EPIC 1 - Core Domain Contracts
        ST1_1[ST-E01-001: Category-Jar Contract]
        ST1_2[ST-E01-002: Refund Linkage]
        ST1_3[ST-E01-003: 3-Way Correction Chain]
    end

    subgraph Sprint 2: EPIC 2 - Decoupled Plan Movements
        ST2_1[ST-E02-001: $0.00 Plan Movements]
        ST2_2[ST-E02-002: Emergency Flag & Bypass]
        ST2_3[ST-E02-003: Partner Emergency Alert]
    end

    subgraph Sprint 3: EPIC 3 - Inbox Decision Engine
        ST3_1[ST-E03-001: Typed ReviewItem Schema]
        ST3_2[ST-E03-002: Pattern Auto-Resolution]
        ST3_3[ST-E03-003: Inbox Staleness Worker]
    end

    subgraph Sprint 4: EPIC 4 - Month Ritual Maturity
        ST4_1[ST-E04-001: 30-Day Auto-Lock Worker]
        ST4_2[ST-E04-002: Step 1 Divergence Gate]
        ST4_3[ST-E04-003: Quick Close Mode]
    end

    subgraph Sprint 5: EPIC 5 - Unified Financial Calendar
        ST5_1[ST-E05-001: Calendar Schedule Service]
        ST5_2[ST-E05-002: Calendar View UI & Alerts]
        ST5_3[ST-E05-003: Debt Payoff Milestones]
    end

    subgraph Sprint 6: EPIC 6 - Health Shield & GA Hardening
        ST6_1[ST-E06-001: Health Read-Only Shield]
        ST6_2[ST-E06-002: AI Policy Guards]
        ST6_3[ST-E06-003: GA System Hardening]
    end

    %% Key Inter-Sprint Dependencies
    ST1_1 --> ST2_1
    ST1_1 --> ST4_2
    ST1_2 --> ST3_1
    ST2_1 --> ST2_2
    ST2_2 --> ST2_3
    ST2_2 --> ST4_3
    ST3_1 --> ST3_2
    ST3_1 --> ST3_3
    ST4_1 --> ST4_2
    ST4_2 --> ST4_3
    ST3_3 --> ST5_1
    ST5_1 --> ST5_2
    ST5_2 --> ST5_3
    ST4_3 --> ST6_1
    ST6_1 --> ST6_2
    ST6_2 --> ST6_3
```

---

## 2. Technical Bottleneck Analysis

1. **Category-Jar Contract (`ST-E01-001`)**: **Primary Critical Path Bottleneck**. All transaction posting, Month Ritual Step 1 divergence checks, and plan reallocations depend on the $N:1$ Category-Jar database constraint. Must complete in Sprint 1.
2. **Typed ReviewItem Schemas (`ST-E03-001`)**: **Inbox Bottleneck**. Auto-resolution policies, payment due reminders, and maturity alerts depend on typed schemas. Must complete early in Sprint 3.
3. **Month Lock Worker (`ST-E04-001`)**: **Ritual Bottleneck**. Auto-locking past months and auto-resolving stale items depend on this background worker. Must complete early in Sprint 4.
