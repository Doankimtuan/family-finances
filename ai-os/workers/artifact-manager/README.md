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

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/execution/artifact-manager/` → `runtime-status`

## Modes

- Track
- Version
- Lifecycle
- Ownership
- Dependencies

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
