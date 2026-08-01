# Validation Finding Template

Use for `validation-finding` under **`validation/<worker_id>/`**.

## Required per entry

- `entry_kind` — owned kinds only (see `pipelines/validation-engine/RACI.md`)
- `validation_id`, `target`, `rule`, `result` (`pass|fail|warn|skip|info`)
- `evidence[]`, `severity`, `recommendation`, `confidence`
- `source_paths[]`, `unknowns[]` (prefix `UNKNOWN:`)
- `traceability.source_artifact`
- **`folder_mirror`** — must match `validation/<worker_id>/…`

## Partition

Do not write undifferentiated files into bare `validation/`. Orchestrator merges partitions.

## Invariants

Never mutate sources. Never invent missing information.
