---
name: logging-engine
description: Plan structured execution, worker, validation, review, failure, and performance logs. Never modify worker implementations.
---

# Logging Engine

> Orchestrate only. Never modify core/packages/workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`, `core/packages/registry/`

## Produces

`runtime/logs/logging-engine/` → `runtime-log` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `execution-log` | Owned per RACI |
| `worker-log` | Owned per RACI |
| `validation-log` | Owned per RACI |
| `review-log` | Owned per RACI |
| `failure-log` | Owned per RACI |
| `performance-log` | Owned per RACI |

See `core/packages/pipelines/runtime-engine/RACI.md`.

## Procedure

1. Plan structured log sinks under `runtime/logs/` with correlation ids.
2. Map log kinds: execution, worker, validation, review, failure, performance.
3. Honor logging level from normalized-config (detailed|standard|minimal).
4. Never write into core/packages/workers/ or core/packages/validators/ trees.
5. Six log entry_kinds required.

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
