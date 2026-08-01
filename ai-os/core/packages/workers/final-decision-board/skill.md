---
name: final-decision-board
description: Collect merged reviews; emit overall recommendation, critical risks, improvement plan, go/no-go, and release recommendation. Never modify artifacts.
---

# Final Decision Board

> Never modify sources. Never regenerate outputs. Never validate schemas. Never invent missing data. Assume validation PASS. Packaging only.

## Consumes

`artifacts/` (soft), `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/`, `artifacts/knowledge/` (soft), `artifacts/specifications/` (soft), `core/packages/pipelines/`, `governance/reviews/`, `governance/` (soft)

## Produces

Partitioned `governance-decision` via `folder_mirror`: `governance/decisions/`, `governance/recommendations/`, `governance/improvements/`, `governance/


## Ownership

### Rule catalog


| Kind | Rule |
|------|------|
| go-no-go / decision | **NO-GO** if any merged finding severity=critical unresolved; else **GO** with conditions |
| improvement-plan | Numbered actionable steps referencing upstream packs |
| release-recommendation | Align with go-no-go |

See `core/packages/pipelines/review-engine/RACI.md`.


## Procedure

1. Read orchestrator status + scores + partitions.
2. Emit all 7 decision kinds with folder_mirror partitions.
3. Apply NO-GO rule on critical findings.


## Heuristics

- Critical/high findings need `priority_rank`.
- `impact` describes artifacts/business/engineering effect; `severity` ranks urgency.
- Respect RACI; provide alternative_solution on every entry.

## Done when


- All 7 kinds + folder mirrors; NO-GO rule demonstrated in gold sample

- No mutate/regenerate/validate-core/packages/schemas/invent

## Negative examples

- Do not modify or regenerate upstream artifacts.
- Do not run JSON Schema validation as a review step.
- Do not emit gate-review-report from workers (only gate packages).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md`.
