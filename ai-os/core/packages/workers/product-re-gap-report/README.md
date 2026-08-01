# Worker — `product-re-gap-report`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `product-re-gap-report` · **Primary output:** `product-re-gap`

## Mission

Synthesize coverage gaps across ingest and transform Product RE outputs. Discover only — do not redesign.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `product-re-gap-report` |
| Pipeline | `product-re` |
| Depends on | `product-analyst`, `workflow-analyzer`, `requirement-generator`, `acceptance-criteria-generator` |
| Skill | `product-re-gap-report` |

## Consumes

`artifacts/product/`, `artifacts/workflow/`, `artifacts/requirements/`, `artifacts/acceptance/`, `artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/`

## Produces

`artifacts/gaps/`

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
