# Worker — `product-knowledge-ingest`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `product-knowledge-ingest` · **Primary output:** `knowledge-notes`

## Mission

Populate artifacts/knowledge/ notes from docs and soft discovery-report inputs. Discover only — do not redesign.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `product-knowledge-ingest` |
| Pipeline | `product-re` |
| Depends on | — |
| Skill | `product-knowledge-ingest` |

## Consumes

docs, discovery-report

## Produces

`artifacts/knowledge/`

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
- `core/packages/schemas/product-re-payload.schema.json`
