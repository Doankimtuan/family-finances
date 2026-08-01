---
name: resume-engine
description: Resume from latest checkpoint, failed worker, failed phase, or interrupted execution. Deterministic resume plans only in packaging.
---

# Resume Engine

> Orchestrate only. Never modify core/packages/workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`, `core/packages/registry/`

## Produces

`runtime/resume/resume-engine/` → `runtime-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `resume-checkpoint` | Owned per RACI |
| `resume-failed-worker` | Owned per RACI |
| `resume-failed-phase` | Owned per RACI |
| `resume-interrupted` | Owned per RACI |

See `core/packages/pipelines/runtime-engine/RACI.md`.

## Procedure

1. Locate latest checkpoint under `runtime/checkpoint/`.
2. Plan resume from checkpoint, failed worker, failed phase, or interrupted run.
3. Rebuild context via execution-context-manager plans — no re-analysis of product repos.
4. Four entry_kinds required.
5. Packaging sample shows resume-checkpoint plan only.

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
