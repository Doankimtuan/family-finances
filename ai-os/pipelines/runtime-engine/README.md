# Runtime Engine Pipeline

**Version:** 0.1.0 · **Workers:** 15 · **Waves:** 7

Single-command orchestration of AIOS. Packaging only — **do not execute workers**.

## Workers

- `runtime-configuration-loader` — Runtime Configuration Loader
- `event-bus` — Event Bus
- `logging-engine` — Logging Engine
- `command-interpreter` — Command Interpreter
- `dependency-resolver` — Dependency Resolver
- `execution-context-manager` — Execution Context Manager
- `artifact-manager` — Artifact Manager
- `execution-planner` — Execution Planner
- `checkpoint-manager` — Checkpoint Manager
- `progress-tracker` — Progress Tracker
- `worker-scheduler` — Worker Scheduler
- `retry-engine` — Retry Engine
- `resume-engine` — Resume Engine
- `pipeline-engine` — Pipeline Engine
- `master-orchestrator` — Master Orchestrator

## Commands

- `@Run full`
- `@Run incremental`
- `@Run phase 1`
- `@Run phase 2`
- `@Run resume`
- `@Run retry`
- `@Run validate`
- `@Run review`
- `@Run freeze`
- `@Run status`
- `@Run benchmark`

## Verification

```bash
npm run aios:runtime-engine:smoke
```
