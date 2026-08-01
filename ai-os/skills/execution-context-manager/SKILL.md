---
name: execution-context-manager
description: Maintain current phase, completed workers, execution state, temporary memory, shared context, worker outputs, and global variables. Orchestration state only.
---

# Execution Context Manager

> Orchestrate only. Never modify workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`, `registry/`

## Produces

`runtime/state/execution-context-manager/` → `runtime-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `current-phase` | Owned per RACI |
| `completed-workers` | Owned per RACI |
| `execution-state` | Owned per RACI |
| `temporary-memory` | Owned per RACI |
| `shared-context` | Owned per RACI |
| `worker-outputs` | Owned per RACI |
| `global-variables` | Owned per RACI |

See `pipelines/runtime-engine/RACI.md`.

## Procedure

1. Initialize execution-state from normalized-config + command intent.
2. Track current-phase, completed-workers, worker-outputs, globals.
3. Isolate temporary-memory per run id; shared-context is read-mostly.
4. Persist state plans under `runtime/state/` only.
5. Seven entry_kinds required.

## Heuristics

- Prefer registry/path evidence; mark gaps `UNKNOWN: …`.
- Deterministic plans; reproducible given same config + command.
- Single-command UX: never require users to invoke workers by id.
- Respect RACI; never duplicate another runtime worker's kinds.

## Done when

- All owned entry_kinds represented (or explicit UNKNOWN)
- Full payload fields + valid `folder_mirror`
- No worker/validator/reviewer mutation; no execution in packaging

## Negative examples

- Do not modify `workers/`, `validators/`, `reviewers/` implementations.
- Do not analyze product repositories or invent business specs.
- Do not execute pipelines in packaging milestone.
- Do not bypass Execution Planner for immediate execution.
