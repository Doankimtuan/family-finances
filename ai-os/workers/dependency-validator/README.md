# Worker — `dependency-validator`

> **Pipeline:** `validation-engine` · **Status:** draft · **Never modify source artifacts** · **Never invent missing info**  
> **Primary output:** `validation-finding`

## Mission

Verify worker/pipeline dependencies, detect circular and missing dependencies and invalid references. Never modify artifacts.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `dependency-validator` |
| Pipeline | `validation-engine` |
| Depends on | `artifact-validator`, `schema-validator` |
| Skill | `dependency-validator` |

## Consumes

`schemas/`, `artifacts/` (soft → runtime/artifacts), `workers/`, `pipelines/`, `execution/` (soft), `templates/`, `knowledge/`

## Produces

`validation/`

## Rules

1. Report findings only — structured `entries[]`.
2. Never modify schemas, workers, knowledge, or other source packs.
3. Never invent missing information; use `UNKNOWN: …` or fail findings.
4. Every entry: validation_id, target, rule, result, evidence, severity, recommendation, confidence, traceability, unknowns.
5. Support partial/incremental validation via extensions.

## References

- `contracts/validation-engine.md`
- `pipelines/validation-engine/`
- `schemas/validation-engine-payload.schema.json`
