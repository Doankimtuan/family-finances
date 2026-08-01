# Worker — `metrics-engine`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `qualification-scores`

## Mission

Plan collection of coverage, performance, and reliability metrics including recall, token usage, failure rate, retry count, and confidence distribution.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `metrics-engine` |
| Pipeline | `qualification-framework` |
| Skill | `metrics-engine` |
| Partition | `governance/qualification/metrics/metrics-engine/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`governance/qualification/metrics/metrics-engine/` → `qualification-scores`

## Modes

- Coverage Metrics
- Performance Metrics
- Reliability Metrics

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
