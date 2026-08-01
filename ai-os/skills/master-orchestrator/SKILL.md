---
name: master-orchestrator
description: Single entry point: load config/pipeline/workers, resolve deps, drive pipeline engine, handle failures/retries/resume, freeze phases, produce execution summary. End users invoke only @Run commands — never individual workers.
---

# Master Orchestrator

> Orchestrate only. Never modify workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`, `registry/`

## Produces

`runtime/orchestrator/master-orchestrator/` → `runtime-execution-report` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `load-config` | Owned per RACI |
| `load-pipeline` | Owned per RACI |
| `load-workers` | Owned per RACI |
| `resolve-dependencies` | Owned per RACI |
| `execute-pipeline` | Owned per RACI |
| `handle-failure` | Owned per RACI |
| `handle-retry` | Owned per RACI |
| `handle-resume` | Owned per RACI |
| `freeze-phase` | Owned per RACI |
| `execution-summary` | Owned per RACI |

See `pipelines/runtime-engine/RACI.md`.

## Procedure

1. Single entry: accept runtime-command from command-interpreter.
2. Load config → plan → pipeline-engine; handle failure/retry/resume; freeze phases.
3. Discover workers/validators/reviewers via registry soft-reads.
4. Produce execution-summary / runtime-execution-report under `runtime/orchestrator/`.
5. End user never manually invokes individual workers; ten entry_kinds required.
6. Packaging: plans only — do not execute any worker.

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
