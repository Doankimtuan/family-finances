# Architecture Verification — Sprint 4

## Intentional decisions (accepted)

| Decision | Board |
|----------|-------|
| Ritual remains under `modules/plan` (no `modules/month-ritual/`) | **PASS** vs Constitution / handover |
| Extend `month_ritual_runs` vs legacy close tables | **PASS** |
| Household-scoped RPC pattern (mirrors Inbox staleness) | **ACCEPTABLE** as interim; insufficient alone for Tech Spec worker |
| Spec Miscellaneous → seeded `General` | **PASS** with named constant |
| `RITUAL_GATE_ERROR_CODE` separate from product-wide errors | **PASS** |

## Layering

| Layer | Finding |
|-------|---------|
| Application commands/queries | **PASS** — autolock, ritual mutations, divergence/emergency queries |
| UI | **PASS** — wizard renders + disables; no lock math in client |
| Infrastructure / SQL | Worker + BR-15 resolve in Postgres RPCs — appropriate for atomicity |
| Shared UI / tokens | **PASS** — StatusAlert, Button, TextField, Progress |

## Boundary issues

| Issue | Severity |
|-------|----------|
| Plan RPC mutates `inbox_items` + `transactions.jar_id` (cross-BC) | Medium — intentional for BR-15; erodes Inbox BC purity (same class as Sprint 2/3) |
| `is_month_ritual_locked` dead vs TS `assertPlanPeriodUnlocked` dual path | Medium — drift risk; no DB-enforced lock on jar writes |
| Traceability SoT still cites `modules/month-ritual/` + `POST /api/v2/ritual/autolock` | Low — Spec pack drift; code correctly avoided inventing that module |
| Fail-open when ritual table errors (`assertPlanPeriodUnlocked`) | Medium — money/plan safety |

## Circular dependencies

None observed among `modules/plan` application imports for Sprint 4 surfaces.

## Architecture score

**7.5 / 10** — Constitutionally placed; lock enforcement architecture incomplete for BR-08.
