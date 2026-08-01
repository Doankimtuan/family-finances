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

## Forbidden

- **Feature Workers**
- Inventing business logic or changing business rules
- Overwriting discovery / Product RE artifacts
- Consuming AIOS `architecture/` as product architecture (use `product-architecture/`)
- Packages that do not match the Worker Template tree

## Template

[`ai-os/templates/worker/`](../templates/worker/)
