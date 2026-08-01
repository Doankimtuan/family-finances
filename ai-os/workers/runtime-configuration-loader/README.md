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

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/configs/runtime-configuration-loader/` → `runtime-status`

## Modes

- .ai-os.yaml
- run.yaml
- workspace.yaml
- Environment Variables
- Defaults

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
