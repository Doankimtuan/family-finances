# Validator binding — `release-qualification-board`

Pipeline gate: `qualification-framework-schema-check`

## Checks

1. Payload validates against `core/packages/schemas/qualification-framework-payload.schema.json`.
2. `folder_mirror` under `governance/qualification/release/release-qualification-board/`.
3. entry_kind owned per RACI.
4. Never-mutate / never-regenerate / evaluate-only invariants.
