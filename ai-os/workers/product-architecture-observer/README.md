# Worker — `product-architecture-observer`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `product-architecture-observer` · **Primary output:** `product-architecture-notes`

## Mission

Observe product architecture into product-architecture/ (never ai-os/architecture/). Discover only — do not redesign.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `product-architecture-observer` |
| Pipeline | `product-re` |
| Depends on | — |
| Skill | `product-architecture-observer` |

## Consumes

docs, discovery-report

## Produces

`product-architecture/`

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
- `schemas/product-re-payload.schema.json`
