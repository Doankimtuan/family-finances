# Worker — `business-rules-extractor`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `business-rules-extractor` · **Primary output:** `business-rules`

## Mission

Extract observed business rules from DOMAIN_MODEL and domain engines into business/. Discover only — do not invent rules.

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

`business/`

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
