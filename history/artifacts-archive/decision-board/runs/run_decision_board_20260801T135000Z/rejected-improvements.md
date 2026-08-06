# Rejected Improvements

**Decision Board run:** `run_decision_board_20260801T135000Z`  
**Created:** 2026-08-01T13:47:04Z

Improvements below are **not** part of Specification v2.

## IMP-014 — Future: offline read-only cache for dashboard summaries

**Verdict:** REJECT  
**Score:** 0

**Why:** Offline cache near ledger/dashboard creates stale-data and architectural risk for little business value in an online household app; fails cost/risk test.

**Reject reasons:**
- architectural risk near ledger domain
- unnecessary complexity
- little business value
- implementation cost not justified

| Biz | User | DX | Maint | Impl | Migr | Risk | LT | 2026 | Score |
|----:|-----:|---:|------:|-----:|-----:|-----:|---:|-----:|------:|
| 25 | 40 | 35 | 70 | 80 | 85 | 90 | 30 | 40 | 0 |

