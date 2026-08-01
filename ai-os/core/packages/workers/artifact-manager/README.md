# Worker — `artifact-manager`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-status`

## Mission

Track generated artifacts, versions, lifecycle, ownership, and dependencies during runtime. Never invent business artifacts.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `artifact-manager` |
| Pipeline | `runtime-engine` |
| Skill | `artifact-manager` |
| Partition | `runtime/execution/artifact-manager/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

## Produces

`runtime/execution/artifact-manager/` → `runtime-status`

## Modes

- Track
- Version
- Lifecycle
- Ownership
- Dependencies

## References

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
