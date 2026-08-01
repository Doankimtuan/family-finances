# Product Reverse Engineering Pipeline

**Status:** draft · **Discovery only** · **Feature Workers:** forbidden · **Redesign:** forbidden · **Version:** 0.2.0

## Waves

| Wave | Workers | Role |
|------|---------|------|
| 0 | `product-knowledge-ingest`, `feature-surface-inventory`, `business-rules-extractor`, `product-architecture-observer` | Ingest → knowledge/features/business/product-architecture |
| 1 | `product-analyst` | product-model |
| 2 | `workflow-analyzer` | workflow-model |
| 3 | `requirement-generator` (alias: requirement-extractor) | requirement-spec |
| 4 | `acceptance-criteria-generator` (alias: acceptance-criteria-extractor) | acceptance-criteria |
| 5 | `product-re-gap-report` | product-re-gap |

## Path rules

- Consume product architecture from `product-architecture/` only.
- Never consume `architecture/` (AIOS control-plane docs).
- Discovery → Product RE handoff is **soft** (docs + published discovery-report); no hard cross-pipeline edges.

## Folder ↔ runtime

Source of truth: `runtime/artifacts/`. Working folders hold templates + published mirrors. See `architecture/folder-structure.md`.

## Registration

- `registry/workers.json`
- Reserved skills under `skills/`
- Validator `product-re-schema-check` (typed schemas)
- Reviewer `product-re-coverage-review`
- Smoke: `npm run aios:product-re:smoke`
