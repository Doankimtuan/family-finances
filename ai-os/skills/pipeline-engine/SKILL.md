---
name: pipeline-engine
description: Execute execution graphs: sequential, parallel, conditional, dynamic, resume, and incremental modes. Orchestration only — never implement business analysis.
---

# Pipeline Engine

> Orchestrate only. Never modify core/packages/workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`, `core/packages/registry/`

## Produces

`runtime/execution/pipeline-engine/` → `runtime-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `sequential-execution` | Owned per RACI |
| `parallel-execution` | Owned per RACI |
| `conditional-execution` | Owned per RACI |
| `dynamic-execution` | Owned per RACI |
| `resume-execution` | Owned per RACI |
| `incremental-execution` | Owned per RACI |

See `core/packages/pipelines/runtime-engine/RACI.md`.

## Procedure

1. Consume scheduler + retry + resume + progress + logging plans.
2. Support sequential/parallel/conditional/dynamic/resume/incremental execution modes.
3. Drive core/packages/validators/reviewers as gates declared by target pipeline — never rewrite them.
4. Six execution entry_kinds required.
5. Never analyze projects or generate product artifacts.

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
