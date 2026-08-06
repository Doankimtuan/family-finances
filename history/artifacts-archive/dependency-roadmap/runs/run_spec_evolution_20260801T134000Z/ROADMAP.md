# Dependency-aware Roadmap

**Run:** `run_spec_evolution_20260801T134000Z`  
**Rule:** Later phases must not invalidate earlier proposals.

## Ordered improvements (dependency-respecting)

1. **IMP-001** — Expand acceptance criteria to cover all requirements (depends: none)
1. **IMP-002** — Standardize API error envelope and idempotency headers (depends: IMP-001)
1. **IMP-003** — Accessibility acceptance overlay (WCAG 2.2 AA targets) (depends: IMP-001)
1. **IMP-004** — Product observability baseline (logs, traces, metrics) (depends: IMP-002)
1. **IMP-005** — Unified contract catalog for Server Actions vs Route Handlers (depends: IMP-001, IMP-002)
1. **IMP-006** — Security hardening overlay (CSP, rate limits, admin audit) (depends: IMP-004)
1. **IMP-007** — Testing strategy overlay (contract + critical journey tests) (depends: IMP-001, IMP-005)
1. **IMP-008** — Performance budgets for dashboard and jars spending APIs (depends: IMP-004)
1. **IMP-009** — Clarify soft-delete/archive vs active-jar in solution architecture (depends: IMP-001)
1. **IMP-010** — Error taxonomy for user-facing failures (depends: IMP-002, IMP-003)
1. **IMP-011** — Major: consolidate read/write contracts behind shared domain modules (depends: IMP-005, IMP-007, IMP-004)
1. **IMP-012** — Major: API versioning policy for public JSON routes (depends: IMP-002, IMP-005)
1. **IMP-013** — Future: assistive insights UX (non-generative ledger changes) (depends: IMP-004, IMP-001, IMP-003)
1. **IMP-014** — Future: offline read-only cache for dashboard summaries (depends: IMP-004, IMP-008, IMP-006)
1. **IMP-015** — Privacy engineering runbooks (export/delete within household tenancy) (depends: IMP-006)

## Phases

### Phase 0 — Foundations

- `IMP-001`: Expand acceptance criteria to cover all requirements
- `IMP-009`: Clarify soft-delete/archive vs active-jar in solution architecture

### Phase 1 — Contracts & API baseline

- `IMP-002`: Standardize API error envelope and idempotency headers
- `IMP-005`: Unified contract catalog for Server Actions vs Route Handlers
- `IMP-010`: Error taxonomy for user-facing failures

### Phase 2 — Quality & security

- `IMP-003`: Accessibility acceptance overlay (WCAG 2.2 AA targets)
- `IMP-004`: Product observability baseline (logs, traces, metrics)
- `IMP-006`: Security hardening overlay (CSP, rate limits, admin audit)
- `IMP-007`: Testing strategy overlay (contract + critical journey tests)

### Phase 3 — Performance

- `IMP-008`: Performance budgets for dashboard and jars spending APIs
- `IMP-015`: Privacy engineering runbooks (export/delete within household tenancy)

### Phase 4 — Major refactors

- `IMP-011`: Major: consolidate read/write contracts behind shared domain modules
- `IMP-012`: Major: API versioning policy for public JSON routes

### Phase 5 — Future vision

- `IMP-013`: Future: assistive insights UX (non-generative ledger changes)
- `IMP-014`: Future: offline read-only cache for dashboard summaries

## Non-breaking guarantees

- No phase removes BD business rules.
- API versioning (IMP-012) happens only after envelope standardization (IMP-002).
- Offline (IMP-014) only after observability/security baselines.
- Major consolidate (IMP-011) only after contract catalog + tests.
