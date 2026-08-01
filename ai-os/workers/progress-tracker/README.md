# Worker — `progress-tracker`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-status`

## Mission

Track overall progress, current phase, worker status, execution time, ETA, generated artifacts, and quality status.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `progress-tracker` |
| Pipeline | `runtime-engine` |
| Skill | `progress-tracker` |
| Partition | `runtime/state/progress-tracker/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/state/progress-tracker/` → `runtime-status`

## Modes

- Overall
- Phase
- Worker Status
- Time
- ETA
- Artifacts
- Quality

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
