# Worker — `retry-engine`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-status`

## Mission

Plan retries for failed core/packages/workers/phases/validation/review with updated context and retry limits from runtime config.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `retry-engine` |
| Pipeline | `runtime-engine` |
| Skill | `retry-engine` |
| Partition | `runtime/execution/retry-engine/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

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

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
