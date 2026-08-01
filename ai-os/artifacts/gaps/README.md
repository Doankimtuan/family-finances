# `artifacts/gaps/` — Product reverse-engineering (produce)

Working folder for `product-re-gap` mirrors from `product-re-gap-report`.

## Rules

- Discovery only: list coverage gaps; do not redesign to close them.
- Runtime source of truth remains `runtime/artifacts/` `payload.*`.
- Folder templates are human mirrors; runtime payloads use `entries[]` (see `core/packages/schemas/product-re-payload.schema.json`).

## Ownership

| Role | Worker |
|------|--------|
| Primary produce | `product-re-gap-report` |
| Artifact type | `product-re-gap` |

See `core/packages/pipelines/product-re/`.
