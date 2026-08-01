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
| Partition | `governance/qualification/metrics/coverage-analyzer/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`governance/qualification/metrics/coverage-analyzer/` → `qualification-finding`

## Modes

- Feature Gaps
- Business Rule Gaps
- API Gaps
- Requirement Gaps
- Spec Gaps
- Relationship Gaps
- Traceability Gaps

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
