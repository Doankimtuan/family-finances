# Worker — `execution-planner`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-plan`

## Mission

Before execution, generate execution graph, worker order, estimated outputs/runtime, validation/review/checkpoint plans. Never execute immediately.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `execution-planner` |
| Pipeline | `runtime-engine` |
| Skill | `execution-planner` |
| Partition | `runtime/execution/execution-planner/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/execution/execution-planner/` → `runtime-plan`

## Modes

- Execution Graph
- Worker Order
- Estimates
- Validation Plan
- Review Plan
- Checkpoint Plan

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
