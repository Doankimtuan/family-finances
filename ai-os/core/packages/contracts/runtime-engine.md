# Runtime Engine Contract

**Version:** 0.11.0 · **Pipeline:** `runtime-engine`

## Invariants

1. **Orchestrate only** — never modify worker, validator, or reviewer implementations.
2. **No product analysis** — never analyze repositories or generate business specs.
3. **No worker execution** in packaging milestone.
4. **Plan before execute** — Execution Planner never executes immediately.
5. **Single-command UX** — end users invoke `@Run …` only; never individual workers.
6. **Valid waves** — topological partition of the hard dependency graph.
7. **Deterministic / resumable** — support interruption, resume, incremental, retry.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`, `core/packages/registry/`

## Produces

`runtime/` (orchestrator, execution, commands, state, logs, events, configs, checkpoint, resume, scheduler, templates)

## Artifact types

- `runtime-status` — context, progress, scheduler status
- `runtime-event` — event bus events
- `runtime-log` — structured logs
- `runtime-command` — parsed @Run intents
- `runtime-plan` — execution plans (pre-exec)
- `runtime-checkpoint` — checkpoint / rollback plans
- `runtime-execution-report` — master orchestrator summary
- `gate-runtime-report` — gate envelope

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

## Default configuration

See `runtime/configs/.ai-os.yaml`.

## Execution model

User Request → Command Interpreter → Execution Planner → Master Orchestrator → Pipeline Engine → Worker Scheduler → Workers → Validators → Reviewers → Checkpoint → Next Phase → Completed
