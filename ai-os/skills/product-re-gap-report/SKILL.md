---
name: product-re-gap-report
description: Reserved product reverse-engineering skill for product-re-gap-report (alias: product-re-gap-report).
---

# Product RE Gap Report

> Discovery only. Extract what exists. Do not redesign. Do not implement features.

## Consumes

`product/`, `workflow/`, `requirements/`, `acceptance/`, `knowledge/`, `features/`, `business/`, `product-architecture/`

## Produces

(gap report artifact only) → artifact type `product-re-gap`

## Procedure

1. Load product/, workflow/, requirements/, acceptance/ and ingest mirrors.
2. List coverage gaps, missing source_paths, and unresolved open questions with severity.
3. Write product-re-gap staging artifact.
4. Stop for validation/review. Do not redesign.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
