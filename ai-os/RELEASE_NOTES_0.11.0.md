# AIOS Release Notes — 0.11.0

**Date:** 2026-08-01  
**Phase:** Sprint 11 Runtime Engine  
**Scope:** `pipelines/runtime-engine/`, `runtime/`, fifteen runtime workers, schemas, registries, command registry, default `.ai-os.yaml`

## Summary

Introduces the **Runtime Engine** — the execution layer that coordinates Workers, Validators, Reviewers, and Pipelines via a first-class single-command UX. Packaging only: **workers are not executed**.

## First-class UX

```
@Run full
@Run incremental
@Run review
@Run validate
@Run benchmark
@Run resume
@Run retry
@Run freeze
@Run status
@Run phase 1
```

End users never manually invoke individual workers during normal operation.

## Components (15 workers · 7 waves)

| Worker | Purpose |
|--------|---------|
| `runtime-configuration-loader` | Load `.ai-os.yaml` / `run.yaml` / `workspace.yaml` / env / defaults |
| `event-bus` | Runtime lifecycle events |
| `logging-engine` | Structured execution / worker / gate / failure logs |
| `command-interpreter` | Parse `@Run …` into run intents |
| `dependency-resolver` | Worker/artifact/pipeline deps; reject cycles |
| `execution-context-manager` | Phase, state, memory, shared context |
| `artifact-manager` | Artifact track / version / lifecycle / ownership |
| `execution-planner` | Pre-exec graph + plans — **never executes immediately** |
| `checkpoint-manager` | Phase / validation / retry / freeze checkpoints + rollback |
| `progress-tracker` | Progress, ETA, quality status |
| `worker-scheduler` | Select / order / dedupe / priority / concurrency |
| `retry-engine` | Retry worker/phase/validation/review with limits |
| `resume-engine` | Resume from checkpoint / failed worker / phase / interrupt |
| `pipeline-engine` | Sequential / parallel / conditional / dynamic / resume / incremental |
| `master-orchestrator` | Single entry point + execution summary |

## Output layout

```
runtime/
├── orchestrator/
├── execution/
├── commands/          # command-registry.json
├── state/
├── logs/
├── events/
├── configs/           # .ai-os.yaml, run.yaml, workspace.yaml
├── checkpoint/
├── resume/
├── scheduler/
└── templates/
```

## Artifact types

- `runtime-status`, `runtime-event`, `runtime-log`, `runtime-command`
- `runtime-plan`, `runtime-checkpoint`, `runtime-execution-report`
- `gate-runtime-report`

## Compatibility

- Prior pipelines and workers unchanged (read-only consumes)
- Pipeline id `runtime-engine`; 15 new worker ids only
- Orchestrate-only: never mutate workers/validators/reviewers

## Verification

```bash
npm run aios:runtime-engine:smoke
npm run aios:qualification-framework:smoke
npm run aios:framework-generator:smoke
npm run aios:discovery:smoke
```

Workers were **not** executed. No project was analyzed.
