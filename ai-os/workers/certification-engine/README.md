# Worker — `certification-engine`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `certification-report`

## Mission

Evaluate framework against certification thresholds and emit certification report, capability/quality/coverage/reliability matrices, maturity assessment, and release recommendation.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `certification-engine` |
| Pipeline | `qualification-framework` |
| Skill | `certification-engine` |
| Partition | `qualification/certification/certification-engine/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`

## Produces

`qualification/certification/certification-engine/` → `certification-report`

## Modes

- Certification Report
- Capability Matrix
- Quality Matrix
- Coverage Matrix
- Reliability Matrix
- Maturity
- Release Recommendation

## References

- `contracts/qualification-framework.md`
- `pipelines/qualification-framework/`
- `schemas/qualification-framework-payload.schema.json`
