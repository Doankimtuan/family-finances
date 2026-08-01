# Worker — `runtime-configuration-loader`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-status`

## Mission

Load .ai-os.yaml, run.yaml, workspace.yaml, environment variables, and defaults into a normalized runtime config. Never execute workers.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `runtime-configuration-loader` |
| Pipeline | `runtime-engine` |
| Skill | `runtime-configuration-loader` |
| Partition | `runtime/configs/runtime-configuration-loader/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

## Produces

`runtime/configs/runtime-configuration-loader/` → `runtime-status`

## Modes

- .ai-os.yaml
- run.yaml
- workspace.yaml
- Environment Variables
- Defaults

## References

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
