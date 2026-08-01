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

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

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

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
