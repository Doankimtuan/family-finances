# Dependency System

## Purpose

Dependencies make work graphs auditable, parallelizable, and gateable. Implicit context reads are a framework violation.

## Edge direction (normative)

Edges use **predecessor → successor**:

```json
{
  "predecessor": "art_task_a",
  "successor": "art_task_b",
  "type": "blocks",
  "hard": true
}
```

Meaning: **predecessor must satisfy the edge before successor may start**.

| Type | Hard? | Meaning |
|------|-------|---------|
| `blocks` | yes | Predecessor run must `succeeded` |
| `feeds` | yes | Predecessor primary output is input to successor |
| `informs` | no | Soft hint; must not create hard cycles |

## Single graph source of truth

- Task bodies are **standalone artifacts** (`type: task`).
- Plans hold `task_refs[]` + `dependency_graph_ref` only — **no inlined tasks, no inlined edges**.
- The `dependency-graph` artifact owns all task/artifact edges.

## Resolution algorithm

1. Load plan `task_refs` and pinned `dependency_graph_ref`.
2. Topologically sort hard edges (`blocks`, `feeds`) where `hard !== false`.
3. Fail if hard subgraph has a cycle (`acyclic` must be true for executable graphs).
4. Resolve each task input to concrete `(artifact_id, artifact_version)`.
5. Fail if required artifacts missing or not `published`/`ready` per policy.
6. Emit/confirm resolved graph before the execution wave.

## Parallelism

- Tasks with no unmet hard preds may share a wave.
- Same `artifact_id` must not be written by concurrent runs (see CONCURRENCY.md).
- Reviewers run after required validators unless profile is `advisory`.

## Version pinning

| Context | Pinning |
|---------|---------|
| External inputs | Exact `artifact_version` |
| Intra-run staging | `latest-in-run` allowed |
| Published lineage | Exact version |

## Failure propagation

| Event | Effect |
|-------|--------|
| Upstream `failed` | Hard successors → `blocked` |
| Upstream `cancelled` | Successors → `cancelled` unless task `continue_on_cancel: true` |
| Validation/review blocking `fail` | Artifact cannot `published`; dependents blocked (unless profile `advisory`) |
