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

`product/`, `workflow/`, `requirements/`, `acceptance/`, `knowledge/`, `features/`, `business/`, `product-architecture/`

## Produces

(gap report artifact only)

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
