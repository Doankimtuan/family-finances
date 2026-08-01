# Traceability

## Required correlation

Control-plane artifacts SHOULD carry `trace` (`common.schema.json#/$defs/traceContext`):

| Field | Meaning |
|-------|---------|
| `orchestration_id` | Orchestration-state artifact id |
| `goal_id` | Goal artifact id |
| `plan_id` | Plan artifact id |
| `task_id` | Task artifact id |
| `run_id` | Run-record artifact id |

All values are `art_…` IDs.

## Minimum presence matrix

| Artifact type | Required trace fields |
|---------------|----------------------|
| `goal` | — (root) |
| `plan` | `goal_id` |
| `task` | `goal_id`, `plan_id` when planned |
| `dependency-graph` | `plan_id` |
| `run-record` | `orchestration_id`, `plan_id`, `task_id` (+ `run_id` = self) |
| `validation-report` | `run_id`, `task_id` when applicable |
| `review-report` | `run_id`, `task_id` when applicable |
| `quality-gate` | `orchestration_id` |
| `orchestration-state` | `goal_id`, `plan_id` when accepted |
| `plan-decision` | `goal_id`, `plan_id`, `orchestration_id` |
| `escalation` | `orchestration_id` |

## Chain

```
goal → orchestration → plan → dependency-graph
                 ↓
               tasks → runs → outputs → validations → reviews → quality-gate
```

## Non-negotiable

1. Never cite “previous message” as lineage.
2. Pin `artifact_version` in every ref.
3. Supersede; do not rewrite published history.
