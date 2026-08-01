# `workflow/` — Product reverse-engineering (produce)

Working folder for Product RE `workflow-model` mirrors and templates.

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
| Primary produce | `workflow-analyzer` |
| Artifact type | `workflow-model` |

See `pipelines/product-re/` and `architecture/folder-structure.md`.
