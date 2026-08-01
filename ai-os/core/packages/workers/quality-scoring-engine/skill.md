---
name: quality-scoring-engine
description: Generate structured quality scores (9 dimensions) from partitioned validation findings. Never modify artifacts.
---

# Quality Scoring Engine

> Never modify source artifacts. Never invent missing information. Report structured findings only. Packaging only — do not execute unless a later phase opens execute.

## Consumes

`core/packages/schemas/`, `artifacts/` (soft), `core/packages/workers/`, `core/packages/pipelines/`, `artifacts/execution/` (soft), `core/packages/templates/`, `artifacts/knowledge/` (soft), `artifacts/validation/`

## Produces

`artifacts/scores/` → `quality-scores` (all 9 dimensions + `score_value`). Optional mirror: `governance/quality/validation-scorecard/` (do not overwrite SA `governance/quality/` templates).

## Ownership

### Scoring (owns all 9)
overall, architecture, documentation, consistency, completeness, maintainability, extensibility, reliability, confidence

Each ready payload **must** include all 9 `entry_kind`s with required `score_value` (0–1). If a dimension cannot be scored, emit it with `result: skip`, `score_value: 0`, and `UNKNOWN:` reason — never omit the kind.

**Weights (default):** overall=0.20; others=0.10 each (document deviations in `extensions.score_weights`).

**Inputs:** merge-ready findings from `artifacts/validation/<worker_id>/` only.

## Procedure

1. Read partitioned findings under `artifacts/validation/*/`.
2. Score all 9 dimensions; require `score_value` on each.
3. Write `quality-scores` under `artifacts/scores/`. Optional scorecard mirror under `governance/quality/validation-scorecard/` only.
4. Stop for gates.

## Heuristics

- Prefer path/schema evidence; fail closed on critical contract breaks.
- Partial runs must emit unknowns for skipped targets.
- Respect RACI — do not duplicate another validator's kinds.
- `result` is authoritative; never use entry_kind `pass`/`fail`.

## Done when

- All 9 score kinds present with `score_value`
- Findings consumed from partitions only

## Negative examples

- Do not rewrite core/packages/schemas/workers/packs to “fix” findings.
- Do not fabricate traceability or invent missing documents.
- Do not write findings outside `artifacts/validation/<worker_id>/` partition.
- Do not emit gate-shaped `gate-validation-report` from this worker (reporter emits `validation-report`).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
