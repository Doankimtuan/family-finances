# Framework Generator

**Pipeline:** `framework-generator` · **Framework version:** 0.9.0

Self-extensible scaffolding for Workers, Validators, Reviewers, Pipelines, and supporting artifacts.

## Layout

| Path | Purpose |
|------|---------|
| `generators/` | Per-generator output partitions and templates |
| `bootstrap/` | Project bootstrap scaffolds |
| `scaffolding/` | Shared scaffolding utilities |
| `core/packages/templates/` | Generator-specific template overrides |
| `registries/` | Planned registry patches (not applied in packaging) |
| `catalog/` | Worker, schema, and template catalogs |

## Stop condition

Packaging milestone — **do not execute generation**. Plans only.
