# Requirement Verification — Sprint 2

## ST-E02-001

| REQ | Statement | Implementation | Result |
|-----|-----------|----------------|--------|
| **REQ-JAR-03** | Zero touch on account balances during Jar plan movements | RPC does not mutate accounts/transactions; capacity_delta only | **PASS** |

### Extra / missing

| Item | Assessment |
|------|------------|
| Spec REST `POST /api/v2/jars/reallocate` | Command + server action — acceptable rewrite drift |
| Spec module `modules/budgets/` | Mapped to `modules/plan` — Constitution-compliant |
| BR-06 capacity guard | Missing — see business verification |

---

## ST-E02-002

| REQ | Statement | Implementation | Result |
|-----|-----------|----------------|--------|
| **REQ-JAR-02** | Stores `is_emergency = true` on mid-month reallocations | Column + RPC insert + Zod | **PASS** |

Intent note is required alongside the flag (EVO-06) — present and stronger than bare REQ text.

---

## ST-E02-003

| REQ | Statement | Implementation | Result |
|-----|-----------|----------------|--------|
| **REQ-JAR-02** (shared AC-JAR-02) | Emergency path includes partner notification | Inbox insert on emergency | **PARTIAL** |

ST-E02-003 is framed as BR-13 visibility. Shared household Inbox meets “visible to partners.” Literal AC device notification remains unmet.

---

## Summary

| Story | REQs | Verdict |
|-------|------|---------|
| ST-E02-001 | JAR-03 | **PASS** (BR-06 residual) |
| ST-E02-002 | JAR-02 | **PASS** |
| ST-E02-003 | JAR-02 / BR-13 | **PARTIAL** |
