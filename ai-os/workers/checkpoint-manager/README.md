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

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/checkpoint/checkpoint-manager/` → `runtime-checkpoint`

## Modes

- Before Phase
- After Validation
- Before Retry
- Before Freeze
- Rollback

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
