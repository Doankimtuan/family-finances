# Architecture Review — Sprint 2

## Verdict: **PASS** (no Architecture redesign)

| Check | Result |
|-------|--------|
| Bounded contexts remain `modules/plan`, `modules/inbox`, … | Pass — plan movements owned under plan; partner alert under inbox |
| Spec `modules/budgets/` path | Mapped onto existing `modules/plan` (Constitution tree) — documented, not invented |
| No new root `components/` | Pass |
| No `archive/legacy-v1` imports | Pass |
| Mutations via application commands + security-definer RPCs | Pass — `reallocateJarCapacity` → `reallocate_jar_capacity` |
| UI → Application Service only (no direct DB) | Pass — server action wraps command |
| BR-01 Real Ledger ≠ Jars | Pass — capacity_delta + plan_movements only; ledger count guard in RPC |
| BR-24 Health RO | Untouched this sprint |

## Drift notes

- Spec `POST /api/v2/jars/reallocate` surface implemented as module command + server action (rewrite pattern); behavior matches AC-JAR-01/02.
- BR-13 “partner device” = household Inbox item (shared visibility), not OS push notifications.
