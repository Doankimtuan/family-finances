---
name: business-reviewer
description: Review business rules, workflow consistency, edge cases, permission rules, state transitions, domain logic, and business completeness. Never modify artifacts.
---

# Business Reviewer

> Never modify sources. Never regenerate outputs. Never validate schemas. Never invent missing data. Assume validation PASS. Packaging only.

## Consumes

`artifacts/` (soft), `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/`, `artifacts/knowledge/` (soft), `artifacts/specifications/` (soft), `core/packages/pipelines/`, `artifacts/business/` (soft), `artifacts/workflow/` (soft), `artifacts/acceptance/` (soft), `artifacts/features/` (soft)

## Produces

`governance/reviews/business-reviewer/` → `review-finding` (`folder_mirror`: `governance/reviews/business-reviewer/…`)


## Ownership

### Rule catalog


| Kind | Rule |
|------|------|
| business-rules | artifacts/business/ complete and consistent |
| workflow-consistency | artifacts/workflow/ matches rules |
| edge-cases | Edge cases documented |
| permission-rules | AuthZ explicit |
| state-transitions | States coherent |
| domain-logic | Invariants stated |
| business-completeness | No silent gaps |

**Does not own:** api-contracts (specification-reviewer).


## Procedure

1. Load consumes (honor `extensions.validation_scope`).
2. Cite artifacts/validation/reports/scores as evidence — do not re-validate schemas.
3. Emit owned kinds only; `statement` one line, `finding` detailed.
4. Write under `governance/reviews/business-reviewer/` with `folder_mirror`.
5. Gate → `gate-review-report`.


## Heuristics

- Critical/high findings need `priority_rank`.
- `impact` describes artifacts/business/engineering effect; `severity` ranks urgency.
- Respect RACI; provide alternative_solution on every entry.

## Done when


- All owned kinds represented or explicit skip/UNKNOWN for scoped runs
- `folder_mirror` under `governance/reviews/business-reviewer/`

- No mutate/regenerate/validate-core/packages/schemas/invent

## Negative examples

- Do not modify or regenerate upstream artifacts.
- Do not run JSON Schema validation as a review step.
- Do not emit gate-review-report from workers (only gate packages).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md`.
