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
| Partition | `qualification/reference-projects/reference-project-catalog/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`

## Produces

`qualification/reference-projects/reference-project-catalog/` → `qualification-finding`

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

- `contracts/qualification-framework.md`
- `pipelines/qualification-framework/`
- `schemas/qualification-framework-payload.schema.json`
