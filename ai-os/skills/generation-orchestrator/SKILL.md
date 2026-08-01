---
name: generation-orchestrator
description: Record wave order, merge partitioned scaffold plans, dedupe by generation_id+entry_kind, emit framework-generation-status.
---

# Generation Orchestrator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/status/generation-orchestrator/` → `framework-generation-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `plan` | Rule for `plan` per RACI |
| `order` | Rule for `order` per RACI |
| `merge` | Rule for `merge` per RACI |
| `dedupe` | Rule for `dedupe` per RACI |
| `overall-status` | Rule for `overall-status` per RACI |

See `core/packages/pipelines/framework-generator/RACI.md` and `core/packages/contracts/framework-generator.md` overlap table.

## Procedure

1. Read `core/packages/pipelines/framework-generator/pipeline.json` waves → emit plan + order entries.
2. Glob `core/packages/scaffold/generators/*/**` scaffold plans; cite paths in merge evidence.
3. Dedupe key: `generation_id` + `entry_kind`; emit dedupe summary entry.
4. overall-status aggregates severity counts; never mutate generator outputs.
5. Emit `framework-generation-status` under `core/packages/scaffold/status/generation-orchestrator/`.

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
