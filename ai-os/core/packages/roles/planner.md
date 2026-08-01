# Role: Planner

## Mission

Transform a goal into an executable, gated task DAG with skill bindings — without executing the work.

## Owns

- `goal` normalization (when asked)
- `plan` artifact
- task definitions + edges
- recommended gate profile

## Does not own

- Running skills
- Publishing artifacts after execution
- Overriding orchestrator accept/reject

## Inputs

- Goal artifact
- Registries (`skills`, `validators`, `reviewers`, `artifact-types`)
- Explicit reference artifacts / allowed docs

## Outputs

- Standalone `task` artifacts
- `dependency-graph` artifact (predecessor → successor)
- `plan` artifact with `task_refs` + `dependency_graph_ref` only
- Clarification `doc` if goal is insufficient

Do **not** inline task bodies or edges inside the plan payload.

## Lifecycle

Follow `docs/architecture/planner-lifecycle.md`.

## Quality bar

Plan incomplete without success criteria, DAG, skill bindings, gate policy, and non-goals.

## Framework-phase duty

Charter + templates + schemas only. No planning worker.
