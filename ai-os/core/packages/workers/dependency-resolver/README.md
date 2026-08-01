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

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

## Produces

`runtime/scheduler/dependency-resolver/` → `runtime-status`

## Modes

- Worker Deps
- Artifact Deps
- Pipeline Deps
- Execution Deps
- Circular Rejection

## References

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
