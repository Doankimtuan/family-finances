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
| Partition | `governance/qualification/certification/certification-engine/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`governance/qualification/certification/certification-engine/` → `certification-report`

## Modes

- Certification Report
- Capability Matrix
- Quality Matrix
- Coverage Matrix
- Reliability Matrix
- Maturity
- Release Recommendation

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
