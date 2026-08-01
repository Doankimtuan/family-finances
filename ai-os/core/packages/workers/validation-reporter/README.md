# Worker — `validation-reporter`

> **Pipeline:** `validation-engine` · **Status:** draft · **Never modify source artifacts** · **Never invent missing info**  
> **Primary output:** `validation-report`

## Mission

Generate validation summary, severity-ranked issues, recommended fixes, and PASS/FAIL decision. Machine-readable only.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `validation-reporter` |
| Pipeline | `validation-engine` |
| Depends on | `validation-orchestrator`, `quality-scoring-engine` |
| Skill | `validation-reporter` |

## Consumes

`core/packages/schemas/`, `artifacts/` (soft → runtime/artifacts), `core/packages/workers/`, `core/packages/pipelines/`, `artifacts/execution/` (soft), `core/packages/templates/`, `artifacts/knowledge/`

## Produces

`artifacts/reports/`

## Rules

1. Report findings only — structured `entries[]`.
2. Never modify schemas, workers, knowledge, or other source packs.
3. Never invent missing information; use `UNKNOWN: …` or fail findings.
4. Every entry: validation_id, target, rule, result, evidence, severity, recommendation, confidence, traceability, unknowns.
5. Support partial/incremental validation via extensions.

## References

- `core/packages/contracts/validation-engine.md`
- `core/packages/pipelines/validation-engine/`
- `core/packages/schemas/validation-engine-payload.schema.json`
