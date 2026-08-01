# Worker — `resume-engine`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-status`

## Mission

Resume from latest checkpoint, failed worker, failed phase, or interrupted execution. Deterministic resume plans only in packaging.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `resume-engine` |
| Pipeline | `runtime-engine` |
| Skill | `resume-engine` |
| Partition | `runtime/resume/resume-engine/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

## Produces

`runtime/resume/resume-engine/` → `runtime-status`

## Modes

- Latest Checkpoint
- Failed Worker
- Failed Phase
- Interrupted

## References

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
