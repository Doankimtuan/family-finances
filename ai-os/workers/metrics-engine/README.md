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
| Partition | `qualification/metrics/metrics-engine/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`

## Produces

`qualification/metrics/metrics-engine/` → `qualification-scores`

## Modes

- Coverage Metrics
- Performance Metrics
- Reliability Metrics

## References

- `contracts/qualification-framework.md`
- `pipelines/qualification-framework/`
- `schemas/qualification-framework-payload.schema.json`
