# Worker — `retry-engine`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-status`

## Mission

Plan retries for failed workers/phases/validation/review with updated context and retry limits from runtime config.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `retry-engine` |
| Pipeline | `runtime-engine` |
| Skill | `retry-engine` |
| Partition | `runtime/execution/retry-engine/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/execution/retry-engine/` → `runtime-status`

## Modes

- Retry Worker
- Retry Phase
- Retry Validation
- Retry Review
- Updated Context
- Limits

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
