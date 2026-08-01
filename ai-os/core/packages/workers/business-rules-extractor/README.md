# Worker — `business-rules-extractor`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `business-rules-extractor` · **Primary output:** `business-rules`

## Mission

Extract observed business rules from DOMAIN_MODEL and domain engines into artifacts/business/. Discover only — do not invent rules.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `business-rules-extractor` |
| Pipeline | `product-re` |
| Depends on | — |
| Skill | `business-rules-extractor` |

## Consumes

docs, discovery-report

## Produces

`artifacts/business/`

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
