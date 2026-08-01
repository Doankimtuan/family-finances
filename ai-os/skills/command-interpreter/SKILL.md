---
name: command-interpreter
description: Parse single-command UX (@Run full|incremental|phase N|resume|retry|validate|review|freeze|status|benchmark) into normalized run intents. Never invoke workers directly.
---

# Command Interpreter

> Orchestrate only. Never modify core/packages/workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`, `core/packages/registry/`

## Produces

`runtime/commands/command-interpreter/` → `runtime-command` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `run-full` | Owned per RACI |
| `run-incremental` | Owned per RACI |
| `run-phase` | Owned per RACI |
| `run-resume` | Owned per RACI |
| `run-retry` | Owned per RACI |
| `run-validate` | Owned per RACI |
| `run-review` | Owned per RACI |
| `run-freeze` | Owned per RACI |
| `run-status` | Owned per RACI |
| `run-benchmark` | Owned per RACI |

See `core/packages/pipelines/runtime-engine/RACI.md`.

## Procedure

1. Parse user command tokens (`@Run …`) into run intent + options.
2. Map to entry_kinds; reject unknown commands with fail result.
3. Single-command UX: user never names individual workers.
4. Emit runtime-command for master-orchestrator / execution-planner.
5. Ten command entry_kinds covered in catalog; sample covers primary set.

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
