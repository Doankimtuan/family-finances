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

`artifacts/requirements/`, `artifacts/product/`, `artifacts/workflow/`

## Produces

`artifacts/acceptance/`

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
- `core/packages/schemas/acceptance-criteria.schema.json`
