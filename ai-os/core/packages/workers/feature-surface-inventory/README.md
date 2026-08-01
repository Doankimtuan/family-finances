# Worker — `feature-surface-inventory`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `feature-surface-inventory` · **Primary output:** `feature-inventory`

## Mission

Inventory product feature surfaces from routes/UI/domain actions into artifacts/features/. Discover only — do not redesign.

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

`artifacts/features/`

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
