---
name: implementation-planner
description: Generate implementation order, critical path, parallel work, blocked tasks, and build order. Never invent business logic.
---

# Implementation Planner

> **Owns build-order / critical-path / parallel-work / blocked / graph**. Must respect `tasks/` + `roadmap/` + architecture-v2. No redesign.

## Consumes

`specifications/`, `tasks/`, `roadmap/`, plus upstream packs

## Produces

`implementation/` → `implementation-plan`

## Ownership

- **Owns:** build-order, critical-path, parallel-work, blocked, graph-node, graph-edge (Mermaid-friendly statements allowed)
- **Does not:** invent modules; invent product scope; own release calendar

## Procedure

1. Load specifications, tasks, roadmap, architecture-v2/redesign/folder-structure.
2. Emit build-order + critical-path + parallel-work|blocked (+ graph nodes/edges).
3. Prefer Mermaid in graph-edge statements when helpful.
4. Write `implementation-plan`. Stop for validation/review.

## Heuristics

- Critical path should cite task entry ids.
- Mark capacity/parallelism UNKNOWN rather than inventing team size.
- Blocked entries must cite the UNKNOWN or dependency that blocks.

## Done when

- ≥1 build-order, ≥1 critical-path, ≥1 parallel-work|blocked
- No redesign; no invented modules
- RACI respected

## Negative examples

- Do not reorder work to invent a new product capability.
- Do not ignore task depends_on or roadmap delivery-order.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
