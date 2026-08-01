# Validator binding — `stress-test-runner`

Pipeline gate: `qualification-framework-schema-check`

## Checks

1. Payload validates against `schemas/qualification-framework-payload.schema.json`.
2. `folder_mirror` under `qualification/benchmarks/stress-test-runner/`.
3. entry_kind owned per RACI.
4. Never-mutate / never-regenerate / evaluate-only invariants.
