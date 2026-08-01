---
name: project-bootstrap-generator
description: Bootstrap full AI OS projects: repo init, folders, worker/pipeline registration patches, configs, default templates.
---

# Project Bootstrap Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/generators/project-bootstrap-generator/` → `framework-generation` (required `folder_mirror` under partition)

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

See `core/packages/pipelines/framework-generator/RACI.md` and `core/packages/contracts/framework-generator.md` overlap table.

## Procedure

1. Aggregate plans from all upstream generators (glob `core/packages/scaffold/generators/*/`).
2. Plan repo-init + folder-scaffold from `core/packages/scaffold/scaffolding/`.
3. Sole owner of worker-registration + pipeline-registration registry patch plans under `core/packages/scaffold/registries/`.
4. config-generation emits `core/packages/configs/` starter files; default-templates copies from `core/packages/templates/`.
5. Emit six entry_kinds minimum for full bootstrap spec.

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
