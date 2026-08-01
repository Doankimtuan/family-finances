---
name: schema-generator
description: Generate JSON Schemas, markdown templates, configuration schemas, validation schemas, and artifact schemas from capability specs.
---

# Schema Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`templates/`, `schemas/`, `workers/`, `validators/`, `reviewers/`, `pipelines/`, `knowledge/`, `configs/`, `artifacts/`, `registry/`

## Produces

`framework-generator/generators/schema-generator/` → `framework-generation` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `json-schema` | Rule for `json-schema` per RACI |
| `config-schema` | Rule for `config-schema` per RACI |
| `validation-schema` | Rule for `validation-schema` per RACI |
| `artifact-schema` | Rule for `artifact-schema` per RACI |
| `markdown-template` | Rule for `markdown-template` per RACI |

See `pipelines/framework-generator/RACI.md` and `contracts/framework-generator.md` overlap table.

## Procedure

1. Parse `generation-spec` (`capability`, `target_generator`, `modes[]`).
2. Map each mode to schema template under `templates/` + `$ref` targets in `schemas/common.schema.json`.
3. Plan `json-schema` / `config-schema` / `validation-schema` / `artifact-schema` / `markdown-template` entries.
4. Emit one entry per owned entry_kind (or UNKNOWN for out-of-scope modes).
5. `output_plan.artifacts` lists planned schema paths; `output_plan.registries` must include `schemas`.

## Heuristics

- Reuse `templates/` packs; never duplicate template file contents in plans.
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
