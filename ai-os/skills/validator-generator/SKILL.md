---
name: validator-generator
description: Generate validator packages (artifact, schema, traceability, dependency, completeness, consistency, quality checks).
---

# Validator Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/generators/validator-generator/` → `framework-generation` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `artifact-validation` | Rule for `artifact-validation` per RACI |
| `schema-validation` | Rule for `schema-validation` per RACI |
| `traceability-validation` | Rule for `traceability-validation` per RACI |
| `dependency-validation` | Rule for `dependency-validation` per RACI |
| `completeness-validation` | Rule for `completeness-validation` per RACI |
| `consistency-validation` | Rule for `consistency-validation` per RACI |
| `quality-validation` | Rule for `quality-validation` per RACI |

See `core/packages/pipelines/framework-generator/RACI.md` and `core/packages/contracts/framework-generator.md` overlap table.

## Procedure

1. Require planned worker id from spec or upstream worker-generator evidence.
2. For each validation mode, plan `core/packages/validators/<id>/manifest.json` + SPEC.md from `core/packages/templates/validation/`.
3. Map entry_kind → check_id list; cite `core/packages/schemas/validator-spec.schema.json`.
4. Seven validation modes must appear as entries or explicit UNKNOWN.
5. Never plan reviewer rubrics or worker skills.

## Heuristics

- Reuse `core/packages/templates/` packs; never duplicate template file contents in plans.
- Every `output_plan` requires `artifacts`, `registries`, `semver`; add `migration` when breaking.
- Mark skipped modes `UNKNOWN: …`; never invent spec fields.
- Dedupe key for orchestrator: `generation_id` + `entry_kind`.

## Done when

- All owned entry_kinds represented (or explicit UNKNOWN per mode)
- Full payload fields + valid `folder_mirror`
- No source mutation; `execute_generation` remains false

## Negative examples

- Do not modify prior sprint workers or registries on disk.
- Do not create project-specific business workers.
- Do not emit kinds owned by another generator (RACI violation).
