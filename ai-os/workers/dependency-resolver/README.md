# Worker — `dependency-resolver`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-status`

## Mission

Resolve worker, artifact, pipeline, and execution dependencies; reject circular dependencies. Never modify dependency graphs on disk.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `dependency-resolver` |
| Pipeline | `runtime-engine` |
| Skill | `dependency-resolver` |
| Partition | `runtime/scheduler/dependency-resolver/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/scheduler/dependency-resolver/` → `runtime-status`

## Modes

- Worker Deps
- Artifact Deps
- Pipeline Deps
- Execution Deps
- Circular Rejection

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
