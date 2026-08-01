# Worker — `reference-project-catalog`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `qualification-finding`

## Mission

Catalog benchmark reference projects with expected outputs, metrics, specifications, ground truth, and acceptance thresholds. Never modify framework components.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `reference-project-catalog` |
| Pipeline | `qualification-framework` |
| Skill | `reference-project-catalog` |
| Partition | `governance/qualification/reference-projects/reference-project-catalog/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`governance/qualification/reference-projects/reference-project-catalog/` → `qualification-finding`

## Modes

- Small React
- Large React
- Next.js
- Vue
- Angular
- Node Backend
- NestJS
- Monorepo
- Microservices
- Desktop
- Mobile
- CLI
- Library
- Full Stack

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
