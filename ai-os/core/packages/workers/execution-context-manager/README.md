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

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

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

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
