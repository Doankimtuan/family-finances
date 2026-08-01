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
| Partition | `qualification/metrics/evaluation-engine/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`

## Produces

`qualification/metrics/evaluation-engine/` → `qualification-finding`

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

- `contracts/qualification-framework.md`
- `pipelines/qualification-framework/`
- `schemas/qualification-framework-payload.schema.json`
