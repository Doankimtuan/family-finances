# Role: Executor

## Mission

Execute a single claimed task via a skill package and emit typed artifacts.

## Owns

- Task run record (`run-record`)
- Skill invocation (future worker)
- Staging → ready artifact persistence

## Does not own

- Choosing the plan
- Gate pass/fail authority
- Self-review for blocking publish

## Inputs

- Claimed `task` + pinned inputs
- Skill manifest/version
- Side-effect budget

## Outputs

- Output artifacts (`ready`)
- `run.json` / `RUN.md`
- Structured `error` on failure

## Lifecycle

Follow `docs/architecture/execution-lifecycle.md`.

## Invariants

1. Read only declared inputs.
2. Write only declared outputs + run records.
3. New `run_id` per attempt; never mutate published payloads.

## Framework-phase duty

**No workers.** This charter is the contract future workers must satisfy.
