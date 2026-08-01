# Worker — `command-interpreter`

> **Pipeline:** `runtime-engine` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `runtime-command`

## Mission

Parse single-command UX (@Run full|incremental|phase N|resume|retry|validate|review|freeze|status|benchmark) into normalized run intents. Never invoke workers directly.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `command-interpreter` |
| Pipeline | `runtime-engine` |
| Skill | `command-interpreter` |
| Partition | `runtime/commands/command-interpreter/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`runtime/commands/command-interpreter/` → `runtime-command`

## Modes

- @Run full
- @Run incremental
- @Run phase
- @Run resume
- @Run retry
- @Run validate
- @Run review
- @Run freeze
- @Run status
- @Run benchmark

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
