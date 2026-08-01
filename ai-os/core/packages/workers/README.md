# Workers

Concrete worker packages live here. Instantiation **must** copy `core/packages/templates/worker/` unchanged in layout.

## Pipelines

### System discovery (`core/packages/pipelines/discovery/`)

Workers: `discover-*`

### Product reverse engineering (`core/packages/pipelines/product-re/`)

| Worker | Wave | Produces |
|--------|------|----------|
| `product-knowledge-ingest` | 0 | `artifacts/knowledge/` |
| `feature-surface-inventory` | 0 | `artifacts/features/` |
| `business-rules-extractor` | 0 | `artifacts/business/` |
| `product-architecture-observer` | 0 | `artifacts/product-architecture/` |
| `product-analyst` | 1 | `artifacts/product/` |
| `workflow-analyzer` | 2 | `artifacts/workflow/` |
| `requirement-generator` (extract; BC id) | 3 | `artifacts/requirements/` |
| `acceptance-criteria-generator` (extract; BC id) | 4 | `artifacts/acceptance/` |
| `product-re-gap-report` | 5 | `artifacts/gaps/` |

Soft ingest inputs use `doc-source` / `app-surface` / `discovery-report` — never `goal`.

### Solution architecture redesign (`core/packages/pipelines/solution-architecture/`)

| Worker | Wave | Produces |
|--------|------|----------|
| `architecture-consultant` | 0 | `artifacts/architecture-v2/`, `governance/decision-records/`, `artifacts/redesign/` |
| `tech-stack-consultant` | 1 | `artifacts/tech-stack/`, `artifacts/migration/` |
| `refactoring-consultant` | 1 | `artifacts/migration/`, `artifacts/redesign/` |
| `folder-structure-designer` | 2 | `artifacts/folder-structure/` |

### Specification engineering (`core/packages/pipelines/specification-engineering/`)

| Worker | Wave | Produces |
|--------|------|----------|
| `specification-generator` | 0 | `artifacts/specifications/` |
| `task-generator` | 1 | `artifacts/tasks/` |
| `roadmap-generator` | 2 | `artifacts/roadmap/` |
| `implementation-planner` | 3 | `artifacts/implementation/` |

Workers packaged only in v0.6.x — not executed; no live project specifications.

### Validation engine (`core/packages/pipelines/validation-engine/`)

| Worker | Wave | Produces |
|--------|------|----------|
| `artifact-validator` | 0 | `artifacts/validation/` |
| `schema-validator` | 0 | `artifacts/validation/` |
| `dependency-validator` | 1 | `artifacts/validation/` |
| `pipeline-validator` | 1 | `artifacts/validation/` |
| `traceability-validator` | 2 | `artifacts/validation/` |
| `completeness-validator` | 2 | `artifacts/validation/` |
| `consistency-validator` | 2 | `artifacts/validation/` |
| `quality-scoring-engine` | 3 | `artifacts/scores/` |
| `validation-orchestrator` | 4 | `artifacts/validation/` |
| `validation-reporter` | 5 | `artifacts/reports/` |

Packaged in v0.7.0 — validations **not executed**; never mutate sources.

## Forbidden

- **Feature Workers**
- Inventing business logic or changing business rules
- Redesigning the system or changing requirements (Specification Engineering)
- Mutating source artifacts or inventing missing information (Validation Engine)
- Overwriting discovery / Product RE / Solution Architecture artifacts
- Consuming AIOS `docs/architecture/` as product architecture (use `artifacts/product-architecture/`)
- Packages that do not match the Worker Template tree

## Template

[`ai-os/templates/worker/`](../templates/worker/)
