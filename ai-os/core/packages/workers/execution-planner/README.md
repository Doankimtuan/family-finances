# Worker — `execution-planner`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-plan`

## Mission

Before execution, generate execution graph, worker order, estimated outputs/runtime, artifacts/validation/review/checkpoint plans. Never execute immediately.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `execution-planner` |
| Pipeline | `runtime-engine` |
| Skill | `execution-planner` |
| Partition | `runtime/execution/execution-planner/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

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

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
