# Business Verification — Sprint 1

## Scope

| Story | Business intent |
|-------|-----------------|
| ST-E01-001 | Category creation requires Jar mapping (BR-12) |
| ST-E01-002 | Refunds link to originals, update status, restore jar capacity without income inflation (BR-02) |
| ST-E01-003 | Corrections use permanent 3-way audit chain (BR-03) |

Constitutional DoD checks BR-01 / BR-24 apply to every story but are not primary Sprint 1 deliverables.

---

## BR-01 — Real Ledger ≠ Virtual Jars

| Check | Result | Evidence |
|-------|--------|----------|
| Refund/correct do not rewrite `jar_plans` | **PASS** | `refund_transaction` / `correct_transaction` insert ledger rows only |
| Plan reallocation `$0.00` ledger | **N/A (Sprint 2)** | ST-E02-001 |
| Using ledger `income` to restore jar capacity | **SMELL** | Capacity restore is implied by posting income on original `jar_id`; blurs virtual capacity vs cash income reporting |

**Verdict:** No BR-01 plan-movement violation in Sprint 1 scope. Residual smell feeds REQ-JAR-01 / income-exclusion gap.

---

## BR-02 — Transaction Immutability & Refund Linkage

| Check | Result | Evidence |
|-------|--------|----------|
| Hard delete blocked | **PASS** | App `deleteTransaction` fail-closed; RPC raises; DELETE privilege revoked in Sprint 1 migration |
| Refund stores `reverses_transaction_id` | **PASS** | Migration insert + column |
| Status → `partially_refunded` / `fully_refunded` | **PASS** | Status math in RPC + `refund-policy.ts` |
| Jar capacity restored | **PARTIAL** | Same-jar income credit; no separate capacity store; no proof that UI/plan spent math consumes it correctly |
| Posted rows cannot be edited in place | **FAIL** | `update_transaction` still granted; `updateTransaction` + Legacy edit UI live |
| Without inflating income (story value / refund lifecycle S2) | **FAIL** | Refund inserted as `'income'`; no `is_reversal` / exclusion filter |

**Verdict: FAIL for completeness.** Linkage path is good; immutability and income-exclusion contracts are not.

---

## BR-03 — 3-Way Correction Audit Chain

| Check | Result | Evidence |
|-------|--------|----------|
| Original → `reversed` | **PASS** | `correct_transaction` SQL |
| Reversal with `reverses_transaction_id` | **PASS** | Opposite-type full amount |
| Correction with `corrects_transaction_id` | **PASS** | New amount/type |
| All three permanent | **PARTIAL** | Append path yes; bypass via mutate-in-place no |
| Net impact $100→$10 = +90 new legs | **PASS (policy)** | `correctionChainNetImpact` unit |

**Verdict: PARTIAL.** Correct path implements BR-03; coexistence of in-place edit undermines “immutable audit.”

---

## BR-12 — Category ↔ Jar N:1

| Check | Result | Evidence |
|-------|--------|----------|
| Household category requires `jar_id` | **PASS** | Check constraint + `create_category` + Zod + UI |
| N:1 FK ON DELETE RESTRICT | **PASS** | Migration |
| System templates may be null | **ACCEPTABLE (debt)** | Documented TD-S1-02 |
| Capture auto-fills jar from category | **PASS** | `record_transaction` updated |

**Verdict: PASS** for create contract; residual unmapped system-tag selection is known debt.

---

## BR-24 — Health Read-Only

| Check | Result |
|-------|--------|
| Sprint 1 introduced Health writes | **PASS — none** |
| Full Health-RO DB context | Out of scope (Sprint 6) |

---

## Financial meaning risks

1. **Hidden mutate path:** User can still change amount/type/account/category/jar on a posted transaction without producing a correction chain → ledger history lies.
2. **Income-shaped refunds:** Account cash position increase is economically correct; classifying refunds/reversals as ordinary income without exclusion **will inflate any income sum** that filters only on `type='income'`.
3. **Capacity restore mechanism is implicit:** Relies on “income on jar_id offsets expense on jar_id.” No dedicated capacity event/table. Acceptable if all consumers share the same derivation rule — not documented as a single query contract.

---

## Workflow vs product intent

| Intended | Implemented | Gap |
|----------|-------------|-----|
| Create category → must pick jar | Progressive form on Plan jars | OK |
| Refund linked to original | Expense detail → Refund amount | Inverse of “link unlinked refund from Inbox” (Inbox is Sprint 3) — acceptable for Alpha0 if documented |
| Correct via 3-way chain | Correct route + audit section | OK |
| No silent edits | Legacy edit still offered | **Product conflict** |

---

## Business score input

**6.0 / 10** — Core new financial paths exist; immutability hole and income-exclusion gap are material.
