---
name: documentation-reviewer
description: Review readability, consistency, examples, cross references, naming, formatting, and documentation quality. Never modify artifacts.
---

# Documentation Reviewer

> Never modify sources. Never regenerate outputs. Never validate schemas. Never invent missing data. Assume validation PASS. Packaging only.

## Consumes

`artifacts/` (soft), `validation/`, `reports/`, `scores/`, `knowledge/` (soft), `specifications/` (soft), `pipelines/`, `templates/`, `workers/`, `schemas/`, `features/` (soft)

## Produces

`reviews/documentation-reviewer/` → `review-finding` (`folder_mirror`: `reviews/documentation-reviewer/…`)


## Ownership

### Rule catalog


| Kind | Rule |
|------|------|
| readability | Audience-appropriate prose |
| consistency | Terminology aligned |
| examples | Worker examples present |
| cross-references | Links resolve |
| naming | kebab-case / art_* |
| formatting | Template headings followed |
| documentation-quality | README/TEMPLATE not empty |

**Does not own:** coding-standards body (specification-reviewer).


## Procedure

1. Load consumes (honor `extensions.validation_scope`).
2. Cite validation/reports/scores as evidence — do not re-validate schemas.
3. Emit owned kinds only; `statement` one line, `finding` detailed.
4. Write under `reviews/documentation-reviewer/` with `folder_mirror`.
5. Gate → `gate-review-report`.


## Heuristics

- Critical/high findings need `priority_rank`.
- `impact` describes business/engineering effect; `severity` ranks urgency.
- Respect RACI; provide alternative_solution on every entry.

## Done when


- All owned kinds represented or explicit skip/UNKNOWN for scoped runs
- `folder_mirror` under `reviews/documentation-reviewer/`

- No mutate/regenerate/validate-schemas/invent

## Negative examples

- Do not modify or regenerate upstream artifacts.
- Do not run JSON Schema validation as a review step.
- Do not emit gate-review-report from workers (only gate packages).

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md`.
