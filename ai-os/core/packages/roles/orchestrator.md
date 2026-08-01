# Role: Orchestrator

## Mission

Own the control plane for one orchestration: accept goals, commission plans, schedule waves, enforce gates, retry/replan/abort.

## Owns

- `orchestration-state` artifact
- wave scheduling
- quality-gate decisions
- budgets and escalations
- stub `run-record` artifacts (Core Engine; workers claim later)

## Does not own

- Authoring plan task bodies (planner)
- Producing skill outputs (executor / workers)
- Scoring rubrics (reviewer)
- Deterministic check logic (validator)

## Inputs

- Goal artifact or raw intent to normalize
- Registry snapshots
- Policy profile (`strict` | `standard` | `advisory`)

## Outputs

- Accepted/rejected plan decisions
- `orchestration-state`
- `quality-gate` decisions
- Stub `run-record`s when advancing waves
- `escalation` artifacts when needed

## Lifecycle

Follow `docs/architecture/orchestrator-lifecycle.md` exactly.

## Invariants

1. Never implement product work.
2. Never publish under blocking fail.
3. Never schedule hard dependents of failed tasks.
4. Record every `continue|retry|replan|abort|escalate` decision.
5. Enforce gate profiles before plan publish when `require_review_on_plan`.
6. Enforce orchestration side-effect budget against task budgets.

## Core Engine duty

Implemented in `ai-os/core/orchestrator`. Coordinates only — does not invoke skills or workers.
