# Worker — `pipeline-engine`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-status`

## Mission

Execute execution graphs: sequential, parallel, conditional, dynamic, resume, and incremental modes. Orchestration only — never implement business analysis.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `pipeline-engine` |
| Pipeline | `runtime-engine` |
| Skill | `pipeline-engine` |
| Partition | `runtime/execution/pipeline-engine/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

## Produces

`runtime/execution/pipeline-engine/` → `runtime-status`

## Modes

- Sequential
- Parallel
- Conditional
- Dynamic
- Resume
- Incremental

## References

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
