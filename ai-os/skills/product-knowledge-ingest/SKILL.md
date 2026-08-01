---
name: product-knowledge-ingest
description: Reserved product reverse-engineering skill for product-knowledge-ingest (alias: product-knowledge-ingest).
---

# Product Knowledge Ingest

> Discovery only. Extract what exists. Do not redesign. Do not implement features.

## Consumes

docs, discovery-report

## Produces

`knowledge/` → artifact type `knowledge-notes`

## Procedure

1. Soft-read docs/DOMAIN_MODEL.md and any published discovery-report artifacts (no hard cross-pipeline edge).
2. Extract glossary terms, entities, and domain facts that already exist.
3. Write knowledge-notes staging artifact; optionally mirror under knowledge/.
4. Stop for validation/review. Do not redesign.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
