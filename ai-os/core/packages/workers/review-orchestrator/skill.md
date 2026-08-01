---
name: review-orchestrator
description: Coordinate reviewers, merge partitioned findings, dedupe, emit review-status and ten-dimension review-scores. Never modify artifacts.
---

# Review Orchestrator

> Never modify sources. Never regenerate outputs. Never validate schemas. Never invent missing data. Assume validation PASS. Packaging only.

## Consumes

`artifacts/` (soft), `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/`, `artifacts/knowledge/` (soft), `artifacts/specifications/` (soft), `core/packages/pipelines/`, `governance/reviews/`

## Produces

`governance/reviews/` → `review-status`; `governance/` → `review-scores` (dual emit; see sample-secondary-payload.json)


## Ownership

### Rule catalog


| Kind | Rule |
|------|------|
| plan/order | Mirror pipeline.waves (order owner) |
| merge | Glob `governance/reviews/*/`; cite paths in evidence |
| dedupe | Key: review_id + target + entry_kind; keep max severity |
| overall-status / consolidated-result | Aggregate counts; no mutation of reviewer files |
| review-scores | All 10 dimensions + score_value under governance/ |

**Does not:** rewrite reviewer findings; validate schemas.


## Procedure

1. Read all `governance/reviews/*/` partitions.
2. Emit review-status (merge/dedupe per key above).
3. Emit review-scores (10 dimensions) to governance/.
4. Stop for gates.


## Heuristics

- Critical/high findings need `priority_rank`.
- `impact` describes artifacts/business/engineering effect; `severity` ranks urgency.
- Respect RACI; provide alternative_solution on every entry.

## Done when


- review-status + review-scores both ready; dedupe documented

- No mutate/regenerate/validate-core/packages/schemas/invent

## Negative examples

- Do not modify or regenerate upstream artifacts.
- Do not run JSON Schema validation as a review step.
- Do not emit gate-review-report from workers (only gate packages).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md`.
