# Worker — `acceptance-criteria-generator`

> **Pipeline:** `product-re` · **Class:** product reverse engineering (discovery-only) · **Status:** draft  
> **Role alias:** `acceptance-criteria-extractor` · **Primary output:** `acceptance-criteria`

## Mission

Extract testable acceptance criteria (Given/When/Then) for each discovered requirement. Criteria must be observable and falsifiable; do not invent features. Worker id retained for backward compatibility (role_alias=acceptance-criteria-extractor).

## Identity

| Field | Value |
|-------|-------|
| Worker id | `acceptance-criteria-generator` |
| Pipeline | `product-re` |
| Depends on | `requirement-generator`, `product-analyst`, `workflow-analyzer` |
| Skill | `acceptance-criteria-generator` |

## Consumes

`requirements/`, `product/`, `workflow/`

## Produces

`acceptance/`

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
- `schemas/acceptance-criteria.schema.json`
