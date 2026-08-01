# Validator binding — `pipeline-engine`

Pipeline gate: `runtime-engine-schema-check`

## Checks

1. Payload validates against `core/packages/schemas/runtime-engine-payload.schema.json`.
2. `folder_mirror` under `runtime/execution/pipeline-engine/`.
3. entry_kind owned per RACI.
4. Orchestrate-only / no-mutate-workers invariants.
