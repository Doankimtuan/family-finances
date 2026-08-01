---
name: event-bus
description: Define and plan runtime events: WorkerStarted/Finished, Validation*, Review*, PhaseCompleted, CheckpointCreated, ExecutionCompleted/Failed. Never mutate workers.
---

# Event Bus

> Orchestrate only. Never modify workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`, `registry/`

## Produces

`runtime/events/event-bus/` → `runtime-event` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `worker-started` | Owned per RACI |
| `worker-finished` | Owned per RACI |
| `validation-started` | Owned per RACI |
| `validation-finished` | Owned per RACI |
| `review-started` | Owned per RACI |
| `review-finished` | Owned per RACI |
| `phase-completed` | Owned per RACI |
| `checkpoint-created` | Owned per RACI |
| `execution-completed` | Owned per RACI |
| `execution-failed` | Owned per RACI |

See `pipelines/runtime-engine/RACI.md`.

## Procedure

1. Register event schema for the ten runtime event kinds.
2. Plan publish/subscribe paths under `runtime/events/` (JSONL/JSON).
3. Bind events to logging-engine and progress-tracker consumers (soft).
4. Never invent business events outside runtime lifecycle.
5. Ten event entry_kinds required.

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
