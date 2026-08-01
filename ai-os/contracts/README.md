# Cross-Role Contracts

Interface promises between roles. Implementations come later; these contracts are binding now.

## Planner → Orchestrator

Planner delivers:

- `plan` artifact (`payload.json`) with `task_refs` + `dependency_graph_ref`
- standalone `task` artifacts
- `dependency-graph` artifact (predecessor/successor edges)
- recommended `gate_profile`

Orchestrator returns `plan-decision` (`accept` | `reject` | `revise`).

## Orchestrator → Executor

Provides: task artifact ref, skill id+version, side-effect budget, run artifact id.  
Executor returns: `run-record`, output artifacts (`ready`), `errorObject` on failure.

## Executor → Validator → Reviewer → Orchestrator

Validator emits `validation-report`.  
Reviewer emits `review-report` (may require prior validator pass).  
Orchestrator alone emits `quality-gate` with unified `controlDecision`.

## Worker port

See `contracts/worker-port.md` and `schemas/worker-manifest.schema.json`.  
No worker implementations in framework phase.

## Cursor bridge

See `contracts/cursor-bridge.md`.

## Shared error object

Uses `common.schema.json#/$defs/errorObject` (phases aligned with `errorPhase`).

## Shared identity / clock

- IDs: `art_…` (durable), kebab package ids
- Timestamps: UTC ISO-8601
- Decisions: `controlDecision`
