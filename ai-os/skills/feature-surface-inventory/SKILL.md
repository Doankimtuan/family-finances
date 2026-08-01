---
name: feature-surface-inventory
description: Reserved product reverse-engineering skill for feature-surface-inventory (alias: feature-surface-inventory).
---

# Feature Surface Inventory

> Discovery only. Extract what exists. Do not redesign. Do not implement features.

## Consumes

docs, discovery-report, app

## Produces

`features/` → artifact type `feature-inventory`

## Procedure

1. Soft-read docs + app route/UI surfaces and discovery-report soft inputs.
2. Inventory features/screens/actions as they exist (routes, review queue, jars, budgets).
3. Write feature-inventory staging artifact; optionally mirror under features/.
4. Stop for validation/review. Do not invent features.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
