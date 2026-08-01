# Pipeline Contract

A **pipeline** binds registered workers into ordered waves with an explicit dependency graph.

## Normative files

| File | Schema |
|------|--------|
| `core/packages/pipelines/<id>/pipeline.json` | `core/packages/schemas/pipeline.schema.json` |
| `core/packages/pipelines/<id>/dependency-graph.json` | `core/packages/schemas/pipeline-dependency-graph.schema.json` |

## Invariants

1. Every `workers[]` id exists in `core/packages/registry/workers.json` and on disk under `core/packages/workers/<id>/`.
2. `dependency_graph_ref.path` resolves under `ai-os/`.
3. Graph node ids ⊆ `workers[]`; every hard edge endpoint is a registered worker.
4. `waves` is a valid topological partition of the hard graph (no edge from later wave into earlier).
5. `allows_feature_workers: false` forbids any worker with `worker_class: feature`.
6. `side_effect_ceiling` is the max side effect any worker in the pipeline may declare.
7. Core Engine may **load and validate** pipelines; it still does not invoke workers in v0.7.x.

## Registered pipelines (v0.7.0)

| Pipeline | Purpose | Feature Workers |
|----------|---------|-----------------|
| `core/packages/pipelines/discovery/` | Framework/repo discovery → `discovery-report` | forbidden |
| `core/packages/pipelines/product-re/` | Product reverse engineering → product knowledge chain | forbidden |
| `core/packages/pipelines/solution-architecture/` | Solution redesign → architecture-v2 / tech-stack / migration / folder-structure | forbidden |
| `core/packages/pipelines/specification-engineering/` | Specs / tasks / roadmap / implementation plan from validated knowledge | forbidden |
| `core/packages/pipelines/validation-engine/` | Automatic validation of AIOS artifacts → findings / scores / reports | forbidden |
| `core/packages/pipelines/review-engine/` | Governance review of validated artifacts → findings / scores / decisions | forbidden |
| `core/packages/pipelines/framework-generator/` | Configuration-driven scaffolding of framework components from capability specs | forbidden |
| `core/packages/pipelines/qualification-framework/` | Evaluate / benchmark / certify AIOS against reference projects | forbidden |
| `core/packages/pipelines/runtime-engine/` | Single-command orchestration of workers / validators / reviewers / pipelines | forbidden |

### Handoffs

- Discovery → Product RE: soft-read only (no hard cross-pipeline edges).
- Product RE → Solution Architecture: soft-read validated consume packs. Do not overwrite Product RE outputs.
- Solution Architecture → Specification Engineering: soft-read validated packs. Do not overwrite upstream.
- Validation Engine: soft-reads `core/packages/schemas/`, `core/packages/workers/`, `core/packages/pipelines/`, `core/packages/templates/`, `artifacts/knowledge/`, `artifacts/`, `artifacts/execution/`; writes only `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/` (and optional `governance/quality/validation-scorecard/` mirror). **Never mutates source packs.**
- Review Engine: assumes Validation Engine PASS; soft-reads artifacts/validation/reports/scores plus domain packs; writes `governance/reviews/`, `governance/`, `governance/decisions/`, `governance/recommendations/`, `governance/improvements/`. **Never mutates, regenerates, or re-validates sources.**
- Framework Generator: soft-reads `core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`; writes scaffold plans to `core/packages/scaffold/`. **Never executes generation or mutates prior workers.**
- Qualification Framework: soft-reads `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`; writes `governance/qualification/` only. **Evaluate only — never modify framework, never regenerate workers, never execute benchmarks in packaging.**
- Runtime Engine: soft-reads `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`; writes `runtime/` only. **Orchestrate only — never mutate core/packages/workers/validators/reviewers; Execution Planner never executes immediately; packaging does not execute workers.**
- Logical `docs/architecture/` consume resolves to `artifacts/product-architecture/` (never AIOS `docs/architecture/` control-plane docs).
- Logical `pipeline/` consume resolves to `core/packages/pipelines/`.

## Capability model (v0.12.0+)

Prefer `docs/capabilities/registry.json` over enumerating workers. `@Run full` expands to:

`discover` → `reverse-engineer` → `architect` → `specify` → `validate` → `review`

`framework-generator` is optional **scaffold**, not on the critical path.

## Produce vs governance roots (v0.13.0)

| Root | Contains |
|------|----------|
| `artifacts/` | All produce packs (product RE, SA, specs, validation outputs) |
| `governance/` | Qualification, policies, reviews, decisions, quality |
| `core/packages/` | Workers, validators, reviewers, pipelines, registry, JSON schemas, templates, scaffold |
| `docs/` | Architecture, capabilities, releases, guides |

Do not store produce outputs under `core/packages/` or control-plane docs under `artifacts/`.

