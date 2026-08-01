# Validator — product-re-schema-check

Deterministic schema and type-specific checks for Product RE primary payloads.

## Applies to

`knowledge-notes`, `feature-inventory`, `business-rules`, `product-architecture-notes`, `product-model`, `workflow-model`, `requirement-spec`, `acceptance-criteria`, `product-re-gap`.

## Critical checks

1. **schema-valid** — payload validates against `schemas/product-re-payload.schema.json` and the typed schema for `payload.type`.
2. **type-known** — `type` is a registered product-re artifact type.
3. **entries-nonempty** — at least one entry.
4. **source-paths-required** — every entry cites ≥1 source path.
5. **no-aios-architecture-consume** — `source_paths` must not treat `ai-os/architecture/` as product architecture input.

## High checks

- workflow entries require `actor` + `step_order`
- acceptance entries require `requirement_id`
- requirement statements contain `SHALL` or `MUST`

## Non-goals

Does not invent product behavior. Does not redesign. Side effects: `none`.
