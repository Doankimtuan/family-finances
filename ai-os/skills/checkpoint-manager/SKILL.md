---
name: checkpoint-manager
description: Plan checkpoints before every phase, after validation, before retries, before freeze; support rollback. Never modify workers.
---

# Checkpoint Manager

> Orchestrate only. Never modify core/packages/workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`, `core/packages/registry/`

## Produces

`runtime/checkpoint/checkpoint-manager/` → `runtime-checkpoint` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `phase-checkpoint` | Owned per RACI |
| `validation-checkpoint` | Owned per RACI |
| `retry-checkpoint` | Owned per RACI |
| `freeze-checkpoint` | Owned per RACI |
| `rollback-plan` | Owned per RACI |

See `core/packages/pipelines/runtime-engine/RACI.md`.

## Procedure

1. Plan checkpoints before phase, after validation, before retry/freeze.
2. Include rollback-plan referencing checkpoint ids.
3. Store plans under `runtime/checkpoint/`.
4. Never mutate worker packages to create checkpoints.
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
