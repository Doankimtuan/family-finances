# Specifications — Implementation-Ready Pack

> Never invent business logic · Restate Product RE with pointers · Mark gaps as `UNKNOWN: …` · Traceability required

**Runtime payloads** use `entries[]` per `schemas/specification-engineering-payload.schema.json`.  
This TEMPLATE.md is a human mirror of required section kinds.

## Required section kinds

Each non-`gap`/`conflict` entry MUST include:

| Field | Notes |
|-------|-------|
| purpose | or `UNKNOWN: …` |
| scope | or `UNKNOWN: …` |
| actors[] | |
| preconditions[] | |
| postconditions[] | |
| workflow | |
| business_rules | Restate `business/` — do not invent |
| validation_rules | |
| error_handling | |
| edge_cases | |
| dependencies[] | |
| acceptance_criteria[] | Pointers to `acceptance/` |
| traceability | feature, business_rule, api, database, workflow, architecture_decision, source_artifact |
| source_paths[] / confidence / unknowns[] | |

## Sections

1. project-overview
2. functional
3. non-functional
4. architecture → `architecture-v2/`, `decision-records/`
5. module → `folder-structure/`
6. feature
7. api
8. database
9. ui
10. security
11. deployment → `migration/`, `tech-stack/`
12. coding-standards → `tech-stack/`
13. testing-strategy

## Conflicts / gaps

Use `entry_kind=conflict` or `gap` when coverage cannot be completed honestly.

## Traceability Matrix

| Spec id | Feature | Business Rule | API | Database | Workflow | ADR | Source |
|---------|---------|---------------|-----|----------|----------|-----|--------|
| | | | | | | | |
