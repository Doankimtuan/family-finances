# Worker — `validation-orchestrator`

> **Pipeline:** `validation-engine` · **Status:** draft · **Never modify source artifacts** · **Never invent missing info**  
> **Primary output:** `validation-status`

## Mission

Coordinate validation order (from pipeline waves), merge findings, emit overall validation status. Never modify source artifacts.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `validation-orchestrator` |
| Pipeline | `validation-engine` |
| Depends on | `artifact-validator`, `schema-validator`, `dependency-validator`, `pipeline-validator`, `traceability-validator`, `completeness-validator`, `consistency-validator`, `quality-scoring-engine` |
| Skill | `validation-orchestrator` |

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
