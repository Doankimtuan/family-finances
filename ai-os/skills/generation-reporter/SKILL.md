---
name: generation-reporter
description: Emit human-readable framework-generation-report and gate-framework-generation-report envelope from merged status.
---

# Generation Reporter

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/reports/generation-reporter/` → `framework-generation-report` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `summary` | Rule for `summary` per RACI |
| `critical-gaps` | Rule for `critical-gaps` per RACI |
| `overall-recommendation` | Rule for `overall-recommendation` per RACI |
| `gate-envelope` | Rule for `gate-envelope` per RACI |

See `core/packages/pipelines/framework-generator/RACI.md` and `core/packages/contracts/framework-generator.md` overlap table.

## Procedure

1. Consume merged `framework-generation-status` from orchestrator evidence.
2. Emit summary + critical-gaps + overall-recommendation entries.
3. gate-envelope entry wraps report metadata for `gate-framework-generation-report` type.
4. Never execute generation or write registry files.
5. Partition under `core/packages/scaffold/reports/generation-reporter/`.

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
