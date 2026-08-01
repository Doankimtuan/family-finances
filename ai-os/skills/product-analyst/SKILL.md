---
name: product-analyst
description: Reserved product reverse-engineering skill for product-analyst (alias: product-analyst).
---

# Product Analyst

> Discovery only. Extract what exists. Do not redesign. Do not implement features.

## Consumes

`knowledge/`, `features/`, `business/`, `product-architecture/`

## Produces

`product/` → artifact type `product-model`

## Procedure

1. Load knowledge/, features/, business/, product-architecture/ (and their upstream ingest artifacts).
2. Extract identity, personas, value props, and capabilities with entry_kind.
3. Cite source_paths on every entry; write product-model under product/.
4. Stop for validation/review. Do not redesign.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
