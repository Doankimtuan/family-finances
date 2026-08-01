# Worker — `feature-surface-inventory`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `feature-surface-inventory` · **Primary output:** `feature-inventory`

## Mission

Inventory product feature surfaces from routes/UI/domain actions into features/. Discover only — do not redesign.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `feature-surface-inventory` |
| Pipeline | `product-re` |
| Depends on | — |
| Skill | `feature-surface-inventory` |

## Consumes

docs, discovery-report, app

## Produces

`features/`

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
