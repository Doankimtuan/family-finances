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

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

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

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
