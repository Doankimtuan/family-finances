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

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

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

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
