# `product-architecture/` — Product reverse-engineering (consume)

Observed **product** architecture notes extracted from the application domain — not AIOS framework docs.

## Rules

- Discovery only: document structures that exist in the product.
- Do **not** ingest `ai-os/architecture/` (OVERVIEW, TRACEABILITY, CONCURRENCY, MIGRATIONS, etc.).
- Do not redesign the product or invent layers.
- Prefer sources: `docs/DOMAIN_MODEL.md`, app route maps, domain engines, discovery-report soft inputs.

## Template files

| File | Purpose |
|------|---------|
| `README.md` | This index |
| `TEMPLATE.md` | Markdown starter |
| `template.schema.json` | Shape hint for structured JSON notes |
| `examples/` | Domain fixtures (non-normative) |

## Consumers / producers

Produced by `product-architecture-observer`. Consumed by `product-analyst` and (narrowly) `workflow-analyzer`. See `pipelines/product-re/`.

## Mirror rule

Folder `TEMPLATE.md` / `template.schema.json` are human-oriented mirrors. Runtime artifacts use `entries[]` per `schemas/product-re-payload.schema.json`.
