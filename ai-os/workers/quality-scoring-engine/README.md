# Worker — `quality-scoring-engine`

> **Pipeline:** `validation-engine` · **Status:** draft · **Never modify source artifacts** · **Never invent missing info**  
> **Primary output:** `quality-scores`

## Mission

Generate structured quality scores from validation findings. Never modify source artifacts; never invent missing data.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `quality-scoring-engine` |
| Pipeline | `validation-engine` |
| Depends on | `artifact-validator`, `schema-validator`, `dependency-validator`, `pipeline-validator`, `traceability-validator`, `completeness-validator`, `consistency-validator` |
| Skill | `quality-scoring-engine` |

## Consumes

`schemas/`, `artifacts/` (soft → runtime/artifacts), `workers/`, `pipelines/`, `execution/` (soft), `templates/`, `knowledge/`

## Produces

`scores/`

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
