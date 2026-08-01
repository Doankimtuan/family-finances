# Worker — `requirement-generator`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `requirement-extractor` · **Primary output:** `requirement-spec`

## Mission

Extract structured product requirements (SHALL/MUST) from discovered product and workflow knowledge plus business rules. Requirements must be traceable to source inputs; no redesign. Worker id retained for backward compatibility (role_alias=requirement-extractor).

## Identity

| Field | Value |
|-------|-------|
| Worker id | `requirement-generator` |
| Pipeline | `product-re` |
| Depends on | `product-analyst`, `workflow-analyzer`, `business-rules-extractor` |
| Skill | `requirement-generator` |

## Consumes

`product/`, `workflow/`, `business/`

## Produces

`requirements/`

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
- `schemas/requirement-spec.schema.json`
