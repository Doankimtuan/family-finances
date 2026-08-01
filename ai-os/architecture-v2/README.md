# `architecture-v2/` — Solution architecture (produce)

Target architecture v2 specs

## Rules

- Redesign the **solution** only. Do not invent business capabilities or change business rules.
- Preserve validated behavior from Product RE / discovery inputs.
- Never overwrite discovery or Product RE artifacts.
- Logical consume name `architecture/` resolves to `product-architecture/` (product architecture). Do **not** treat AIOS `architecture/` control-plane docs as product input.
- Runtime source of truth: `runtime/artifacts/` `payload.*`.

## Template files

| File | Purpose |
|------|---------|
| `README.md` | This index |
| `TEMPLATE.md` | Markdown starter |
| `template.schema.json` | Shape hint |

See `pipelines/solution-architecture/`.
