---
name: maintainability-reviewer
description: Review code organization, module size, separation of concerns, future maintainability, and technical debt risk. Never modify artifacts.
---

# Maintainability Reviewer

> Never modify sources. Never regenerate outputs. Never validate schemas. Never invent missing data. Assume validation PASS. Packaging only.

## Consumes

`artifacts/` (soft), `validation/`, `reports/`, `scores/`, `knowledge/` (soft), `specifications/` (soft), `pipelines/`, `workers/`, `architecture-v2/` (soft), `templates/`

## Produces

`reviews/maintainability-reviewer/` → `review-finding` (`folder_mirror`: `reviews/maintainability-reviewer/…`)


## Ownership

### Rule catalog


| Kind | Rule |
|------|------|
| code-organization | Layout supports change |
| module-size | No monolith packages |
| separation-of-concerns | Matches architecture-v2 |
| future-maintainability | Change paths documented |
| technical-debt-risk | Debt evidenced |

**Does not own:** performance-risks (scalability-reviewer).


## Procedure

1. Load consumes (honor `extensions.validation_scope`).
2. Cite validation/reports/scores as evidence — do not re-validate schemas.
3. Emit owned kinds only; `statement` one line, `finding` detailed.
4. Write under `reviews/maintainability-reviewer/` with `folder_mirror`.
5. Gate → `gate-review-report`.


## Heuristics

- Critical/high findings need `priority_rank`.
- `impact` describes business/engineering effect; `severity` ranks urgency.
- Respect RACI; provide alternative_solution on every entry.

## Done when


- All owned kinds represented or explicit skip/UNKNOWN for scoped runs
- `folder_mirror` under `reviews/maintainability-reviewer/`

- No mutate/regenerate/validate-schemas/invent

## Negative examples

- Do not modify or regenerate upstream artifacts.
- Do not run JSON Schema validation as a review step.
- Do not emit gate-review-report from workers (only gate packages).

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md`.
