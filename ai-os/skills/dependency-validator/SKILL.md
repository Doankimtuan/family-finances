---
name: dependency-validator
description: Verify worker/pipeline dependencies, detect circular and missing dependencies and invalid references. Never modify artifacts.
---

# Dependency Validator

> Never modify source artifacts. Never invent missing information. Report structured findings only. Packaging only — do not execute unless a later phase opens execute.

## Consumes

`schemas/`, `artifacts/` (soft), `workers/`, `pipelines/`, `execution/` (soft), `templates/`, `knowledge/` (soft)

## Produces

`validation/` → `validation-finding`

## Ownership

- **Owns:** worker-dependency, pipeline-dependency, circular, missing-dependency, invalid-reference…
- **Does not:** mutate sources; invent gaps; run business workers

## Procedure

1. Load declared consume paths (honor partial/incremental scopes).
2. Evaluate rules; emit entries with full validation fields.
3. Mark unknowns `UNKNOWN: …`.
4. Write `validation-finding` under produce folder(s) only.
5. Stop for validation/review.

## Heuristics

- Prefer path/schema evidence.
- Fail closed on orphans / critical contract breaks.
- Partial runs must emit unknowns for skipped targets.

## Done when

- ≥1 structured entry with full validation fields
- No source mutation; no invented missing info

## Negative examples

- Do not rewrite schemas/workers to “fix” findings.
- Do not fabricate traceability.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
