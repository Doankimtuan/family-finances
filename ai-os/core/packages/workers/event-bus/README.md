# Worker — `event-bus`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-event`

## Mission

Define and plan runtime events: WorkerStarted/Finished, Validation*, Review*, PhaseCompleted, CheckpointCreated, ExecutionCompleted/Failed. Never mutate workers.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `event-bus` |
| Pipeline | `runtime-engine` |
| Skill | `event-bus` |
| Partition | `runtime/events/event-bus/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

## Produces

`runtime/events/event-bus/` → `runtime-event`

## Modes

- Worker Events
- Validation Events
- Review Events
- Phase Events
- Execution Events

## References

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
