# Worker — `product-analyst`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `product-analyst` · **Primary output:** `product-model`

## Mission

Reverse-engineer product identity, personas, value proposition, and capability map from artifacts/knowledge/, artifacts/features/, artifacts/business/, and artifacts/product-architecture/ inputs. Discover only — do not redesign or implement.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `product-analyst` |
| Pipeline | `product-re` |
| Depends on | `product-knowledge-ingest`, `feature-surface-inventory`, `business-rules-extractor`, `product-architecture-observer` |
| Skill | `product-analyst` |

## Consumes

`artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/`

## Produces

`artifacts/product/`

## Rules

1. Discovery only — do not redesign or implement Feature Workers.
2. Never treat `ai-os/architecture/` as product architecture input; use `artifacts/product-architecture/`.
3. Every payload entry MUST include `source_paths`.
4. Canonical runtime path remains `runtime/artifacts/` `payload.*`; folders are mirrors/templates.

## References

- `core/packages/contracts/worker-port.md`
- `core/packages/contracts/pipeline.md`
- `docs/architecture/TRACEABILITY.md`
- `docs/architecture/CONCURRENCY.md`
- `core/packages/pipelines/product-re/`
- `core/packages/schemas/product-model.schema.json`
