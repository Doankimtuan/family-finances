# Priority Roadmap (Approved Spec v2 Only)

**Decision Board run:** `run_decision_board_20260801T135000Z`  
**Created:** 2026-08-01T13:47:04Z  
**Rule:** Dependency-safe order; deferred/rejected removed from critical path.

| Order | ID | Verdict | Score | Depends on (must be approved) |
|------:|----|---------|------:|-------------------------------|
| 1 | `IMP-001` | APPROVE | 40 | — |
| 2 | `IMP-009` | APPROVE | 35 | `IMP-001` |
| 3 | `IMP-002` | APPROVE WITH MODIFICATIONS | 28 | `IMP-001` |
| 4 | `IMP-005` | APPROVE | 31 | `IMP-001`, `IMP-002` |
| 5 | `IMP-003` | APPROVE | 35 | `IMP-001` |
| 6 | `IMP-010` | APPROVE | 33 | `IMP-002`, `IMP-003` |
| 7 | `IMP-004` | APPROVE | 29 | `IMP-002` |
| 8 | `IMP-007` | APPROVE | 31 | `IMP-001`, `IMP-005` |
| 9 | `IMP-006` | APPROVE WITH MODIFICATIONS | 25 | `IMP-004` |
| 10 | `IMP-008` | APPROVE WITH MODIFICATIONS | 29 | `IMP-004` |
| 11 | `IMP-015` | APPROVE WITH MODIFICATIONS | 28 | `IMP-006` |

## Phase grouping (approved)

1. **Foundations:** IMP-001, IMP-009  
2. **Contracts & errors:** IMP-002 (mod), IMP-005, IMP-003, IMP-010  
3. **Ops quality:** IMP-004, IMP-007, IMP-006 (mod)  
4. **Perf & privacy docs:** IMP-008 (mod), IMP-015 (mod)

## Explicitly out of critical path

- Deferred: IMP-011, IMP-012, IMP-013  
- Rejected: IMP-014  
