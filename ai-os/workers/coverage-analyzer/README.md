# Worker — `coverage-analyzer`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `qualification-finding`

## Mission

Identify missing features, business rules, APIs, requirements, specifications, relationships, and traceability gaps against ground truth.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `coverage-analyzer` |
| Pipeline | `qualification-framework` |
| Skill | `coverage-analyzer` |
| Partition | `qualification/metrics/coverage-analyzer/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`

## Produces

`qualification/metrics/coverage-analyzer/` → `qualification-finding`

## Modes

- Feature Gaps
- Business Rule Gaps
- API Gaps
- Requirement Gaps
- Spec Gaps
- Relationship Gaps
- Traceability Gaps

## References

- `contracts/qualification-framework.md`
- `pipelines/qualification-framework/`
- `schemas/qualification-framework-payload.schema.json`
