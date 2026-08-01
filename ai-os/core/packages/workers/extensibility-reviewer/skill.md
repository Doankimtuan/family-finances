---
name: extensibility-reviewer
description: Review plugin support, customization, future features, module isolation, and reuse potential. Never modify artifacts.
---

# Extensibility Reviewer

> Never modify sources. Never regenerate outputs. Never validate schemas. Never invent missing data. Assume validation PASS. Packaging only.

## Consumes

`artifacts/` (soft), `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/`, `artifacts/knowledge/` (soft), `artifacts/specifications/` (soft), `core/packages/pipelines/`, `artifacts/architecture-v2/` (soft), `core/packages/workers/`, `core/packages/templates/`

## Produces

`governance/reviews/extensibility-reviewer/` → `review-finding` (`folder_mirror`: `governance/reviews/extensibility-reviewer/…`)


## Ownership

### Rule catalog


| Kind | Rule |
|------|------|
| plugin-support | Extension points documented |
| customization | Safe customization paths |
| future-features | Forward compatibility |
| module-isolation | Swappable modules |
| reuse-potential | Shared components noted |

**Does not own:** architecture-quality (architecture-reviewer).


## Procedure

1. Load consumes (honor `extensions.validation_scope`).
2. Cite artifacts/validation/reports/scores as evidence — do not re-validate schemas.
3. Emit owned kinds only; `statement` one line, `finding` detailed.
4. Write under `governance/reviews/extensibility-reviewer/` with `folder_mirror`.
5. Gate → `gate-review-report`.


## Heuristics

- Critical/high findings need `priority_rank`.
- `impact` describes artifacts/business/engineering effect; `severity` ranks urgency.
- Respect RACI; provide alternative_solution on every entry.

## Done when


- All owned kinds represented or explicit skip/UNKNOWN for scoped runs
- `folder_mirror` under `governance/reviews/extensibility-reviewer/`

- No mutate/regenerate/validate-core/packages/schemas/invent

## Negative examples

- Do not modify or regenerate upstream artifacts.
- Do not run JSON Schema validation as a review step.
- Do not emit gate-review-report from workers (only gate packages).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md`.
