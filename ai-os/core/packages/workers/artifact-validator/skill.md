---
name: artifact-validator
description: Verify folder structure, required files, artifact existence, naming, output locations, and artifact contracts. Never modify artifacts.
---

# Artifact Validator

> Never modify source artifacts. Never invent missing information. Report structured findings only. Packaging only — do not execute unless a later phase opens execute.

## Consumes

`core/packages/schemas/`, `artifacts/` (soft), `core/packages/workers/`, `core/packages/pipelines/`, `artifacts/execution/` (soft), `core/packages/templates/`, `artifacts/knowledge/` (soft), `core/packages/registry/`

## Produces

`artifacts/validation/artifact-validator/` → `validation-finding` (required `folder_mirror`: `artifacts/validation/artifact-validator/…`)

## Ownership

### Rule catalog (owns)
| Kind | Rule |
|------|------|
| folder-structure | Declared produce/consume folders exist per manifests |
| required-files | Worker package files present |
| artifact-existence | Referenced paths resolve under ai-os/ |
| naming | kebab-id / art_* conventions |
| output-location | Outputs only under declared produce folders |
| artifact-contract | Artifact type matches registry |

**Does not own:** schema field typing; dependency edges. See `core/packages/pipelines/validation-engine/RACI.md`.

## Procedure

1. Load declared consume paths (honor `extensions.partial` / `incremental` + `validation_scope`).
2. Evaluate **only** owned rule kinds (RACI); skip others.
3. Emit entries with full fields + `folder_mirror` under `artifacts/validation/artifact-validator/`.
4. Mark gaps `UNKNOWN: …`. Never mutate sources.
5. Stop for artifacts/validation/review (`core/packages/validators/validation-engine-schema-check` → `gate-validation-report`).

## Heuristics

- Prefer path/schema evidence; fail closed on critical contract breaks.
- Partial runs must emit unknowns for skipped targets.
- Respect RACI — do not duplicate another validator's kinds.
- `result` is authoritative; never use entry_kind `pass`/`fail`.

## Done when

- ≥1 structured entry covering owned kinds (or explicit skip/UNKNOWN for scoped runs)
- Every entry has full fields + `folder_mirror` matching `artifacts/validation/artifact-validator/`
- No source mutation; no invented missing info; RACI respected

## Negative examples

- Do not rewrite core/packages/schemas/workers/packs to “fix” findings.
- Do not fabricate traceability or invent missing documents.
- Do not write findings outside `artifacts/validation/<worker_id>/` partition.
- Do not emit gate-shaped `gate-validation-report` from this worker (reporter emits `validation-report`).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
