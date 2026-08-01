# `artifacts/redesign/` — Solution architecture (produce)

Solution redesign overview notes (preserve business behavior)

## Rules

- Redesign the **solution** only. Do not invent business capabilities or change business rules.
- Preserve validated behavior from Product RE / discovery inputs.
- Never overwrite discovery or Product RE artifacts.
- Logical consume name `docs/architecture/` resolves to `artifacts/product-architecture/` (product architecture). Do **not** treat AIOS `docs/architecture/` control-plane docs as product input.
- Runtime source of truth: `runtime/artifacts/` `payload.*`.

## Template files

| File | Purpose |
|------|---------|
| `README.md` | This index |
| `TEMPLATE.md` | Markdown starter |
| `template.schema.json` | Shape hint |

See `core/packages/pipelines/solution-architecture/`.
