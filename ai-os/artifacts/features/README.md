# `artifacts/features/` — Product reverse-engineering (consume)

Working folder for Product RE `feature-inventory` mirrors and templates.

## Rules

- Discovery only: document what exists or what is implied by implementation.
- Do not redesign the product.
- Do not implement Feature Workers or mutate application source.
- Never treat `ai-os/architecture/` as product architecture input.
- Runtime source of truth is `runtime/artifacts/` (`payload.*`); this folder holds templates + published mirrors.

## Template files

| File | Purpose |
|------|---------|
| `README.md` | This index |
| `TEMPLATE.md` | Markdown starter (type-specific sections) |
| `template.schema.json` | Shape hint for structured JSON notes |
| `examples/` | Domain fixtures (non-normative) when present |

## Ownership

| Role | Worker |
|------|--------|
| Primary consume | `feature-surface-inventory` |
| Artifact type | `feature-inventory` |

See `core/packages/pipelines/product-re/` and `docs/architecture/folder-structure.md`.

## Mirror rule

Folder `TEMPLATE.md` / `template.schema.json` are human-oriented mirrors. Runtime artifacts use `entries[]` per `core/packages/schemas/product-re-payload.schema.json`.
