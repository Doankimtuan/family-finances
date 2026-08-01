---
name: product-architecture-observer
description: Observe product architecture into artifacts/product-architecture/ from doc-source and discovery-report. Never AIOS docs/architecture/.
---

# Product Architecture Observer

> Discovery only. Product architecture only. Never AIOS control-plane docs.

## Consumes

`doc-source`, `discovery-report` → produces `artifacts/product-architecture/`

## Produces

`artifacts/product-architecture/` → `product-architecture-notes`

## Ownership

- **Owns:** product pillars, module boundaries, real-vs-virtual split
- **Excludes:** glossary; rule text; feature routes
- **Forbidden:** AIOS `docs/architecture/` as product sources

## Procedure

1. Soft-read `doc-source` and `discovery-report` for product structure only.
2. Record pillars/boundaries/modules as `product-architecture-notes`.
3. Set `entry_kind` ∈ {pillar, boundary, module}; cite product sources only.
4. Optionally mirror under `artifacts/product-architecture/`.
5. Stop for artifacts/validation/review.

## Done when

- ≥1 pillar/boundary/module with sources
- Zero citations to AIOS control-plane architecture docs

## Negative examples

- Do not ingest OVERVIEW.md / TRACEABILITY.md as product architecture.

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
