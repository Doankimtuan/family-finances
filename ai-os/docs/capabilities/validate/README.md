# Capability — `validate`

**Title:** Validate  
**Pipeline:** `validation-engine`  
**Board decision:** GENERALIZE

## Purpose

Deterministic artifact / schema / dependency / consistency validation + scores + report

## @Run commands

- `@Run validate`
- `@Run full`

## Implementation workers (packaging detail)

- `artifact-validator`
- `schema-validator`
- `dependency-validator`
- `pipeline-validator`
- `traceability-validator`
- `completeness-validator`
- `consistency-validator`
- `quality-scoring-engine`
- `validation-orchestrator`
- `validation-reporter`

## Future simplification

Collapse 7 specialized validators into rule-pack driven validation-engine; keep orchestrator+reporter

