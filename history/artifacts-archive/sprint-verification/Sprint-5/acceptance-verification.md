# Acceptance Verification — Sprint 5

## Spec Sync gap

**`AC-CAL-01` is cited by planning, traceability, and the Sprint-5 pack, but has no Given–When–Then body in** `artifacts/specification-synchronization/CURRENT/acceptance-criteria.md`.

Board surrogate for multi-source aggregation:

### AC-09.1 (Business Evolution ancestor — “evolved AC-09.1” per pack)

**GIVEN** recurring rent, card due 15th, installment 20th  
**WHEN** Calendar renders  
**THEN** all three appear on correct dates with source tags

| Clause | Board |
|--------|-------|
| Three sources projectable | **PASS** (unit, separate cases) |
| Correct dates together | **PARTIAL** — installment forced to day 1 in live query; card dates OK when `nextDueDate` present |
| Source tags | **PASS** |
| Calendar **view** renders all three | **UNPROVEN** — no e2e / integration of `getHouseholdCalendar` |

**AC-09.1 / claimed AC-CAL-01: PARTIAL**

---

## ST-E05-002 (no Spec Sync AC ID)

| Intent | Board |
|--------|-------|
| Interactive month grid | **PASS** UI |
| Low-balance / deficit warning | **PARTIAL** — fires from algorithm; financial inputs unsafe |
| Unit “warning fires on deficit date” | **PASS** pure forecast test |

---

## ST-E05-003 / BR-11

| Intent | Board |
|--------|-------|
| Milestone badge / celebration | **PASS** UI when day selected |
| `InstallmentComplete` ReviewItem | **FAIL** |
| Cash-flow reallocation prompt (typed) | **FAIL** — generic jar link |

Catalog maps ST-E05-003 → AC-CAL-01 — **wrong AC** for BR-11 behavior.

---

## PDB EO-03 ACs (AC-CAL-001…006) — not Spec Sync IDs

Not used as primary gate. Spot check: income/expense color coding (AC-CAL-005) **not** implemented; month summary (AC-CAL-002) **not** shipped; today highlight soft via selection default.

---

## Story AC scorecard

| Story | Claimed AC | Board |
|-------|------------|-------|
| ST-E05-001 | AC-CAL-01 (implied) | **PARTIAL** (missing Spec body; projection mostly OK) |
| ST-E05-002 | AC-CAL-01 | **PARTIAL** |
| ST-E05-003 | AC-CAL-01 / BR-11 | **FAIL** on BR-11 |

**Zero of three stories fully COMPLETE** under board rules.
