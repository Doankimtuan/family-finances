# Worker — `product-analyst`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `product-analyst` · **Primary output:** `product-model`

## Mission

Reverse-engineer product identity, personas, value proposition, and capability map from knowledge/, features/, business/, and product-architecture/ inputs. Discover only — do not redesign or implement.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `product-analyst` |
| Pipeline | `product-re` |
| Depends on | `product-knowledge-ingest`, `feature-surface-inventory`, `business-rules-extractor`, `product-architecture-observer` |
| Skill | `product-analyst` |

## Consumes

`knowledge/`, `features/`, `business/`, `product-architecture/`

## Produces

`product/`

## Rules

1. Discovery only — do not redesign or implement Feature Workers.
2. Never treat `ai-os/architecture/` as product architecture input; use `product-architecture/`.
3. Every payload entry MUST include `source_paths`.
4. Canonical runtime path remains `runtime/artifacts/` `payload.*`; folders are mirrors/templates.

## References

- `contracts/worker-port.md`
- `contracts/pipeline.md`
- `architecture/TRACEABILITY.md`
- `architecture/CONCURRENCY.md`
- `pipelines/product-re/`
- `schemas/product-model.schema.json`
