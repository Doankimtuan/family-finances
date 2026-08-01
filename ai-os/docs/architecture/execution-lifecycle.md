# Execution Lifecycle

## Scope

Lifecycle of a **single task run**. Orchestration of many tasks is covered in `orchestrator-lifecycle.md`.

Workers that perform steps below are **not implemented** in the framework phase. This document is the normative contract they must obey later.

## States

**RunStatus:** `pending` → `claimed` → `running` → (`succeeded` | `failed` | `cancelled`)

**RunPhase while running:** `claimed` → `preparing` → `executing` → `persisting` → `validating` → (`reviewing`) → `terminal`

`blocked` is a **task** status (unmet deps), never a run status.

## Steps

### 1. Pending

Task exists on an accepted plan. Hard dependencies unmet or wave not scheduled.

### 2. Claimed

Executor claims `task_id` with unique `run_id`.  
Write `runtime/runs/<run_id>/run.json` status `running`.

Claim rules:

- One active run per task unless task/run `allow_parallel_attempts: true`
- Claim includes skill id + skill version pin
- Write events to `events.jsonl` (`core/packages/schemas/run-event.schema.json`)

### 3. Preparing

1. Resolve inputs via dependency system.
2. Load skill manifest + schemas.
3. Verify side-effect permissions from orchestration policy.
4. Create staging artifact dirs as `draft`.

Fail here → `failed` with `phase: preparing`.

### 4. Executing

Skill body runs (future). Must only write to staging paths and declared outputs.

Heartbeat: append `events.jsonl` (`timestamp`, `event`, `detail`).

### 5. Persisting

1. Finalize payload bytes.
2. Compute `content_hash`.
3. Move artifacts `draft` → `ready`.
4. Update run record with output references.

### 6. Validating

Run required validators for output types.

- Any blocking `fail` → run `failed`; artifacts stay `ready` (not `published`)
- `warn` only → continue per policy

### 7. Reviewing (optional)

If plan/gate requires reviewer:

- Blocking fail → run `failed`
- Pass → continue

### 8. Terminal success

1. Publish artifacts (`ready` → `published`) when gates pass.
2. Mark run `succeeded`.
3. Notify orchestrator for downstream scheduling.

## Idempotency

- Re-run creates new `run_id`.
- May supersede prior artifacts (`artifact_version + 1`) or write new `artifact_id` per skill policy.
- Must not mutate published payloads in place.

## Cancellation

Orchestrator may signal cancel:

- Cooperative stop between steps
- Persist partial drafts as `draft` only
- Run status `cancelled`

## Minimum run record fields

See `core/packages/schemas/execution-run.schema.json`.

Required: `artifact_id` (run-record id), `task_id`, `skill_id`, `skill_version`, `status`, `started_at`, `inputs`, `outputs`, `gate_results`.
