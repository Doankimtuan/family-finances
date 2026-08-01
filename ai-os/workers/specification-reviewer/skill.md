---
name: specification-reviewer
description: Review specifications, requirements, acceptance criteria, API/database/UI/deployment specs, coding standards, and testing strategy. Never modify artifacts.
---

# Specification Reviewer

> Never modify sources. Never regenerate outputs. Never validate schemas. Never invent missing data. Assume validation PASS. Packaging only.

## Consumes

`artifacts/` (soft), `validation/`, `reports/`, `scores/`, `knowledge/` (soft), `specifications/` (soft), `pipelines/`, `requirements/` (soft), `acceptance/` (soft), `architecture-v2/` (soft), `tech-stack/` (soft), `migration/` (soft), `folder-structure/` (soft), `features/` (soft)

## Produces

`reviews/specification-reviewer/` → `review-finding` (`folder_mirror`: `reviews/specification-reviewer/…`)


## Ownership

### Rule catalog


| Kind | Rule |
|------|------|
| specifications | All Spec Eng sections or gaps |
| requirements | requirements/ traced |
| requirement-coverage | Every req has spec or gap |
| acceptance-criteria | acceptance/ maps to requirements |
| api-contracts | API sections consistent |
| database-contracts | DB sections complete |
| ui-specifications | UI where needed |
| deployment-specifications | Deploy/runbook present |
| coding-standards | Standards actionable |
| testing-strategy | Covers acceptance |

**Does not own:** readability (documentation-reviewer).


## Procedure

1. Load consumes (honor `extensions.validation_scope`).
2. Cite validation/reports/scores as evidence — do not re-validate schemas.
3. Emit owned kinds only; `statement` one line, `finding` detailed.
4. Write under `reviews/specification-reviewer/` with `folder_mirror`.
5. Gate → `gate-review-report`.


## Heuristics

- Critical/high findings need `priority_rank`.
- `impact` describes business/engineering effect; `severity` ranks urgency.
- Respect RACI; provide alternative_solution on every entry.

## Done when


- All owned kinds represented or explicit skip/UNKNOWN for scoped runs
- `folder_mirror` under `reviews/specification-reviewer/`

- No mutate/regenerate/validate-schemas/invent

## Negative examples

- Do not modify or regenerate upstream artifacts.
- Do not run JSON Schema validation as a review step.
- Do not emit gate-review-report from workers (only gate packages).

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md`.
