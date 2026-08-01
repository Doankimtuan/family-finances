# Specification v2 Proposal

**Status:** PROPOSAL — NOT ADOPTED  
**Run:** `run_spec_evolution_20260801T134000Z`  
**Created:** 2026-08-01T13:39:19Z

## Attestation

- Original validated specifications remain the **source of truth**.
- This document is a **proposal overlay** only.
- **100% business intent preserved** — all BD business rules retained; none removed.
- **No new business requirements invented.**
- Solution/UX/platform evolution for 2026 readiness only.

## Inputs (frozen)

- Business Discovery `run_business_discovery_20260801T122000Z`
- Specification Generation `run_specification_20260801T130500Z`
- Repository Discovery `run_repository_discovery_20260801T132500Z`
- Final composition `ai-os/artifacts/final/`

## Quick Wins

### IMP-001 — Expand acceptance criteria to cover all requirements

Add acceptance entries 1:1 (or scenario bundles) for every requirement ID; keep statements aligned to existing req text

### IMP-002 — Standardize API error envelope and idempotency headers

Solution overlay: standard `{error:{code,message,details}}`, request-id, idempotency-key for mutating routes — behavior of business outcomes unchanged

### IMP-009 — Clarify soft-delete/archive vs active-jar in solution architecture

Architecture-v2 clarification overlay: define state matrix for active/archived/soft-deleted — preserve br-jar-active intent

### IMP-010 — Error taxonomy for user-facing failures

Map domain errors to stable codes/messages (i18n keys) for existing flows

## Medium Improvements

### IMP-003 — Accessibility acceptance overlay (WCAG 2.2 AA targets)

Add non-business acceptance: keyboard, contrast, labels, focus — applied to existing pages/journeys

### IMP-004 — Product observability baseline (logs, traces, metrics)

Specify structured logs + trace ids on actions/API + metrics for jar automation/month-close — no new business features

### IMP-005 — Unified contract catalog for Server Actions vs Route Handlers

Catalog each action/route with input schema (zod), authz, BR references — solution doc only; keep existing surfaces until major refactor

### IMP-006 — Security hardening overlay (CSP, rate limits, admin audit)

Add CSP, rate limits on auth/API, audit log for admin-only actions — does not change partner/admin business roles

### IMP-007 — Testing strategy overlay (contract + critical journey tests)

Define test pyramid overlay: unit for allocation engines, contract for API/actions, e2e for journeys — assert existing BR

### IMP-008 — Performance budgets for dashboard and jars spending APIs

Set latency/payload budgets on existing dashboard/jars/savings routes; caching guidance without changing payloads semantics

### IMP-015 — Privacy engineering runbooks (export/delete within household tenancy)

Solution runbooks for export/delete aligned to existing household boundaries — no new product compliance claims

## Major Refactors

### IMP-011 — Major: consolidate read/write contracts behind shared domain modules

Gradually route handlers/actions through shared application services — preserve all BR and external URL/action names during migration

### IMP-012 — Major: API versioning policy for public JSON routes

Introduce /api/v1 additive versioning; keep old paths as aliases until deprecated — no business change

## Future Vision

### IMP-013 — Future: assistive insights UX (non-generative ledger changes)

Improve presentation/automation trust UI for existing insights — forbid new money-movement semantics

### IMP-014 — Future: offline read-only cache for dashboard summaries

Read-only cached summaries; block offline mutations that would violate real-ledger BR

## Success alignment

| Criterion | How addressed |
|-----------|----------------|
| Preserve business intent | All BR listed in every IMP; freeze hashes recorded |
| Maintainability | IMP-005, IMP-011, contract catalog |
| UX | IMP-003, IMP-010, IMP-013 |
| Scalability | IMP-008, IMP-012 |
| Security | IMP-006 |
| Technical debt | IMP-002, IMP-005, IMP-011 |
| Implementation quality | IMP-001, IMP-007 |
| 2026-ready without losing compatibility | Additive overlays + strangler migrations |

## Related graphs

- `ai-os/artifacts/specification-graph/runs/run_spec_evolution_20260801T134000Z/`
- `ai-os/artifacts/improvement-analysis/runs/run_spec_evolution_20260801T134000Z/`
