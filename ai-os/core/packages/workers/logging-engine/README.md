# Worker — `logging-engine`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-log`

## Mission

Plan structured execution, worker, validation, review, failure, and performance logs. Never modify worker implementations.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `logging-engine` |
| Pipeline | `runtime-engine` |
| Skill | `logging-engine` |
| Partition | `runtime/logs/logging-engine/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

## Produces

`runtime/logs/logging-engine/` → `runtime-log`

## Modes

- Execution Logs
- Worker Logs
- Validation Logs
- Review Logs
- Failure Logs
- Performance Logs

## References

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
