# Orchestrator Lifecycle

## Purpose

Own the control plane: accept goals, commission plans, schedule waves, enforce gates, handle failures, and decide ship vs retry vs abort.

## States

```
idle → accepting → planning → scheduled → running → gating → settling → succeeded|failed|aborted|superseded
```

Per-orchestration status in `orchestration-state` artifact. Terminal statuses are `succeeded` / `failed` / `aborted` / `superseded` (not a separate `closed` label).

## Steps

### 1. Accepting

- Create orchestration-state artifact (`art_…`, type `orchestration-state`)
- Ingest goal (create or pin `goal` artifact)
- Select policy profile: `strict` | `standard` | `advisory`
- Record budget: max waves, max retries, allowed side effects

### 2. Planning

- Dispatch planner (contractually; worker later)
- Validate plan + task + dependency-graph artifacts
- Emit `plan-decision` (`accept` | `reject` | `revise`)
- Pin accepted plan artifact id + version

### 3. Scheduled

- Resolve dependency graph
- Compute waves (parallel-safe task sets)
- Materialize initial `orchestration-state`

### 4. Running

For each wave:

1. Ensure upstream terminal successes
2. Create/claim runs for ready tasks
3. Monitor run events
4. On task terminal, update state
5. Short-circuit wave on blocking failure if policy `fail_fast`

### 5. Gating

After task success (or wave completion, per policy):

- Aggregate validation + review results
- Apply quality gate (`schemas/quality-gate.schema.json`)
- Publish or hold artifacts
- Decide using unified `controlDecision`: `continue` | `retry` | `replan` | `abort` | `escalate` | `publish` | `hold`

### 6. Settling

- Ensure all required success criteria artifacts are `published`
- Write final orchestration summary `doc`
- Mark unused drafts `archived` or leave `draft` per policy

### 7. Closed

Terminal orchestration statuses:

| Status | Meaning |
|--------|---------|
| `succeeded` | Success criteria met |
| `failed` | Unrecoverable gate/task failure |
| `aborted` | Human/policy abort |
| `superseded` | Replaced by new orchestration |

## Retry policy (default)

| Failure class | Action |
|---------------|--------|
| Transient executor error | Retry same task, new `run_id`, max N |
| Validation fail | Retry task once after correction guidance artifact |
| Review fail | Replan or retry with reviewer notes as input |
| Dependency missing | Block; replan if persistent |
| Policy violation | Abort |

## Escalation

Orchestrator must escalate to human when:

- success criteria conflict
- skill missing for a required task
- two consecutive review fails on same task
- side effect exceeds budget

Escalations are `escalation` artifacts (`type: escalation`).

## Control-plane invariants

1. Never publish on failed blocking gates.
2. Never schedule dependents of failed hard deps.
3. Never execute without an accepted plan (except pure intake clarification).
4. Never implement work itself — only coordinate.
5. Plan ownership: `plan.trace.orchestration_id` must match the accepting orchestration.
6. Publish syncs plan payload.status via a new artifact version (create-once bytes).

## Core Engine (v0.3.x)

`ai-os/core` implements this lifecycle without workers:

| API | Effect |
|-----|--------|
| `start` | accepting + orchestration-state |
| `planAndAttach` | planning via shared Planner |
| `acceptPlan` | plan-decision + gate (when required) + publish plan version + schedule waves |
| `startNextWave` | running + stub `run-record` artifacts |
| `recordTaskOutcome` | terminal stub runs; wave/orc transitions |
| `recordQualityGate` | gating / settle publish |
| `escalate` | escalation artifact |

Skill/worker invocation remains forbidden in Core Engine.