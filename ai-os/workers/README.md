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
| `requirement-generator` (alias: requirement-extractor) | 3 | `requirements/` |
| `acceptance-criteria-generator` (alias: acceptance-criteria-extractor) | 4 | `acceptance/` |
| `product-re-gap-report` | 5 | `product-re-gap` artifact |

## Forbidden

- **Feature Workers**
- Redesign or product mutation (`repo-write`)
- Consuming `architecture/` as product architecture (use `product-architecture/`)
- Packages that do not match the Worker Template tree

## Template

[`ai-os/templates/worker/`](../templates/worker/)
