# Acceptance Criteria Verification — Sprint 2

Source: `artifacts/specification-synchronization/CURRENT/acceptance-criteria.md`  
Story DoD: GWT must be verified via **automated integration or E2E**.

---

## AC-JAR-01 — Plan Movement Zero Account Impact

> GIVEN reallocate $100 Dining → Groceries  
> WHEN committed  
> THEN jar balances ±100, ZERO ledger transactions, bank balances unchanged

| Layer | Result | Evidence |
|-------|--------|----------|
| Capacity ± amount | **PASS (SQL)** | `capacity_delta` ± `p_amount` |
| Zero ledger txns | **PASS (SQL design)** / **UNPROVEN (test)** | Count guard in RPC; unit only tests pure `isZeroLedgerImpact` |
| Bank unchanged | **PASS (SQL design)** / **UNPROVEN (test)** | No account writes; no balance assertion |
| Integration/E2E GWT | **FAIL** | `tests/integration/` empty; no reallocate E2E |

**Story AC completeness: PARTIAL**

---

## AC-JAR-02 — Emergency Warning Bypass (+ BR-13)

> GIVEN reallocate $200 + Declare Emergency  
> WHEN submitted  
> THEN BR-07 warning modal bypassed, `is_emergency = true`, notification to partner’s device

| Layer | Result | Evidence |
|-------|--------|----------|
| Bypass warn when emergency | **PASS (policy)** | `shouldShowOverspendWarning` |
| `is_emergency` recorded | **PASS (SQL+schema)** | Column + insert |
| Warning **modal** | **PARTIAL** | Inline warn step, not modal |
| Partner **device** notification | **FAIL** | Inbox + Plan banner only |
| Integration/E2E GWT | **FAIL** | Constants asserted; no notify path test |

**Story AC completeness: PARTIAL** (ST-E02-002 and ST-E02-003 share this AC)

---

## Constitutional ACs

| AC | Expectation | Result |
|----|-------------|--------|
| AC-HLT-01 (BR-24) | No Health writes | **PASS** — untouched |
| BR-01 DoD check | Plan movements $0.00 ledger | **PASS (design)** / DoD proof gap |

---

## Per-story rollup

| Story | AC | Implementation | DoD test gate | Complete? |
|-------|----|----------------|---------------|-----------|
| ST-E02-001 | AC-JAR-01 | Strong design | Fail | **No** |
| ST-E02-002 | AC-JAR-02 | Mostly present | Fail | **No** |
| ST-E02-003 | AC-JAR-02 | Inbox not device | Fail | **No** |

Under board rules, **no Sprint 2 story is COMPLETE**.
