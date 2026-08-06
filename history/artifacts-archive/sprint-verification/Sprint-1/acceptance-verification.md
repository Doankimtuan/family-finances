# Acceptance Criteria Verification — Sprint 1

Source of truth: `artifacts/specification-synchronization/CURRENT/acceptance-criteria.md`  
Story DoD: AC GWT must be verified via **automated integration or E2E**.

Legend: **PASS** | **PARTIAL** | **FAIL** | **UNPROVEN** (code likely OK, no qualifying test)

---

## AC-CAT-01 — Category ↔ Jar N:1 Binding

> GIVEN creating category "Pet Grooming"  
> WHEN save without selecting a Jar  
> THEN system blocks submission and displays a required Jar selection dropdown

| Layer | Result | Evidence |
|-------|--------|----------|
| UI required dropdown | **PASS** | `create-category-form.tsx` — jar select + client guard |
| Schema/RPC reject | **PASS** | `createCategoryInputSchema`; SQL `ERR_CATEGORY_UNMAPPED` |
| Automated integration/E2E of GWT | **FAIL** | Only Zod/policy unit + mocked command boundary |

**Story AC completeness: PARTIAL** — behavior present; DoD verification tier unmet.

---

## AC-TRN-01 — Refund Linkage & Status Update

> GIVEN refund $50 linked to expense $150  
> THEN store `reverses_transaction_id`, status `PartiallyRefunded`, credit $50 jar capacity

| Layer | Result | Evidence |
|-------|--------|----------|
| `reverses_transaction_id` written | **PASS (SQL)** / **UNPROVEN (test)** | Migration insert; tests never assert persisted column |
| Status `partially_refunded` | **PASS (SQL+policy)** / **UNPROVEN (DB)** | RPC status math; mock returns status string |
| Capacity +$50 | **PARTIAL** | Returned as `capacity_restored`; implemented as income on jar — no live capacity assertion |
| Integration/E2E GWT | **FAIL** | Mocked RPC only |

**Story AC completeness: PARTIAL**

---

## AC-TRN-02 — 3-Way Correction Audit Chain

> GIVEN expense $100 corrected to $10  
> THEN: Original `Reversed`; reversal $100 with `reverses_transaction_id`; debit $10 with `corrects_transaction_id`; all three permanent

| Layer | Result | Evidence |
|-------|--------|----------|
| Three legs in SQL | **PASS** | `correct_transaction` atomic block |
| Policy net +90 | **PASS** | Unit `correctionChainNetImpact` |
| Permanence | **PARTIAL** | Delete blocked; in-place update still allowed |
| Audit UI | **PASS (basic)** | Detail `transaction-audit-chain` section (not collapsible expander) |
| Integration/E2E GWT | **FAIL** | Mocked IDs only |

**Story AC completeness: PARTIAL**

---

## Constitutional ACs (DoD checklist, not story ACs)

| AC | Sprint 1 expectation | Result |
|----|----------------------|--------|
| AC-JAR-01 (BR-01) | No plan-movement work this sprint; no regression | **PASS / N/A** |
| AC-HLT-01 (BR-24) | Zero new Health writes | **PASS** |

---

## Per-story AC rollup

| Story | AC | Implementation | DoD test gate | Complete? |
|-------|----|----------------|---------------|-----------|
| ST-E01-001 | AC-CAT-01 | Present | Fail | **No** |
| ST-E01-002 | AC-TRN-01 | Mostly present | Fail | **No** |
| ST-E01-003 | AC-TRN-02 | Mostly present | Fail | **No** |

Under Verification Board rules, **no Sprint 1 story is COMPLETE**.
