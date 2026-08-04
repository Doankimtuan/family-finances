# Implementation Report — Sprint 2 (Spec v2.1)

| Field | Value |
|-------|--------|
| Sprint | Implementation Planning **Sprint 2** / `Sprint-2` |
| Goal | Decoupled Plan Movements & Emergency Flow (EPIC 2) |
| Plan SoT | `artifacts/implementation-planning/CURRENT/sprint-plan.md` |
| Spec SoT | Specification Synchronization v2.1 |
| Opened | 2026-08-04 |
| Completed | 2026-08-04T00:39:14Z |
| Status | **COMPLETE — awaiting approval** |

## Scope executed

| Story | Points | Outcome |
|-------|--------|---------|
| `ST-E02-001` Decoupled jar plan movements ($0.00 ledger) | 5 | Done |
| `ST-E02-002` Emergency flag & BR-07 bypass | 5 | Done |
| `ST-E02-003` Partner emergency notification | 3 | Done |

## What shipped

### Database
- Migration `supabase/migrations/20260804080000_sprint2_plan_movements_emergency.sql`
  - Applied remotely as `sprint2_plan_movements_emergency` on family-finances-2 (`bbzffxvgocjwsdbujvgn`)
  - `jars.capacity_delta` (virtual intention capacity)
  - `plan_movements` with `ledger_impact = 0` check, `is_emergency`, `intent_note`
  - Inbox kind `emergency_declaration`, source_type `plan_movement`
  - RPC `reallocate_jar_capacity` — updates capacity only; asserts no new `transactions` rows; emergency inserts Inbox item with `EmergencyDeclaredEvent`

### Application (plan / inbox)
- `reallocateJarCapacity` command + Zod input schema
- Policies: `shouldShowOverspendWarning`, `isEmergencyIntentValid`, `isZeroLedgerImpact`, `applyCapacityDelta`
- Constants: `PLAN_MOVEMENT_LEDGER_IMPACT`, `PlanMovementEvent`, `CapacityMovementDirection`, `PLAN_ACTION_ERROR_CODE`
- Inbox: `InboxItemKind.EMERGENCY_DECLARATION`, `intentNote` on review items

### UI
- Plan jar detail: RHF reallocate form with virtual-capacity banner, amount, target jar, Declare Emergency + intent note, BR-07 warn step
- Plan hub + jar detail: emergency Inbox banner with intent note + link
- Inbox queue filter + decision panel for emergency declarations (dismiss after review)

### Tests
- Unit coverage for AC-JAR-01 / AC-JAR-02 (`tests/unit/sprint2-plan-movements.test.ts`)
- Regression: full unit suite green (206 tests)

## Explicit non-goals (not in this sprint)

- Sprint 3 typed Inbox ReviewItem discriminators / auto-resolution
- Push/device notification infrastructure (partner alert = shared household Inbox)
- Product Decision Board EO-04 RecurringPatterns

## Folder naming note

Rewrite S1–S6 live under `artifacts/sprint-execution/sprint-00x/`. This pack is **Spec v2.1 Implementation Planning Sprint 2** and uses `Sprint-2/` to avoid overwriting frozen rewrite packs. Story IDs `ST-E02-*` in this pack are **not** the same stories as rewrite `sprint-002`.
