---
name: validation-orchestrator
description: Record pipeline-wave order, merge partitioned findings, emit overall validation-status. Never modify artifacts.
---

# Validation Orchestrator

> Never modify source artifacts. Never invent missing information. Report structured findings only. Packaging only — do not execute unless a later phase opens execute.

## Consumes

`core/packages/schemas/`, `artifacts/` (soft), `core/packages/workers/`, `core/packages/pipelines/`, `artifacts/execution/` (soft), `core/packages/templates/`, `artifacts/knowledge/` (soft), `artifacts/validation/`, `artifacts/scores/`

## Produces

`artifacts/validation/` → `validation-status` (merge of `artifacts/validation/*/`; does not rewrite finding files)

## Ownership

### Owns
- `plan` / `order` — **record** `pipeline.json` waves (waves own order; orchestrator does not re-plan)
- `merge` — glob `artifacts/validation/*/…` findings + cite `artifacts/scores/`; emit merge summary evidence
- `overall-status` — aggregate pass/fail/warn counts (no mutation of finding files)
- `incremental` / `partial` — echo `extensions.validation_scope` when scoped

**Does not:** invent findings; rewrite validator outputs; change wave order.

## Procedure

1. Read `core/packages/pipelines/validation-engine/pipeline.json` waves → emit `plan`/`order` mirroring waves.
2. Glob `artifacts/validation/<worker_id>/**` findings; cite paths in `merge` evidence.
3. Aggregate counts → `overall-status`.
4. Echo partial/incremental scope flags. Write `validation-status` under `artifacts/validation/` (orchestrator id folder optional).

## Heuristics

- Prefer path/schema evidence; fail closed on critical contract breaks.
- Partial runs must emit unknowns for skipped targets.
- Respect RACI — do not duplicate another validator's kinds.
- `result` is authoritative; never use entry_kind `pass`/`fail`.

## Done when

- Entries include plan, order, merge, overall-status (partial/incremental when scoped)
- Merge evidence lists partition paths

## Negative examples

- Do not rewrite core/packages/schemas/workers/packs to “fix” findings.
- Do not fabricate traceability or invent missing documents.
- Do not write findings outside `artifacts/validation/<worker_id>/` partition.
- Do not emit gate-shaped `gate-validation-report` from this worker (reporter emits `validation-report`).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
