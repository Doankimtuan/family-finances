# Requirement Verification — Sprint 1

Trace: Business Rules → Requirements → Implementation (code/SQL).

## ST-E01-001

| REQ | Statement | Implementation | Result |
|-----|-----------|----------------|--------|
| **REQ-CAT-01** | Enforce N:1 Category→Jar | `categories.jar_id` FK + household check; `create_category` requires `p_jar_id` | **PASS** |
| **REQ-CAT-02** | Creation requires Jar assignment **or** inline Jar creation | Required jar select + schema reject without jar; **no** inline jar create | **PASS** (OR satisfied by assignment path) |

### Extra / missing behavior

| Item | Assessment |
|------|------------|
| Categories owned under `modules/ledger` not `modules/categories` | Constitution tree mapping — **acceptable**, document as architecture mapping |
| System categories remain unmapped | By design debt — not REQ failure |
| `createJar` seeds matching category via direct insert | Extra (BR-12 Rule 2 support) — **acceptable** |

---

## ST-E01-002

| REQ | Statement | Implementation | Result |
|-----|-----------|----------------|--------|
| **REQ-TRN-01** | Store `reverses_transaction_id`; status Partially/FullyRefunded | Column + `refund_transaction` RPC + status update | **PASS** |
| **REQ-JAR-01** | Restore jar capacity **without modifying monthly income plan** | Capacity via income credit on original `jar_id`; `jar_plans` untouched | **PARTIAL** |

### REQ-JAR-01 nuance

Literal Spec REQ text focuses on **not modifying the monthly income plan** (`jar_plans` / allocation plan). That part **PASSes**.

Story catalog business value and Business Evolution refund lifecycle additionally require **not inflating monthly income**. That part **FAILs** (no `is_reversal` / exclusion). Board treats income-exclusion as **required for financial correctness** of ST-E01-002, even though synchronized AC-TRN-01 GWT does not spell `is_reversal`.

---

## ST-E01-003

| REQ | Statement | Implementation | Result |
|-----|-----------|----------------|--------|
| **REQ-TRN-02** | Original Reversed; link reversal & correction | Atomic `correct_transaction` | **PASS** (correct path) |

Immutability of the original after posting is undermined by parallel `update_transaction` — requirement intent of “immutable audit link” is **PARTIAL** until mutate-in-place is removed/revoked.

---

## Out-of-sprint REQs (not failures)

| REQ | Note |
|-----|------|
| REQ-INB-01 | Sprint goal text mentions typed ReviewItems; owned by ST-E03-001 — correctly deferred |
| REQ-JAR-03 / BR-01 plan movement | Sprint 2 |
| REQ-HLT-01 / BR-24 | Sprint 6 primary; no regression |

---

## Summary

| Story | REQs | Verdict |
|-------|------|---------|
| ST-E01-001 | CAT-01, CAT-02 | **COMPLETE** |
| ST-E01-002 | TRN-01, JAR-01 | **PARTIAL** (income-exclusion / capacity derivation contract) |
| ST-E01-003 | TRN-02 | **PARTIAL** (chain OK; immutability bypass remains) |
