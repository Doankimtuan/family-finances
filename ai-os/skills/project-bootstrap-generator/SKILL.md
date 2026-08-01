---
name: project-bootstrap-generator
description: Bootstrap full AI OS projects: repo init, folders, worker/pipeline registration patches, configs, default templates.
---

# Project Bootstrap Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`templates/`, `schemas/`, `workers/`, `validators/`, `reviewers/`, `pipelines/`, `knowledge/`, `configs/`, `artifacts/`, `registry/`

## Produces

`framework-generator/generators/project-bootstrap-generator/` → `framework-generation` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `repo-init` | Rule for `repo-init` per RACI |
| `folder-scaffold` | Rule for `folder-scaffold` per RACI |
| `worker-registration` | Rule for `worker-registration` per RACI |
| `pipeline-registration` | Rule for `pipeline-registration` per RACI |
| `config-generation` | Rule for `config-generation` per RACI |
| `default-templates` | Rule for `default-templates` per RACI |

See `pipelines/framework-generator/RACI.md` and `contracts/framework-generator.md` overlap table.

## Procedure

1. Aggregate plans from all upstream generators (glob `framework-generator/generators/*/`).
2. Plan repo-init + folder-scaffold from `framework-generator/scaffolding/`.
3. Sole owner of worker-registration + pipeline-registration registry patch plans under `framework-generator/registries/`.
4. config-generation emits `configs/` starter files; default-templates copies from `templates/`.
5. Emit six entry_kinds minimum for full bootstrap spec.

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
