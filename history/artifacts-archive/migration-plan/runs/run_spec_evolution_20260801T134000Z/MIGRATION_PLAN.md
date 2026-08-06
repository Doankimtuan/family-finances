# Migration Plan — Spec v2 Proposal Adoption

**Run:** `run_spec_evolution_20260801T134000Z`  
**Mode:** Additive overlays → optional future adoption. Originals remain authoritative until explicitly adopted.

## Principles

1. Never rewrite BD/SPEC payloads in place.
2. Preserve compatibility with validated business rules and existing app routes/actions.
3. Prefer strangler/alias migrations over big-bang cuts.
4. Each phase has rollback: leave originals and previous aliases intact.

## Phase mapping

| Phase | Improvements | Compatibility tactic | Rollback |
|-------|----------------|----------------------|----------|
| 0 | IMP-001, IMP-009 | Spec overlays only | Delete overlays |
| 1 | IMP-002, IMP-005, IMP-010 | Additive response fields; catalog | Feature-flag off |
| 2 | IMP-003, IMP-004, IMP-006, IMP-007 | Non-behavioral UX/security/tests | Disable instrumentation/limits |
| 3 | IMP-008, IMP-015 | Budgets/runbooks | Relax budgets |
| 4 | IMP-011, IMP-012 | Shared services + /api/v1 aliases | Keep legacy paths |
| 5 | IMP-013, IMP-014 | Opt-in UX; read-only offline | Disable features |

## Compatibility with validated specifications

- Business rules `run_business_discovery_20260801T122000Z`: all preserved.
- Requirements/acceptance `run_specification_20260801T130500Z`: extended via overlays, not replaced.
- Runtime surfaces from REPO discovery remain until explicitly versioned.

## Stop condition for unsafe migration

If a change would alter ledger vs jar semantics, month-close rules, or role/RLS meaning → **STOP** and return to BD.
