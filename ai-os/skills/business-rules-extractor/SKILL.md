---
name: business-rules-extractor
description: Reserved product reverse-engineering skill for business-rules-extractor (alias: business-rules-extractor).
---

# Business Rules Extractor

> Discovery only. Extract what exists. Do not redesign. Do not implement features.

## Consumes

docs, discovery-report

## Produces

`business/` → artifact type `business-rules`

## Procedure

1. Soft-read docs/DOMAIN_MODEL.md and domain engines described therein.
2. Extract observed rules (virtual jars, review queue resolution, tenant scope).
3. Write business-rules staging artifact; optionally mirror under business/.
4. Stop for validation/review. Do not invent policies.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
