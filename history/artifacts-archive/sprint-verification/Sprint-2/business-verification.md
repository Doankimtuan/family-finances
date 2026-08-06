# Business Verification — Sprint 2

## Scope

| Story | Business intent |
|-------|-----------------|
| ST-E02-001 | Virtual jar reallocations with $0.00 ledger impact (BR-01, BR-06) |
| ST-E02-002 | EmergencyDeclaration bypasses mid-month warning (BR-07) |
| ST-E02-003 | Partner visibility / notification of emergencies (BR-13) |

---

## BR-01 — Real Ledger ≠ Virtual Jars

| Check | Result | Evidence |
|-------|--------|----------|
| Plan movement does not insert ledger transactions | **PASS** | RPC has no `INSERT INTO transactions`; count before/after guard |
| `ledger_impact` constrained to 0 | **PASS** | `plan_movements_zero_ledger_impact` check |
| Bank / account balances untouched | **PASS (design)** | RPC updates only `jars.capacity_delta` + `plan_movements` (+ optional inbox) |
| UI framing as virtual capacity | **PASS** | Virtual banner on reallocate form |
| Automated proof of bank untouched | **FAIL (DoD)** | No balance before/after test |

**Verdict: PASS for financial design; incomplete for verification evidence.**

### “Jar balances” meaning

AC-JAR-01 says jar balances ±100. Implementation updates `jars.capacity_delta`, not `jar_plans` and not bank money. That matches Spec/Constitution financial meaning (virtual intention). Acceptable interpretation.

---

## BR-06 — Jar capacity / overspend context

| Check | Result | Evidence |
|-------|--------|----------|
| Story catalog lists BR-06 for ST-E02-001 | Required | `story-catalog.md` |
| Capacity floor / non-negativity on reallocate | **FAIL** | RPC: `capacity_delta = capacity_delta - p_amount` with no check |
| `OverspendPolicy.BLOCK` stops reallocate | **FAIL** | `shouldShowOverspendWarning` ignores `BLOCK` |

**Verdict: FAIL / unenforced** on the reallocate path. Households with `block` policy can still move capacity freely.

---

## BR-07 — Mid-month warning & emergency bypass

| Check | Result | Evidence |
|-------|--------|----------|
| Emergency bypasses warn | **PASS** | `shouldShowOverspendWarning` returns false when `isEmergency` |
| Non-emergency WARN requires ack | **PASS (server)** | Command returns `WARNING_REQUIRED` unless `warningAcknowledged` |
| Warning is a **modal** (AC language) | **PARTIAL** | Inline `StatusAlert` + two-click step, not modal |
| Intent note required for emergency | **PASS** | DB check + Zod + UI |

**Verdict: PARTIAL** — bypass semantics correct; UX presentation drifts from AC “modal.”

---

## BR-13 — Partner visibility

| Check | Result | Evidence |
|-------|--------|----------|
| Emergency visible to household partners | **PASS** | `inbox_items` kind `emergency_declaration`; Plan banner |
| Instant partner **device** notification (AC-JAR-02) | **FAIL** | No push / device channel (TD-S2-02) |
| Event named `EmergencyDeclaredEvent` | **PARTIAL** | Stored in `context_json`, not a domain event bus |

**Verdict: PARTIAL.** BR-13 “visible to partners” is satisfied in-app; AC device wording is not.

---

## Financial meaning risks

1. **Unbounded negative `capacity_delta`** — virtual intention can go arbitrarily negative without BLOCK enforcement.
2. **Ledger count race** — zero-ledger guard compares `count(*)` before/after; concurrent inserts can false-fail; same-count insert+delete could theoretically slip (low probability).
3. **Warn ack soft path** — client can set `warningAcknowledged` via `awaitingWarn` without explicit checkbox.

---

## Business score input

**7.0 / 10** — BR-01 core is strong; BR-06 gap and BR-13 device gap are material.
