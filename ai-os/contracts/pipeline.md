# Pipeline Contract

A **pipeline** binds registered workers into ordered waves with an explicit dependency graph.

## Normative files

| File | Schema |
|------|--------|
| `pipelines/<id>/pipeline.json` | `schemas/pipeline.schema.json` |
| `pipelines/<id>/dependency-graph.json` | `schemas/pipeline-dependency-graph.schema.json` |

## Invariants

1. Every `workers[]` id exists in `registry/workers.json` and on disk under `workers/<id>/`.
2. `dependency_graph_ref.path` resolves under `ai-os/`.
3. Graph node ids ⊆ `workers[]`; every hard edge endpoint is a registered worker.
4. `waves` is a valid topological partition of the hard graph (no edge from later wave into earlier).
5. `allows_feature_workers: false` forbids any worker with `worker_class: feature`.
6. `side_effect_ceiling` is the max side effect any worker in the pipeline may declare.
7. Core Engine may **load and validate** pipelines; it still does not invoke workers in v0.7.x.

## Registered pipelines (v0.7.0)

| Pipeline | Purpose | Feature Workers |
|----------|---------|-----------------|
| `pipelines/discovery/` | Framework/repo discovery → `discovery-report` | forbidden |
| `pipelines/product-re/` | Product reverse engineering → product knowledge chain | forbidden |
| `pipelines/solution-architecture/` | Solution redesign → architecture-v2 / tech-stack / migration / folder-structure | forbidden |
| `pipelines/specification-engineering/` | Specs / tasks / roadmap / implementation plan from validated knowledge | forbidden |
| `pipelines/validation-engine/` | Automatic validation of AIOS artifacts → findings / scores / reports | forbidden |
| `pipelines/review-engine/` | Governance review of validated artifacts → findings / scores / decisions | forbidden |
| `pipelines/framework-generator/` | Configuration-driven scaffolding of framework components from capability specs | forbidden |
| `pipelines/qualification-framework/` | Evaluate / benchmark / certify AIOS against reference projects | forbidden |
| `pipelines/runtime-engine/` | Single-command orchestration of workers / validators / reviewers / pipelines | forbidden |

### Handoffs

- Discovery → Product RE: soft-read only (no hard cross-pipeline edges).
- Product RE → Solution Architecture: soft-read validated consume packs. Do not overwrite Product RE outputs.
- Solution Architecture → Specification Engineering: soft-read validated packs. Do not overwrite upstream.
- Validation Engine: soft-reads `schemas/`, `workers/`, `pipelines/`, `templates/`, `knowledge/`, `artifacts/`, `execution/`; writes only `validation/`, `reports/`, `scores/` (and optional `quality/validation-scorecard/` mirror). **Never mutates source packs.**
- Review Engine: assumes Validation Engine PASS; soft-reads validation/reports/scores plus domain packs; writes `reviews/`, `governance/`, `decisions/`, `recommendations/`, `improvements/`. **Never mutates, regenerates, or re-validates sources.**
- Framework Generator: soft-reads `templates/`, `schemas/`, `workers/`, `validators/`, `reviewers/`, `pipelines/`, `knowledge/`, `configs/`, `artifacts/`, `registry/`; writes scaffold plans to `framework-generator/`. **Never executes generation or mutates prior workers.**
- Qualification Framework: soft-reads `workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`; writes `qualification/` only. **Evaluate only — never modify framework, never regenerate workers, never execute benchmarks in packaging.**
- Runtime Engine: soft-reads `workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`; writes `runtime/` only. **Orchestrate only — never mutate workers/validators/reviewers; Execution Planner never executes immediately; packaging does not execute workers.**
- Logical `architecture/` consume resolves to `product-architecture/` (never AIOS `architecture/` control-plane docs).
- Logical `pipeline/` consume resolves to `pipelines/`.
