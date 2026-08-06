# Critical Path Analysis — ViNha Implementation Master Plan

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Critical Path Overview

The **Critical Path** represents the sequence of dependent technical tasks that directly determines the minimum total duration to achieve General Availability (`v2.1-GA`). 

Any delay in critical path tasks directly delays the release date. Non-critical tasks possess float and can be executed in parallel.

---

## 2. Master Critical Path Sequence (12-Week Timeline)

```
[ST-E01-001: Category-Jar Contract] (W1-W2)
         ↓
[ST-E01-002: Refund Linkage] (W2)
         ↓
[ST-E02-001: Decoupled Plan Movements] (W3-W4)
         ↓
[ST-E02-002: Emergency Declaration Flag] (W4)
         ↓
[ST-E03-001: Typed ReviewItem Schemas] (W5)
         ↓
[ST-E03-002: Pattern Auto-Resolution Engine] (W6)
         ↓
[ST-E04-001: 30-Day Month Lock Worker] (W7-W8)
         ↓
[ST-E04-002: Step 1 Divergence Gate] (W8)
         ↓
[ST-E05-001: Multi-Domain Calendar Aggregation] (W9-W10)
         ↓
[ST-E06-001: Health Read-Only Connection Shield] (W11)
         ↓
[ST-E06-003: Multi-Tier System Release Hardening] (W12)
```

---

## 3. Float & Parallelization Schedule

- **Parallel Stream A (Card & Installment Due Reminders)**: `ST-E05-002` and `ST-E05-003` can execute in parallel during Sprint 5 without delaying the main Calendar projection engine.
- **Parallel Stream B (AI Policy Guard Middleware)**: `ST-E06-002` can execute in parallel during Sprint 6 alongside `ST-E06-001` (Health Read-Only Shield).
- **Parallel Stream C (Partner Emergency Notification)**: `ST-E02-003` can execute in parallel during Sprint 2 once `ST-E02-002` backend events are published.
