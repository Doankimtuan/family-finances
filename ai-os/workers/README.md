# Workers

Concrete worker packages live here. Instantiation **must** copy `templates/worker/` unchanged in layout.

## Pipelines

### System discovery (`pipelines/discovery/`)

Workers: `discover-*`

### Product reverse engineering (`pipelines/product-re/`)

| Worker | Wave | Produces |
|--------|------|----------|
| `product-knowledge-ingest` | 0 | `knowledge/` |
| `feature-surface-inventory` | 0 | `features/` |
| `business-rules-extractor` | 0 | `business/` |
| `product-architecture-observer` | 0 | `product-architecture/` |
| `product-analyst` | 1 | `product/` |
| `workflow-analyzer` | 2 | `workflow/` |
| `requirement-generator` (extract; BC id) | 3 | `requirements/` |
| `acceptance-criteria-generator` (extract; BC id) | 4 | `acceptance/` |
| `product-re-gap-report` | 5 | `gaps/` |

Soft ingest inputs use `doc-source` / `app-surface` / `discovery-report` — never `goal`.

### Solution architecture redesign (`pipelines/solution-architecture/`)

| Worker | Wave | Produces |
|--------|------|----------|
| `architecture-consultant` | 0 | `architecture-v2/`, `decision-records/`, `redesign/` |
| `tech-stack-consultant` | 1 | `tech-stack/`, `migration/` |
| `refactoring-consultant` | 1 | `migration/`, `redesign/` |
| `folder-structure-designer` | 2 | `folder-structure/` |

### Specification engineering (`pipelines/specification-engineering/`)

| Worker | Wave | Produces |
|--------|------|----------|
| `specification-generator` | 0 | `specifications/` |
| `task-generator` | 1 | `tasks/` |
| `roadmap-generator` | 2 | `roadmap/` |
| `implementation-planner` | 3 | `implementation/` |

Workers packaged only in v0.6.x — not executed; no live project specifications.

### Validation engine (`pipelines/validation-engine/`)

| Worker | Wave | Produces |
|--------|------|----------|
| `artifact-validator` | 0 | `validation/` |
| `schema-validator` | 0 | `validation/` |
| `dependency-validator` | 1 | `validation/` |
| `pipeline-validator` | 1 | `validation/` |
| `traceability-validator` | 2 | `validation/` |
| `completeness-validator` | 2 | `validation/` |
| `consistency-validator` | 2 | `validation/` |
| `quality-scoring-engine` | 3 | `scores/` |
| `validation-orchestrator` | 4 | `validation/` |
| `validation-reporter` | 5 | `reports/` |

Packaged in v0.7.0 — validations **not executed**; never mutate sources.

## Forbidden

- **Feature Workers**
- Inventing business logic or changing business rules
- Redesigning the system or changing requirements (Specification Engineering)
- Mutating source artifacts or inventing missing information (Validation Engine)
- Overwriting discovery / Product RE / Solution Architecture artifacts
- Consuming AIOS `architecture/` as product architecture (use `product-architecture/`)
- Packages that do not match the Worker Template tree

## Template

[`ai-os/templates/worker/`](../templates/worker/)
