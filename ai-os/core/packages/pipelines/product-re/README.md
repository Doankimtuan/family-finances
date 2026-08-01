# Product Reverse Engineering Pipeline

**Status:** draft · **Discovery only** · **Feature Workers:** forbidden · **Redesign:** forbidden · **Version:** 0.2.1

## Waves

| Wave | Workers | Role |
|------|---------|------|
| 0 | `product-knowledge-ingest`, `feature-surface-inventory`, `business-rules-extractor`, `product-architecture-observer` | Ingest (soft `doc-source` / `discovery-report` / `app-surface`) |
| 1 | `product-analyst` | product-model |
| 2 | `workflow-analyzer` | workflow-model |
| 3 | `requirement-generator` (mission: extract; alias requirement-extractor) | requirement-spec |
| 4 | `acceptance-criteria-generator` (mission: extract; alias acceptance-criteria-extractor) | acceptance-criteria |
| 5 | `product-re-gap-report` | artifacts/gaps/ → product-re-gap |

## Soft input typing

| Logical name | artifact_type |
|--------------|---------------|
| docs | `doc-source` |
| app | `app-surface` |
| discovery-report | `discovery-report` |

Never type soft inputs as `goal`.

## Path rules

- Consume product architecture from `artifacts/product-architecture/` only.
- Never consume AIOS `docs/architecture/` control-plane docs.
- Folder TEMPLATEs are human mirrors; runtime payloads use `entries[]`.

## Smoke

`npm run aios:product-re:smoke`
