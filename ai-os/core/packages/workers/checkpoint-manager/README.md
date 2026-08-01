# Worker — `checkpoint-manager`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-checkpoint`

## Mission

Plan checkpoints before every phase, after validation, before retries, before freeze; support rollback. Never modify workers.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `checkpoint-manager` |
| Pipeline | `runtime-engine` |
| Skill | `checkpoint-manager` |
| Partition | `runtime/checkpoint/checkpoint-manager/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

## Produces

`runtime/checkpoint/checkpoint-manager/` → `runtime-checkpoint`

## Modes

- Before Phase
- After Validation
- Before Retry
- Before Freeze
- Rollback

## References

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
