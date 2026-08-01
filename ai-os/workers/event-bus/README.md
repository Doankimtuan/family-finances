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

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/events/event-bus/` → `runtime-event`

## Modes

- Worker Events
- Validation Events
- Review Events
- Phase Events
- Execution Events

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
