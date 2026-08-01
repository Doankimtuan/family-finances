# Planner Lifecycle

## Purpose

Turn a goal into an executable plan: standalone task artifacts, a dependency graph, skill bindings, and gate policy — without executing product work.

## States

```
intake → context → decompose → bind → verify → publish → (revise)
```

## Steps

### 1. Intake

Normalize the goal into a `goal` artifact (`art_…`, type `goal`) with success criteria.  
If criteria are missing, emit a clarifying `doc` (`draft`) and stop.

### 2. Context

Declare inputs explicitly: registries, pinned artifacts, allowed product paths.

### 3. Decompose

Create **standalone `task` artifacts** (one skill, one primary output type, done-when).

### 4. Bind

For each task: skill pin, inputs, validators/reviewers, side-effect budget, `allow_parallel_attempts` / `continue_on_cancel` as needed.

Build **one** `dependency-graph` artifact with `predecessor` → `successor` edges (`blocks` / `feeds` / `informs`).

### 5. Verify

- Hard subgraph acyclic
- Skill ids in registry `entries` (or reserved with explicit accept)
- Artifact types registered
- Gate coverage for `repo-write` tasks
- Success criteria map to task ids

### 6. Publish

Emit:

1. Task artifacts (`ready`)
2. Dependency-graph artifact
3. Plan artifact with `task_refs` + `dependency_graph_ref` (no inlined tasks/edges)
4. Optional human companions (`PLAN.md`, etc.)

Await orchestrator `plan-decision`.

### 7. Revise

On `revise`: supersede plan/graph/tasks as needed; never rewrite published history.

## Plan quality bar

Incomplete without: success criteria, task refs, dependency graph, skill bindings, gate profile, non-goals.
