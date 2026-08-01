---
name: product-reviewer
description: Review product vision, feature coverage, user journey, business alignment, and missing product features. Never modify artifacts.
---

# Product Reviewer

> Never modify sources. Never regenerate outputs. Never validate schemas. Never invent missing data. Assume validation PASS. Packaging only.

## Consumes

`artifacts/` (soft), `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/`, `artifacts/knowledge/` (soft), `artifacts/specifications/` (soft), `core/packages/pipelines/`, `artifacts/features/` (soft), `artifacts/requirements/` (soft), `artifacts/acceptance/` (soft), `artifacts/product-architecture/` (soft), `artifacts/business/` (soft)

## Produces

`governance/reviews/product-reviewer/` → `review-finding` (`folder_mirror`: `governance/reviews/product-reviewer/…`)


## Ownership

### Rule catalog


| Kind | Rule |
|------|------|
| product-vision | Vision in artifacts/features/ or artifacts/knowledge/ |
| feature-coverage | artifacts/features/ covers stated scope |
| user-journey | Journeys trace to artifacts/acceptance/ |
| business-alignment | Scope aligns with artifacts/business/ |
| missing-product-features | Gaps as UNKNOWN — never invent |

**Does not own:** requirement-coverage (specification-reviewer); business-rules (business-reviewer).


## Procedure

1. Load consumes (honor `extensions.validation_scope`).
2. Cite artifacts/validation/reports/scores as evidence — do not re-validate schemas.
3. Emit owned kinds only; `statement` one line, `finding` detailed.
4. Write under `governance/reviews/product-reviewer/` with `folder_mirror`.
5. Gate → `gate-review-report`.


## Heuristics

- Critical/high findings need `priority_rank`.
- `impact` describes artifacts/business/engineering effect; `severity` ranks urgency.
- Respect RACI; provide alternative_solution on every entry.

## Done when


- All owned kinds represented or explicit skip/UNKNOWN for scoped runs
- `folder_mirror` under `governance/reviews/product-reviewer/`

- No mutate/regenerate/validate-core/packages/schemas/invent

## Negative examples

- Do not modify or regenerate upstream artifacts.
- Do not run JSON Schema validation as a review step.
- Do not emit gate-review-report from workers (only gate packages).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md`.
