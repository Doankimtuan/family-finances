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
7. Core Engine may **load and validate** pipelines; it still does not invoke workers in v0.5.x.

## Registered pipelines (v0.5.0)

| Pipeline | Purpose | Feature Workers |
|----------|---------|-----------------|
| `pipelines/discovery/` | Framework/repo discovery → `discovery-report` | forbidden |
| `pipelines/product-re/` | Product reverse engineering → product knowledge chain | forbidden |
| `pipelines/solution-architecture/` | Solution redesign → architecture-v2 / tech-stack / migration / folder-structure | forbidden |

### Handoffs

- Discovery → Product RE: soft-read only (no hard cross-pipeline edges).
- Product RE → Solution Architecture: soft-read validated consume packs (`knowledge/`, `features/`, `business/`, `product-architecture/`, `requirements/`, `quality/`). Do not overwrite Product RE outputs.
- Logical `architecture/` consume for Solution Architecture resolves to `product-architecture/`.
