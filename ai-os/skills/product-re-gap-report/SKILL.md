---
name: product-re-gap-report
description: Synthesize product-re-gap coverage gaps across ingest and transform outputs into gaps/.
---

# Product RE Gap Report

> Discovery only. List coverage gaps. Do not redesign to close them.

## Consumes

`product/`, `workflow/`, `requirements/`, `acceptance/`, `knowledge/`, `features/`, `business/`, `product-architecture/`

## Produces

`gaps/` → `product-re-gap`

## Ownership

- **Owns:** coverage gaps with severity
- **Hard-deps:** ingest + transform workers

## Procedure

1. Load transform and ingest mirrors.
2. List gaps with `severity` and `source_paths`.
3. Write `product-re-gap`; mirror under `gaps/`.
4. Stop for validation/review.

## Heuristics

- Prefer concrete missing coverage over vague research asks.
- Do not invent features as gap-closures.

## Done when

- ≥1 gap entry with severity + sources
- No redesign proposals

## Negative examples

- Do not recommend a new Feature Worker as the gap fix.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
