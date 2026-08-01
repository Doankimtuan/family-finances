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

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

## Produces

`runtime/scheduler/worker-scheduler/` → `runtime-status`

## Modes

- Select
- Order
- Dedupe
- Priority
- Concurrency

## References

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
