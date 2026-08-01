---
name: requirement-generator
description: Reserved product reverse-engineering skill for requirement-generator (alias: requirement-extractor).
---

# Requirement Extractor

> Discovery only. Extract what exists. Do not redesign. Do not implement features.

## Consumes

`product/`, `workflow/`, `business/`

## Produces

`requirements/` → artifact type `requirement-spec`

## Procedure

1. Load product/, workflow/, and business/ only (narrow consumes).
2. Extract SHALL/MUST requirements traceable to those sources; set entry_kind=shall.
3. Write requirement-spec under requirements/. Worker id is historical; behave as extractor.
4. Stop for validation/review. Do not invent requirements.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
