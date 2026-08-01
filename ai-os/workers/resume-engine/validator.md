# Validator binding — `resume-engine`

Pipeline gate: `runtime-engine-schema-check`

## Checks

1. Payload validates against `schemas/runtime-engine-payload.schema.json`.
2. `folder_mirror` under `runtime/resume/resume-engine/`.
3. entry_kind owned per RACI.
4. Orchestrate-only / no-mutate-workers invariants.
