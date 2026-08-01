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

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`

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

- `core/packages/contracts/runtime-engine.md`
- `core/packages/pipelines/runtime-engine/`
- `core/packages/schemas/runtime-engine-payload.schema.json`
