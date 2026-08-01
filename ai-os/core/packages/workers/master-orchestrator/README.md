# Worker — `master-orchestrator`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-execution-report`

## Mission

Single entry point: load config/pipeline/workers, resolve deps, drive pipeline engine, handle failures/retries/resume, freeze phases, produce execution summary. End users invoke only @Run commands — never individual workers.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `master-orchestrator` |
| Pipeline | `runtime-engine` |
| Skill | `master-orchestrator` |
| Partition | `runtime/orchestrator/master-orchestrator/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

## Produces

`runtime/orchestrator/master-orchestrator/` → `runtime-execution-report`

## Modes

- Config
- Pipeline
- Workers
- Deps
- Execute
- Failure
- Retry
- Resume
- Freeze
- Summary

## References

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
