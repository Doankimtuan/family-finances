# Capability — `runtime`

**Title:** Runtime  
**Pipeline:** `runtime-engine`  
**Board decision:** MERGE

## Purpose

Single-command orchestration: config, plan, schedule, execute, checkpoint, resume, retry

## @Run commands

- `@Run full`
- `@Run incremental`
- `@Run resume`
- `@Run retry`
- `@Run validate`
- `@Run review`
- `@Run benchmark`
- `@Run status`
- `@Run freeze`

## Implementation workers (packaging detail)

- `runtime-configuration-loader`
- `event-bus`
- `logging-engine`
- `command-interpreter`
- `dependency-resolver`
- `execution-context-manager`
- `artifact-manager`
- `execution-planner`
- `checkpoint-manager`
- `progress-tracker`
- `worker-scheduler`
- `retry-engine`
- `resume-engine`
- `pipeline-engine`
- `master-orchestrator`

## Future simplification

4 subsystems: config-commands, planning, resilience(checkpoint+retry+resume), execute

