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

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

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

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
