---
name: product-architecture-observer
description: Reserved product reverse-engineering skill for product-architecture-observer (alias: product-architecture-observer).
---

# Product Architecture Observer

> Discovery only. Extract what exists. Do not redesign. Do not implement features.

## Consumes

docs, discovery-report

## Produces

`product-architecture/` → artifact type `product-architecture-notes`

## Procedure

1. Soft-read docs/DOMAIN_MODEL.md and product modules/routes.
2. Record product pillars and boundaries into product-architecture/ only.
3. Never cite ai-os/architecture/ as product architecture source.
4. Write product-architecture-notes; stop for validation/review.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
