# Architecture Verification — Sprint 2

## Verdict: **PASS WITH DOCUMENTED DRIFT**

| Check | Result | Notes |
|-------|--------|-------|
| Plan BC owns movements | **PASS** | `modules/plan` commands/policies/constants |
| Inbox BC owns partner alert surface | **PASS** | `emergency_declaration` kind |
| Spec `modules/budgets/` | **ACCEPTABLE** | Mapped to `modules/plan` (Constitution tree) |
| Mutations via command + DEFINER RPC | **PASS** | `reallocateJarCapacity` → `reallocate_jar_capacity` |
| UI → application only | **PASS** | Server action wrapper |
| No legacy-v1 imports | **PASS** | |
| No Architecture redesign | **PASS** | |
| BR-24 Health RO | **PASS** | Untouched |
| Domain event bus for `EmergencyDeclaredEvent` | **DRIFT** | JSON in `context_json`, not outbox/worker |

## Layering smells

- Form redefines Zod schema instead of importing command schema (`reallocate-jar-form.tsx` vs `reallocate-jar-capacity.schema.ts`) — TD-S2-03.
- Warn UX logic partially duplicated between client two-click flow and server `warningAcknowledged` gate.

## Circular dependencies

None detected for plan ↔ inbox on this path (plan RPC writes inbox directly inside DEFINER function — **cross-BC write inside DB**. Architecturally, Budgets emitting to Inbox via event is preferred; current pattern couples plan RPC to inbox table).

**Severity:** Medium architecture smell — acceptable for Alpha1 if documented; erodes event-driven rule (“domains communicate via events; direct cross-domain DB queries prohibited” from Architecture Definition).

## Score input

**7.5 / 10**
