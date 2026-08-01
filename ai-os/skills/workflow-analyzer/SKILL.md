---
name: workflow-analyzer
description: Extract ordered workflow-model steps from product, product-architecture, and features packs.
---

# Workflow Analyzer

> Discovery only. Map observed flows. Do not invent steps.

## Consumes

`artifacts/product/`, `artifacts/product-architecture/`, `artifacts/features/`

## Produces

`artifacts/workflow/` → `workflow-model`

## Ownership

- **Owns:** ordered steps with actor + step_order
- **Does not** re-ingest artifacts/knowledge/ or artifacts/business/

## Procedure

1. Load product-model plus product-architecture and features packs.
2. Map end-to-end flows with actor + step_order on each step.
3. Cite `source_paths`; write `workflow-model` under `artifacts/workflow/`.
4. Stop for artifacts/validation/review.

## Heuristics

- Steps must be observable in sources.
- Keep step_order contiguous starting at 1 within a flow.

## Done when

- ≥1 step with actor + step_order + sources
- No invented steps

## Negative examples

- Do not add an unmentioned approval committee step.

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
