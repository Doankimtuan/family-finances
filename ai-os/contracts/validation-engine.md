# Validation Engine Contract

Pipeline: `pipelines/validation-engine/`

## Invariants

1. Validation components **never modify** source artifacts (schemas, workers, knowledge, etc.).
2. Validation components **never invent** missing information — report `UNKNOWN:` / fail findings only.
3. Outputs are structured `entries[]` with: validation_id, target, rule, result, evidence, severity, recommendation, confidence, traceability.
4. Support **partial** and **incremental** validation via `extensions.partial` / `extensions.incremental`.
5. Core loads/validates registration; Core does **not** execute Validation Engine workers in the packaging milestone.
6. Feature Workers remain forbidden (`worker_class: discovery`).

## Produces

| Folder | Type |
|--------|------|
| `validation/` | `validation-finding`, `validation-status` |
| `scores/` | `quality-scores` |
| `reports/` | `validation-report` |
| `quality/validation-scorecard/` | optional mirror (does not overwrite SA quality-notes) |

## Consumes (soft/hard)

`schemas/`, `artifacts/` (→ runtime/artifacts), `workers/`, `pipelines/`, `execution/`, `templates/`, `knowledge/`
