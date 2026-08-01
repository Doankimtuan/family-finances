# Validation Engine Contract

Pipeline: `core/packages/pipelines/validation-engine/`  
RACI: `core/packages/pipelines/validation-engine/RACI.md`  
Version: packaging **0.7.1** (Board HOLD remediation)

## Invariants

1. Validation components **never modify** source artifacts.
2. Validation components **never invent** missing information — report `UNKNOWN:` / fail findings only.
3. Outputs are structured `entries[]` with: validation_id, target, rule, result, evidence, severity, recommendation, confidence, traceability, unknowns, source_paths.
4. Finding writers require **`folder_mirror`** under `artifacts/validation/<worker_id>/`.
5. Support **partial** and **incremental** validation via `extensions.partial` / `extensions.incremental` + `extensions.validation_scope`.
6. Core loads/validates registration; Core does **not** execute Validation Engine workers in the packaging milestone.
7. Feature Workers remain forbidden (`worker_class: discovery`).
8. `result` is authoritative — do not use `entry_kind` values `pass`/`fail`.

## Naming

| Artifact | Producer |
|----------|----------|
| `validation-finding` | specialized `*-validator` workers (partitioned) |
| `validation-status` | `validation-orchestrator` |
| `quality-scores` | `quality-scoring-engine` (9 dimensions + `score_value`) |
| `validation-report` | `validation-reporter` |
| `gate-validation-report` | `core/packages/validators/validation-engine-schema-check` (and other gate packages) |

Worker ids like `schema-validator` are **not** the same as gate package ids like `validation-engine-schema-check`.

## Produces

| Folder | Type |
|--------|------|
| `artifacts/validation/<worker_id>/` | `validation-finding` |
| `artifacts/validation/` | `validation-status` (orchestrator merge) |
| `artifacts/scores/` | `quality-scores` |
| `artifacts/reports/` | `validation-report` |
| `governance/quality/validation-scorecard/` | optional mirror (does not overwrite SA quality-notes) |

## Consumes

Hard/soft as declared per worker: `core/packages/schemas/`, `artifacts/`, `core/packages/workers/`, `core/packages/pipelines/`, `artifacts/execution/`, `core/packages/templates/`, `artifacts/knowledge/`, **`core/packages/registry/`**, plus for trace/complete/consistency: `artifacts/features/`, `artifacts/business/`, `artifacts/requirements/`, `artifacts/acceptance/`, `artifacts/product-architecture/`, `artifacts/architecture-v2/`, `artifacts/specifications/`. Scoring/orchestrator/reporter also consume `artifacts/validation/` and/or `artifacts/scores/`.

## Order

`pipeline.json` **waves** own execution order. Orchestrator records order + merges partitions; it does not re-plan waves.

## PASS/FAIL

Reporter `decision`: **FAIL** if any merged finding has `result=fail` and `severity=critical`; else **PASS**.
