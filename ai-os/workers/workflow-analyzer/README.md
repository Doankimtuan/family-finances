# Worker — `workflow-analyzer`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `workflow-analyzer` · **Primary output:** `workflow-model`

## Mission

Discover end-to-end user and system workflows from product-model plus product-architecture/ and features/. Map steps, actors, and handoffs without inventing new product behavior.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `workflow-analyzer` |
| Pipeline | `product-re` |
| Depends on | `product-analyst` |
| Skill | `workflow-analyzer` |

## Consumes

`product/`, `product-architecture/`, `features/`

## Produces

`workflow/`

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
- `schemas/workflow-model.schema.json`
