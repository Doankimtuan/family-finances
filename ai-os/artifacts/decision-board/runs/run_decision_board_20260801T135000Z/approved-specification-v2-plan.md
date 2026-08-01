# Approved Specification v2 Plan

**Status:** PLAN — NOT ADOPTED AS SYSTEM OF RECORD  
**Decision Board:** `run_decision_board_20260801T135000Z`  
**Evolution source:** `run_spec_evolution_20260801T134000Z`  
**Created:** 2026-08-01T13:47:04Z

## Attestation

- This board **does not modify** Specification v1, BD, SPEC packs, or Spec Evolution proposal files.
- Spec v1 (`ai-os/artifacts/final/` + frozen packs) remains **source of truth** until a future explicit adoption run.
- **100% business rules, domain model, validated requirements, and accepted architecture preserved.**
- No breaking API path changes are included in the approved set.

## What Spec v2 includes

Overlays / solution improvements with board verdict APPROVE or APPROVE WITH MODIFICATIONS:

### IMP-001 — Expand acceptance criteria to cover all requirements

- **Verdict:** APPROVE
- **Score:** 40
- **Why included:** Highest leverage for verified delivery; closes thin acceptance gap; low risk; no business-rule change.

### IMP-009 — Clarify soft-delete/archive vs active-jar in solution architecture

- **Verdict:** APPROVE
- **Score:** 35
- **Why included:** Cheap architecture clarification protecting br-jar-active vs soft-delete/archive; prevents implementation drift.

### IMP-002 — Standardize API error envelope and idempotency headers

- **Verdict:** APPROVE WITH MODIFICATIONS
- **Score:** 28
- **Why included:** Uniform errors improve DX and clients, but blanket idempotency on all routes is unnecessary complexity for a single Next client.
- **Required modifications:** Approve uniform error envelope + request-id on all JSON routes. Limit idempotency-key to mutating savings/transactions routes only; do not require on GETs or all handlers.

### IMP-005 — Unified contract catalog for Server Actions vs Route Handlers

- **Verdict:** APPROVE
- **Score:** 31
- **Why included:** Documentation/catalog only; reduces dual-surface sprawl without runtime rewrite or breaking changes.

### IMP-003 — Accessibility acceptance overlay (WCAG 2.2 AA targets)

- **Verdict:** APPROVE
- **Score:** 35
- **Why included:** Closes 2026 accessibility gap (score 55); high user value; overlay ACs do not invent business features.

### IMP-010 — Error taxonomy for user-facing failures

- **Verdict:** APPROVE
- **Score:** 33
- **Why included:** Stable user-facing error taxonomy improves UX/support without changing ledger semantics.

### IMP-004 — Product observability baseline (logs, traces, metrics)

- **Verdict:** APPROVE
- **Score:** 29
- **Why included:** Critical 2026 gap (observability 40 / logging 35); enables safe ops for validated automation without new business modes.

### IMP-007 — Testing strategy overlay (contract + critical journey tests)

- **Verdict:** APPROVE
- **Score:** 31
- **Why included:** Testing overlay proves BR constraints hold; justified cost vs regression risk on allocation/month-close.

### IMP-006 — Security hardening overlay (CSP, rate limits, admin audit)

- **Verdict:** APPROVE WITH MODIFICATIONS
- **Score:** 25
- **Why included:** Security hardening is warranted, but broad rate limits can harm legitimate household use and add operational noise.
- **Required modifications:** Approve CSP + admin privileged-action audit. Scope rate limits to auth endpoints and sensitive mutations first; do not apply blanket limits to all reads.

### IMP-008 — Performance budgets for dashboard and jars spending APIs

- **Verdict:** APPROVE WITH MODIFICATIONS
- **Score:** 29
- **Why included:** API budgets protect dashboard/jars UX; full CWV program is disproportionate cost for Spec v2.
- **Required modifications:** Approve API latency/payload budgets for dashboard, jars spending, and savings routes. Defer full Core Web Vitals program outside Spec v2 critical path.

### IMP-015 — Privacy engineering runbooks (export/delete within household tenancy)

- **Verdict:** APPROVE WITH MODIFICATIONS
- **Score:** 28
- **Why included:** Privacy ops runbooks add value within existing household tenancy; new admin product UI is unjustified scope for v2.
- **Required modifications:** Approve documentation/runbooks only. Defer any new admin export/delete product UI or tools.

## What Spec v2 excludes

### Deferred (post-v2 backlog)

- **IMP-011** — shared domain consolidate (high migration/arch risk)
- **IMP-012** — `/api/v1` versioning (premature for single client)
- **IMP-013** — assistive insights UX (low urgency / trend risk)

### Rejected

- **IMP-014** — offline read-only cache (complexity, ledger-adjacent risk, low business value)

## Non-breaking guarantees

- No removal of validated business rules
- No invented business capabilities
- No mandatory API path renames in v2
- Idempotency, rate limits, and privacy UI scoped per modifications above

## Adoption note

Publishing this plan does **not** replace Spec v1. A separate adoption orchestration is required to merge overlays into authoritative specs.

## Related artifacts

- `approved-improvements.md`
- `rejected-improvements.md`
- `deferred-improvements.md`
- `priority-roadmap.md`
- `evaluations/*.json`
