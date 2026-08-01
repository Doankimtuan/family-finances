# Worker — `worker-scheduler`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-status`

## Mission

Select workers, resolve execution order, prevent duplicated execution, support priorities and concurrency. Never implement worker logic.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `worker-scheduler` |
| Pipeline | `runtime-engine` |
| Skill | `worker-scheduler` |
| Partition | `runtime/scheduler/worker-scheduler/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/scheduler/worker-scheduler/` → `runtime-status`

## Modes

- Select
- Order
- Dedupe
- Priority
- Concurrency

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
