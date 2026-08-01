# Folder Structure

## Canonical tree

```
ai-os/
├── README.md
├── AGENTS.md
├── VERSION
├── architecture/           # AIOS framework docs (NOT product architecture input)
├── product-architecture/   # Product RE consume: observed product architecture
├── knowledge/              # Product RE consume (ingest → notes)
├── features/               # Product RE consume (ingest → surface inventory)
├── business/               # Product RE consume (ingest → rules)
├── product/                # Product RE produce (product-model)
├── workflow/               # Product RE produce (workflow-model)
├── requirements/           # Product RE produce (requirement-spec)
├── acceptance/             # Product RE produce (acceptance-criteria)
├── core/                   # Core Engine (TypeScript control plane)
│   ├── planner/
│   ├── orchestrator/
│   ├── artifacts/
│   ├── memory/
│   ├── knowledge/
│   ├── schemas/            # Zod mirrors of JSON contracts
│   ├── templates/
│   ├── configs/
│   └── scripts/
├── schemas/                # JSON Schema contracts
├── templates/
│   ├── artifact/
│   ├── plan/
│   ├── task/
│   ├── run/
│   ├── skill/
│   ├── validation/
│   ├── review/
│   └── worker/             # reusable worker package template
├── contracts/
├── policies/               # Executable policy data (gate profiles)
├── pipelines/              # discovery + product-re
├── registry/               # entries maps keyed by id
├── roles/
├── runtime/                # gitignored outputs (placeholders kept)
├── skills/                 # reserved skill packages
├── validators/
├── reviewers/
└── workers/                # Discovery + Product RE (Feature Workers forbidden)
```

## Package layouts (future)

Unchanged from framework design: `manifest.json` + role doc + optional schemas/fixtures.

## Runtime layout

```
runtime/artifacts/<art_id>/v<n>/meta.json + payload.*
runtime/plans/     # optional convenience mirrors; source of truth is artifacts/
runtime/runs/
runtime/validations/
runtime/reviews/
runtime/logs/
```

Prefer writing under `runtime/artifacts/`. Convenience folders may symlink or copy refs later; do not create a second source of truth.

### Product RE folder ↔ runtime mapping

| Working folder | Primary artifact type | When to mirror |
|----------------|----------------------|----------------|
| `knowledge/` | `knowledge-notes` | After ingest publish |
| `features/` | `feature-inventory` | After ingest publish |
| `business/` | `business-rules` | After ingest publish |
| `product-architecture/` | `product-architecture-notes` | After ingest publish |
| `product/` | `product-model` | After product-analyst publish |
| `workflow/` | `workflow-model` | After workflow-analyzer publish |
| `requirements/` | `requirement-spec` | After requirement-generator publish |
| `acceptance/` | `acceptance-criteria` | After acceptance-criteria-generator publish |

Source of truth remains `runtime/artifacts/`; folders hold templates + published mirrors only.

## Placement rules

| Content | Location |
|---------|----------|
| AIOS conventions | `architecture/` |
| Product architecture observations | `product-architecture/` |
| Machine contracts | `schemas/` |
| Core Engine code | `core/` |
| Policy data | `policies/` |
| Catalogs | `registry/` (`entries` maps) |
| Run outputs | `runtime/` (gitignored) |
| Capability packages | `skills/` `validators/` `reviewers/` |
| Executors | `workers/` (Discovery + Product RE; Feature Workers forbidden) |
| Pipelines | `pipelines/discovery/`, `pipelines/product-re/` |
