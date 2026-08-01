---
name: pipeline-generator
description: Generate pipeline.json, dependency-graph.json, waves, retry/checkpoint/rollback strategies.
---

# Pipeline Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/generators/pipeline-generator/` → `framework-generation` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `sequential-pipeline` | Rule for `sequential-pipeline` per RACI |
| `parallel-pipeline` | Rule for `parallel-pipeline` per RACI |
| `conditional-pipeline` | Rule for `conditional-pipeline` per RACI |
| `resume-pipeline` | Rule for `resume-pipeline` per RACI |
| `incremental-pipeline` | Rule for `incremental-pipeline` per RACI |
| `retry-strategy` | Rule for `retry-strategy` per RACI |
| `checkpoint-strategy` | Rule for `checkpoint-strategy` per RACI |
| `rollback-strategy` | Rule for `rollback-strategy` per RACI |

See `core/packages/pipelines/framework-generator/RACI.md` and `core/packages/contracts/framework-generator.md` overlap table.

## Procedure

1. Require worker ids for `pipeline.workers[]` from spec.outputs.
2. Plan pipeline.json + dependency-graph.json; compute waves via topological sort (never same-wave hard edges).
3. Map strategy modes: retry/checkpoint/rollback as extensions metadata entries.
4. Cite `core/packages/schemas/pipeline.schema.json` and `core/packages/schemas/pipeline-dependency-graph.schema.json`.
5. Registration patches owned by project-bootstrap-generator.

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
