---
name: progress-tracker
description: Track overall progress, current phase, worker status, execution time, ETA, generated artifacts, and quality status.
---

# Progress Tracker

> Orchestrate only. Never modify workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`, `registry/`

## Produces

`runtime/state/progress-tracker/` → `runtime-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `overall-progress` | Owned per RACI |
| `current-phase-status` | Owned per RACI |
| `worker-status` | Owned per RACI |
| `execution-time` | Owned per RACI |
| `estimated-completion` | Owned per RACI |
| `generated-artifacts` | Owned per RACI |
| `quality-status` | Owned per RACI |

See `pipelines/runtime-engine/RACI.md`.

## Procedure

1. Subscribe to event-bus kinds for status transitions.
2. Emit overall-progress, phase, worker-status, timing, ETA, artifacts, quality-status.
3. Quality status is orchestration-level (gate pending/pass/fail), not business QA.
4. Seven entry_kinds required.
5. Read-only against prior pipeline outputs.

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
