---
name: specification-reviewer
description: Review specifications, requirements, acceptance criteria, API/database/UI/deployment specs, coding standards, and testing strategy. Never modify artifacts.
---

# Specification Reviewer

> Never modify sources. Never regenerate outputs. Never validate schemas. Never invent missing data. Assume validation PASS. Packaging only.

## Consumes

`artifacts/` (soft), `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/`, `artifacts/knowledge/` (soft), `artifacts/specifications/` (soft), `core/packages/pipelines/`, `artifacts/requirements/` (soft), `artifacts/acceptance/` (soft), `artifacts/architecture-v2/` (soft), `artifacts/tech-stack/` (soft), `artifacts/migration/` (soft), `artifacts/folder-structure/` (soft), `artifacts/features/` (soft)

## Produces

`governance/reviews/specification-reviewer/` → `review-finding` (`folder_mirror`: `governance/reviews/specification-reviewer/…`)


## Ownership

### Rule catalog


| Kind | Rule |
|------|------|
| specifications | All Spec Eng sections or gaps |
| requirements | artifacts/requirements/ traced |
| requirement-coverage | Every req has spec or gap |
| acceptance-criteria | artifacts/acceptance/ maps to requirements |
| api-contracts | API sections consistent |
| database-contracts | DB sections complete |
| ui-specifications | UI where needed |
| deployment-specifications | Deploy/runbook present |
| coding-standards | Standards actionable |
| testing-strategy | Covers acceptance |

**Does not own:** readability (documentation-reviewer).


## Procedure

1. Load consumes (honor `extensions.validation_scope`).
2. Cite artifacts/validation/reports/scores as evidence — do not re-validate schemas.
3. Emit owned kinds only; `statement` one line, `finding` detailed.
4. Write under `governance/reviews/specification-reviewer/` with `folder_mirror`.
5. Gate → `gate-review-report`.


## Heuristics

- Critical/high findings need `priority_rank`.
- `impact` describes artifacts/business/engineering effect; `severity` ranks urgency.
- Respect RACI; provide alternative_solution on every entry.

## Done when


- All owned kinds represented or explicit skip/UNKNOWN for scoped runs
- `folder_mirror` under `governance/reviews/specification-reviewer/`

- No mutate/regenerate/validate-core/packages/schemas/invent

## Negative examples

- Do not modify or regenerate upstream artifacts.
- Do not run JSON Schema validation as a review step.
- Do not emit gate-review-report from workers (only gate packages).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md`.
