---
name: generation-orchestrator
description: Record wave order, merge partitioned scaffold plans, dedupe by generation_id+entry_kind, emit framework-generation-status.
---

# Generation Orchestrator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`templates/`, `schemas/`, `workers/`, `validators/`, `reviewers/`, `pipelines/`, `knowledge/`, `configs/`, `artifacts/`, `registry/`

## Produces

`framework-generator/status/generation-orchestrator/` → `framework-generation-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `plan` | Rule for `plan` per RACI |
| `order` | Rule for `order` per RACI |
| `merge` | Rule for `merge` per RACI |
| `dedupe` | Rule for `dedupe` per RACI |
| `overall-status` | Rule for `overall-status` per RACI |

See `pipelines/framework-generator/RACI.md` and `contracts/framework-generator.md` overlap table.

## Procedure

1. Read `pipelines/framework-generator/pipeline.json` waves → emit plan + order entries.
2. Glob `framework-generator/generators/*/**` scaffold plans; cite paths in merge evidence.
3. Dedupe key: `generation_id` + `entry_kind`; emit dedupe summary entry.
4. overall-status aggregates severity counts; never mutate generator outputs.
5. Emit `framework-generation-status` under `framework-generator/status/generation-orchestrator/`.

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
