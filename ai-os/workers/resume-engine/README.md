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

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/resume/resume-engine/` → `runtime-status`

## Modes

- Latest Checkpoint
- Failed Worker
- Failed Phase
- Interrupted

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
