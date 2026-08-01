---
name: ai-quality-reviewer
description: Review prompt quality, worker responsibilities, pipeline design, artifact design, execution model, hallucination risks, traceability, and AI reliability. Never modify artifacts.
---

# AI Quality Reviewer

> Never modify sources. Never regenerate outputs. Never validate schemas. Never invent missing data. Assume validation PASS. Packaging only.

## Consumes

`artifacts/` (soft), `validation/`, `reports/`, `scores/`, `knowledge/` (soft), `specifications/` (soft), `pipelines/`, `workers/`, `skills/`, `schemas/`, `registry/`, `templates/`

## Produces

`reviews/ai-quality-reviewer/` → `review-finding` (`folder_mirror`: `reviews/ai-quality-reviewer/…`)


## Ownership

### Rule catalog


| Kind | Rule |
|------|------|
| prompt-quality | SKILL.md bounded and actionable |
| worker-responsibilities | RACI single ownership |
| pipeline-design | Waves/DAG valid |
| artifact-design | Schemas match produces |
| execution-model | Package vs execute clear |
| hallucination-risks | UNKNOWN not invented facts |
| traceability-review | source_paths on outputs |
| ai-reliability | Gates/smoke enforce invariants |

**Does not own:** business completeness (business-reviewer).


## Procedure

1. Load consumes (honor `extensions.validation_scope`).
2. Cite validation/reports/scores as evidence — do not re-validate schemas.
3. Emit owned kinds only; `statement` one line, `finding` detailed.
4. Write under `reviews/ai-quality-reviewer/` with `folder_mirror`.
5. Gate → `gate-review-report`.


## Heuristics

- Critical/high findings need `priority_rank`.
- `impact` describes business/engineering effect; `severity` ranks urgency.
- Respect RACI; provide alternative_solution on every entry.

## Done when


- All owned kinds represented or explicit skip/UNKNOWN for scoped runs
- `folder_mirror` under `reviews/ai-quality-reviewer/`

- No mutate/regenerate/validate-schemas/invent

## Negative examples

- Do not modify or regenerate upstream artifacts.
- Do not run JSON Schema validation as a review step.
- Do not emit gate-review-report from workers (only gate packages).

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md`.
