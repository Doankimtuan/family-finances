---
name: worker-scheduler
description: Select workers, resolve execution order, prevent duplicated execution, support priorities and concurrency. Never implement worker logic.
---

# Worker Scheduler

> Orchestrate only. Never modify core/packages/workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`, `core/packages/registry/`

## Produces

`runtime/scheduler/worker-scheduler/` → `runtime-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `worker-selection` | Owned per RACI |
| `execution-order` | Owned per RACI |
| `dedupe-guard` | Owned per RACI |
| `priority` | Owned per RACI |
| `concurrency` | Owned per RACI |

See `core/packages/pipelines/runtime-engine/RACI.md`.

## Procedure

1. From execution-plan worker-order, select runnable workers.
2. Apply priority + concurrency from config (parallelWorkers).
3. Dedupe-guard prevents duplicate claims for same worker+task.
4. Never implement worker business logic.
5. Five entry_kinds required.

## Heuristics

- Prefer core/packages/registry/path evidence; mark gaps `UNKNOWN: …`.
- Deterministic plans; reproducible given same config + command.
- Single-command UX: never require users to invoke workers by id.
- Respect RACI; never duplicate another runtime worker's kinds.

## Done when

- All owned entry_kinds represented (or explicit UNKNOWN)
- Full payload fields + valid `folder_mirror`
- No worker/validator/reviewer mutation; no execution in packaging

## Negative examples

- Do not modify `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/` implementations.
- Do not analyze product repositories or invent business specs.
- Do not execute pipelines in packaging milestone.
- Do not bypass Execution Planner for immediate execution.
