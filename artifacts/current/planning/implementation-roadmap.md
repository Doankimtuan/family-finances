# Implementation Master Roadmap — ViNha

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. High-Level Multi-Sprint Timeline

```
+-----------------------------------------------------------------------------------+
|                        VINHA MULTI-SPRINT ROADMAP (12 WEEKS)                       |
+-----------------------------------------------------------------------------------+
|  Sprint 1 (W1-W2)  : EPIC 1 — Core Domain Contracts & Schema Realization          |
|  Sprint 2 (W3-W4)  : EPIC 2 — Decoupled Plan Movements & Emergency Flow           |
|  Sprint 3 (W5-W6)  : EPIC 3 — Inbox Decision Engine & Auto-Resolution            |
|  Sprint 4 (W7-W8)  : EPIC 4 — Month Ritual Maturity & 30-Day Temporal Auto-Lock    |
|  Sprint 5 (W9-W10) : EPIC 5 — Unified Household Financial Calendar                |
|  Sprint 6 (W11-W12): EPIC 6 — Health Read-Only Shield & GA Hardening               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Release Milestones & Target Capabilities

### Milestone 1: Core Contracts Foundation (`v2.1-Alpha1` — End of Sprint 2)
- **Delivered Capabilities**:
  - $N:1$ Category-Jar contract (BR-12) active; unmapped categories blocked.
  - Refund linkages (`reverses_transaction_id`) and 3-way correction audit chains (BR-02, BR-03) active.
  - Decoupled Jar plan movements ($0.00$ ledger impact) with emergency flags (BR-01, EVO-06).

---

### Milestone 2: Intelligent Decision & Ritual Engine (`v2.1-Beta1` — End of Sprint 4)
- **Delivered Capabilities**:
  - Typed Inbox decision queue with auto-resolution rules and staleness archiving (BR-05, BR-15).
  - 30-Day Month Ritual temporal auto-lock worker (`PendingReview`) active (BR-08).
  - Step 1 Category-Jar divergence check and Step 3 emergency reflection surface active.
  - 1-tap Quick Close mode enabled after 6 consecutive completed rituals (BR-23).

---

### Milestone 3: General Availability (`v2.1-GA` — End of Sprint 6)
- **Delivered Capabilities**:
  - Multi-domain Household Financial Calendar projecting recurring patterns, card due dates, and debt payoff schedules (EO-03).
  - Enforced read-only connection shield for Health domain (`Health-RO`, BR-24).
  - AI Non-Invention Policy guards active (BR-14).
  - 100% test coverage pass (Unit, Integration, E2E, Regression, Security, A11y).
