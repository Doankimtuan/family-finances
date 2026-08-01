# Approved Improvements (Specification v2)

**Decision Board run:** `run_decision_board_20260801T135000Z`  
**Source evolution:** `run_spec_evolution_20260801T134000Z`  
**Created:** 2026-08-01T13:47:04Z  
**Constraint:** Specs not modified. Spec v1 remains source of truth until a future adoption run.

## Summary

| ID | Verdict | Score | Title |
|----|---------|------:|-------|
| `IMP-001` | APPROVE | 40 | Expand acceptance criteria to cover all requirements |
| `IMP-009` | APPROVE | 35 | Clarify soft-delete/archive vs active-jar in solution architecture |
| `IMP-002` | APPROVE WITH MODIFICATIONS | 28 | Standardize API error envelope and idempotency headers |
| `IMP-005` | APPROVE | 31 | Unified contract catalog for Server Actions vs Route Handlers |
| `IMP-003` | APPROVE | 35 | Accessibility acceptance overlay (WCAG 2.2 AA targets) |
| `IMP-010` | APPROVE | 33 | Error taxonomy for user-facing failures |
| `IMP-004` | APPROVE | 29 | Product observability baseline (logs, traces, metrics) |
| `IMP-007` | APPROVE | 31 | Testing strategy overlay (contract + critical journey tests) |
| `IMP-006` | APPROVE WITH MODIFICATIONS | 25 | Security hardening overlay (CSP, rate limits, admin audit) |
| `IMP-008` | APPROVE WITH MODIFICATIONS | 29 | Performance budgets for dashboard and jars spending APIs |
| `IMP-015` | APPROVE WITH MODIFICATIONS | 28 | Privacy engineering runbooks (export/delete within household tenancy) |

## Dimension scores (approved set)

| ID | Biz | User | DX | Maint↓ | Impl↓ | Migr↓ | Risk↓ | LT | 2026 | Score |
|----|----:|-----:|---:|-------:|------:|------:|------:|---:|-----:|------:|
| `IMP-001` | 88 | 70 | 92 | 35 | 30 | 20 | 15 | 90 | 85 | **40** |
| `IMP-002` | 65 | 60 | 88 | 40 | 45 | 40 | 35 | 80 | 82 | **28** |
| `IMP-003` | 75 | 92 | 70 | 45 | 50 | 35 | 25 | 85 | 95 | **35** |
| `IMP-004` | 82 | 50 | 88 | 50 | 55 | 45 | 35 | 92 | 95 | **29** |
| `IMP-005` | 70 | 40 | 90 | 30 | 35 | 25 | 20 | 88 | 78 | **31** |
| `IMP-006` | 78 | 60 | 65 | 50 | 55 | 50 | 45 | 85 | 90 | **25** |
| `IMP-007` | 85 | 55 | 90 | 45 | 55 | 40 | 30 | 92 | 88 | **31** |
| `IMP-008` | 70 | 75 | 72 | 40 | 45 | 35 | 30 | 75 | 80 | **29** |
| `IMP-009` | 80 | 55 | 85 | 20 | 25 | 15 | 20 | 75 | 70 | **35** |
| `IMP-010` | 68 | 85 | 80 | 40 | 40 | 35 | 25 | 78 | 80 | **33** |
| `IMP-015` | 72 | 55 | 60 | 35 | 30 | 25 | 25 | 70 | 75 | **28** |

## Decisions

### IMP-001 — Expand acceptance criteria to cover all requirements

**Verdict:** APPROVE  
**Score:** 40

**Why:** Highest leverage for verified delivery; closes thin acceptance gap; low risk; no business-rule change.

**Dependencies:** none

### IMP-009 — Clarify soft-delete/archive vs active-jar in solution architecture

**Verdict:** APPROVE  
**Score:** 35

**Why:** Cheap architecture clarification protecting br-jar-active vs soft-delete/archive; prevents implementation drift.

**Dependencies:** `IMP-001`

### IMP-002 — Standardize API error envelope and idempotency headers

**Verdict:** APPROVE WITH MODIFICATIONS  
**Score:** 28

**Why:** Uniform errors improve DX and clients, but blanket idempotency on all routes is unnecessary complexity for a single Next client.

**Modifications required:** Approve uniform error envelope + request-id on all JSON routes. Limit idempotency-key to mutating savings/transactions routes only; do not require on GETs or all handlers.

**Dependencies:** `IMP-001`

### IMP-005 — Unified contract catalog for Server Actions vs Route Handlers

**Verdict:** APPROVE  
**Score:** 31

**Why:** Documentation/catalog only; reduces dual-surface sprawl without runtime rewrite or breaking changes.

**Dependencies:** `IMP-001`, `IMP-002`

### IMP-003 — Accessibility acceptance overlay (WCAG 2.2 AA targets)

**Verdict:** APPROVE  
**Score:** 35

**Why:** Closes 2026 accessibility gap (score 55); high user value; overlay ACs do not invent business features.

**Dependencies:** `IMP-001`

### IMP-010 — Error taxonomy for user-facing failures

**Verdict:** APPROVE  
**Score:** 33

**Why:** Stable user-facing error taxonomy improves UX/support without changing ledger semantics.

**Dependencies:** `IMP-002`, `IMP-003`

### IMP-004 — Product observability baseline (logs, traces, metrics)

**Verdict:** APPROVE  
**Score:** 29

**Why:** Critical 2026 gap (observability 40 / logging 35); enables safe ops for validated automation without new business modes.

**Dependencies:** `IMP-002`

### IMP-007 — Testing strategy overlay (contract + critical journey tests)

**Verdict:** APPROVE  
**Score:** 31

**Why:** Testing overlay proves BR constraints hold; justified cost vs regression risk on allocation/month-close.

**Dependencies:** `IMP-001`, `IMP-005`

### IMP-006 — Security hardening overlay (CSP, rate limits, admin audit)

**Verdict:** APPROVE WITH MODIFICATIONS  
**Score:** 25

**Why:** Security hardening is warranted, but broad rate limits can harm legitimate household use and add operational noise.

**Modifications required:** Approve CSP + admin privileged-action audit. Scope rate limits to auth endpoints and sensitive mutations first; do not apply blanket limits to all reads.

**Dependencies:** `IMP-004`

### IMP-008 — Performance budgets for dashboard and jars spending APIs

**Verdict:** APPROVE WITH MODIFICATIONS  
**Score:** 29

**Why:** API budgets protect dashboard/jars UX; full CWV program is disproportionate cost for Spec v2.

**Modifications required:** Approve API latency/payload budgets for dashboard, jars spending, and savings routes. Defer full Core Web Vitals program outside Spec v2 critical path.

**Dependencies:** `IMP-004`

### IMP-015 — Privacy engineering runbooks (export/delete within household tenancy)

**Verdict:** APPROVE WITH MODIFICATIONS  
**Score:** 28

**Why:** Privacy ops runbooks add value within existing household tenancy; new admin product UI is unjustified scope for v2.

**Modifications required:** Approve documentation/runbooks only. Defer any new admin export/delete product UI or tools.

**Dependencies:** `IMP-006`

## Preserved constraints

- Business rules (BD): unchanged
- Domain model: unchanged
- Validated requirements: unchanged
- Accepted architecture: unchanged
- No breaking API path changes in approved Spec v2 set
