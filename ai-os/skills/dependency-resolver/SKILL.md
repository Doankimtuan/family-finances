---
name: dependency-resolver
description: Resolve worker, artifact, pipeline, and execution dependencies; reject circular dependencies. Never modify dependency graphs on disk.
---

# Dependency Resolver

> Orchestrate only. Never modify workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`, `registry/`

## Produces

`runtime/scheduler/dependency-resolver/` → `runtime-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `worker-dependency` | Owned per RACI |
| `artifact-dependency` | Owned per RACI |
| `pipeline-dependency` | Owned per RACI |
| `execution-dependency` | Owned per RACI |
| `circular-rejection` | Owned per RACI |

See `pipelines/runtime-engine/RACI.md`.

## Procedure

1. Soft-read `pipelines/*/dependency-graph.json` and registry workers.
2. Build worker/artifact/pipeline/execution dependency views.
3. Detect cycles; emit circular-rejection as critical fail when found.
4. Never rewrite dependency graphs on disk in packaging.
5. Five entry_kinds required.

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
