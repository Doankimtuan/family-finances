---
name: workflow-analyzer
description: Reserved product reverse-engineering skill for workflow-analyzer (alias: workflow-analyzer).
---

# Workflow Analyzer

> Discovery only. Extract what exists. Do not redesign. Do not implement features.

## Consumes

`product/`, `product-architecture/`, `features/`

## Produces

`workflow/` → artifact type `workflow-model`

## Procedure

1. Load product/ plus product-architecture/ and features/ (do not re-ingest raw knowledge/business).
2. Map end-to-end workflows with actor + step_order on each step entry.
3. Write workflow-model under workflow/.
4. Stop for validation/review. Do not invent steps.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
