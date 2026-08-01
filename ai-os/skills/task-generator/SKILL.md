---
name: task-generator
description: Convert validated specifications into executable engineering work items (epics→subtasks) with dependencies, complexity, priority, work-item milestones, and DoD. Never invent business logic.
---

# Task Generator

> Never invent business logic. **Owns work-item graph + work-item milestones** (see RACI). Do not invent calendar dates.

## Consumes

Upstream Spec Eng packs + `specifications/` (+ soft SA packs as declared)

## Produces

`tasks/` → `engineering-task-graph` (folder name ≠ Core `task` artifacts)

## Ownership

- **Owns:** epic→subtask hierarchy, work-item `depends_on` / `dependency`, work-item milestones, complexity, priority, DoD
- **Does not:** invent product features; own release/calendar milestones; invent build order

## Procedure

1. Load `specifications/` (must be ready with section coverage).
2. Decompose into epic→feature→story→task(+subtask) with depends_on.
3. Emit work-item milestones and dependency edges per RACI.
4. Trace every item to specifications + sources; mark estimate gaps UNKNOWN.
5. Write under `tasks/`. Stop for validation/review.

## Heuristics

- One epic per coherent module boundary from architecture-v2 when evidenced.
- Do not create tasks that implement UNKNOWN API fields as if known.
- Prefer linking `depends_on` to entry ids in the same graph.

## Done when

- ≥1 epic, ≥1 feature|story, ≥1 task|subtask, plus dependency or depends_on edges
- Work-item milestones (if any) are not calendar ship dates
- Full unknowns + source_paths + confidence on every entry

## Negative examples

- Do not create tasks for undesigned features marked UNKNOWN as known work.
- Do not put release calendar milestones here (roadmap owns those).

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
