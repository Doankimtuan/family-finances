# Worker — `execution-context-manager`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-status`

## Mission

Maintain current phase, completed workers, execution state, temporary memory, shared context, worker outputs, and global variables. Orchestration state only.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `execution-context-manager` |
| Pipeline | `runtime-engine` |
| Skill | `execution-context-manager` |
| Partition | `runtime/state/execution-context-manager/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/state/execution-context-manager/` → `runtime-status`

## Modes

- Phase
- Completed Workers
- State
- Memory
- Shared Context
- Outputs
- Globals

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
