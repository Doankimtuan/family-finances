# Worker — `evaluation-engine`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `qualification-finding`

## Mission

Plan evaluation of every generated artifact for accuracy, completeness, consistency, traceability, maintainability, extensibility, AI reliability, and documentation quality.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `evaluation-engine` |
| Pipeline | `qualification-framework` |
| Skill | `evaluation-engine` |
| Partition | `governance/qualification/metrics/evaluation-engine/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`governance/qualification/metrics/evaluation-engine/` → `qualification-finding`

## Modes

- Accuracy
- Completeness
- Consistency
- Traceability
- Maintainability
- Extensibility
- AI Reliability
- Documentation Quality

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
